# WB Tariffs Service

Сервис для автоматического сбора тарифов на коробочную доставку Wildberries и синхронизации данных в Google Таблицы.

## Что делает сервис

1. **Каждый час (в :00)** — запрашивает актуальные тарифы коробов по [WB API](https://common-api.wildberries.ru/api/v1/tariffs/box) и сохраняет/обновляет их в PostgreSQL. Для каждого склада хранится одна строка на день (`tariff_date` + `warehouse_name` — уникальный ключ).
2. **Каждый час (в :05)** — читает актуальные тарифы из БД и обновляет лист `stocks_coefs` во всех настроенных Google Таблицах. Данные отсортированы по коэффициенту доставки (по возрастанию).
3. **При старте** оба задания выполняются немедленно, не дожидаясь первого тика cron.

## Стек технологий

| Технология | Назначение |
|---|---|
| Node.js 20 + TypeScript | Runtime и язык |
| Knex.js + pg | ORM/query builder + драйвер PostgreSQL |
| PostgreSQL 16 | Хранилище тарифов |
| googleapis | Интеграция с Google Sheets |
| node-cron | Планировщик задач |
| Zod | Валидация переменных окружения |
| log4js | Логирование |
| Docker + Compose | Контейнеризация |

## Структура базы данных

Таблица `wb_box_tariffs`:

| Колонка | Тип | Описание |
|---|---|---|
| `id` | serial | Первичный ключ |
| `tariff_date` | date | Дата тарифа (ключ для upsert) |
| `warehouse_name` | varchar | Название склада (ключ для upsert) |
| `dt_next_box` | date | Дата следующего обновления тарифов |
| `dt_till_max` | date | Максимальная дата действия тарифов |
| `box_delivery_base` | decimal | Базовая стоимость доставки (до 3 л) |
| `box_delivery_liter` | decimal | Стоимость доставки за каждый доп. литр |
| `box_delivery_coef_expr` | decimal | Коэффициент доставки (%) |
| `box_storage_base` | decimal | Базовая стоимость хранения (до 3 л) |
| `box_storage_liter` | decimal | Стоимость хранения за каждый доп. литр |
| `box_storage_coef_expr` | decimal | Коэффициент хранения (%) |
| `updated_at` | timestamptz | Время последнего обновления строки |

## Быстрый старт

### Предварительные требования

- [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Токен WB API (Bearer-токен из личного кабинета Wildberries)
- Google Service Account с доступом к Google Sheets API

### 1. Клонирование репозитория

```bash
git clone <url-репозитория>
cd wb-tariffs-service
```

### 2. Настройка Google Sheets

#### 2.1. Создание Service Account

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект (или выберите существующий)
3. Включите **Google Sheets API**: APIs & Services → Enable APIs → Google Sheets API
4. Создайте Service Account: IAM & Admin → Service Accounts → Create
5. Создайте JSON-ключ: выберите аккаунт → Keys → Add Key → JSON
6. Из скачанного JSON-файла вам понадобятся:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

#### 2.2. Создание Google Таблицы

1. Создайте новую Google Таблицу
2. Поделитесь ей с email сервисного аккаунта (роль **Редактор**)
3. Скопируйте ID таблицы из URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```
   Лист `stocks_coefs` будет создан автоматически при первом запуске.

### 3. Создание файла `.env`

```bash
cp .env.example .env
```

Откройте `.env` и заполните переменные:

```env
# Токен WB API (Bearer)
WB_API_TOKEN=ваш_токен_wb

# Email сервисного аккаунта Google
GOOGLE_SERVICE_ACCOUNT_EMAIL=account@project.iam.gserviceaccount.com

# Приватный ключ из JSON-файла (скопируйте поле private_key целиком)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# ID таблиц через запятую (можно указать N таблиц)
GOOGLE_SPREADSHEET_IDS=id_таблицы_1,id_таблицы_2

# PostgreSQL (оставить без изменений для docker-compose)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### 4. Запуск

```bash
docker compose up
```

Сервис:
1. Запустит контейнер PostgreSQL
2. Дождётся готовности БД (healthcheck)
3. Запустит приложение, которое автоматически выполнит миграции
4. Немедленно запустит оба задания (fetch + sheets)
5. Продолжит выполнять задания по расписанию каждый час

Чтобы запустить в фоне:

```bash
docker compose up -d
```

### 5. Остановка

```bash
docker compose down
```

Для полного сброса (включая данные в БД):

```bash
docker compose down -v
```

---

## Проверка работы

### Логи приложения

```bash
docker compose logs -f app
```

Ожидаемый вывод при успешном старте:
```
[INFO] app - === WB Tariffs Service starting ===
[INFO] app - Running database migrations...
[INFO] app - Database migrations complete
[INFO] app - Running initial jobs on startup...
[INFO] fetch-tariffs - Starting tariff fetch for date: 2025-02-26
[INFO] fetch-tariffs - Received 120 warehouse tariff entries from WB API
[INFO] fetch-tariffs - Upserted 120 tariff entries for date 2025-02-26
[INFO] update-sheets - Starting Google Sheets update for 2 spreadsheet(s)
[INFO] update-sheets - Pushing 120 rows (sorted by delivery coefficient ASC) to sheets
[INFO] update-sheets - Google Sheets updated successfully
[INFO] app - Cron jobs scheduled (fetch: :00, sheets: :05 every hour)
[INFO] app - === Service is running ===
```

### Проверка данных в PostgreSQL

```bash
# Подключиться к БД
docker compose exec postgres psql -U postgres -d postgres

# Посмотреть количество записей
SELECT tariff_date, COUNT(*) FROM wb_box_tariffs GROUP BY tariff_date ORDER BY tariff_date DESC;

# Посмотреть топ-10 тарифов по коэффициенту
SELECT warehouse_name, box_delivery_coef_expr, box_delivery_base
FROM wb_box_tariffs
WHERE tariff_date = CURRENT_DATE
ORDER BY box_delivery_coef_expr ASC
LIMIT 10;
```

### Проверка Google Таблиц

Откройте Google Таблицу и перейдите на лист `stocks_coefs` — он должен содержать:
- Заголовок с названиями колонок
- Строки данных, отсортированные по коэффициенту доставки (от меньшего к большему)

---

## Структура проекта

```
.
├── src/
│   ├── app.ts                          # Точка входа, запуск миграций и cron
│   ├── config/
│   │   ├── env/env.ts                  # Валидация env-переменных (Zod)
│   │   └── knex/knexfile.ts            # Конфигурация Knex
│   ├── postgres/
│   │   ├── knex.ts                     # Singleton Knex + runMigrations()
│   │   └── migrations/
│   │       └── 20250226000000_create_wb_box_tariffs.ts
│   ├── services/
│   │   ├── wb/
│   │   │   ├── wb.service.ts           # Запрос к WB API
│   │   │   └── wb.types.ts             # TypeScript-интерфейсы
│   │   ├── tariffs/
│   │   │   └── tariffs.service.ts      # Upsert и чтение из БД
│   │   └── sheets/
│   │       └── sheets.service.ts       # Обновление Google Таблиц
│   ├── jobs/
│   │   ├── fetch-tariffs.job.ts        # Задача: fetch WB → upsert DB
│   │   └── update-sheets.job.ts        # Задача: DB → Google Sheets
│   └── utils/
│       ├── knex.ts                     # CLI-хелпер для миграций
│       └── logger.ts                   # Настройка log4js
├── .env.example                        # Шаблон переменных окружения
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Разработка (без Docker)

```bash
# Установить зависимости
npm install

# Запустить PostgreSQL локально (или использовать docker-compose для только БД)
docker compose up postgres -d

# Создать .env с POSTGRES_HOST=localhost
cp .env.example .env

# Запустить в режиме разработки (hot reload)
npm run dev
```
