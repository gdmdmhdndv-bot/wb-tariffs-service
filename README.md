# WB Tariffs Service

Сервис сбора тарифов коробочной доставки Wildberries с записью в PostgreSQL и синхронизацией в Google Таблицы.

**Стек:** Node.js 20 · TypeScript · PostgreSQL 16 · Knex.js · googleapis · node-cron · Docker

## Как работает

| Расписание | Действие |
|---|---|
| каждый час в **:00** | GET `/api/v1/tariffs/box` → upsert в `wb_box_tariffs` (ключ: `tariff_date` + `warehouse_name`) |
| каждый час в **:05** | Читает актуальные тарифы из БД → обновляет лист `stocks_coefs` в N Google Таблицах (сортировка по коэф. доставки ASC) |

При старте оба задания выполняются сразу. Миграции запускаются автоматически.

## Запуск

### 1. Клонировать и настроить `.env`

```bash
git clone https://github.com/gdmdmhdndv-bot/wb-tariffs-service.git
cd wb-tariffs-service
cp .env.example .env
```

Заполнить в `.env`:

```env
WB_API_TOKEN=           # Bearer-токен из личного кабинета WB
GOOGLE_SERVICE_ACCOUNT_EMAIL=   # client_email из JSON-ключа
GOOGLE_PRIVATE_KEY=             # private_key из JSON-ключа
GOOGLE_SPREADSHEET_IDS=         # ID таблиц через запятую (N штук)
```

> DB-переменные уже прописаны в `.env.example` — менять не нужно.

### 2. Настроить Google Sheets

1. [Google Cloud Console](https://console.cloud.google.com) → включить **Google Sheets API**
2. IAM → Service Accounts → Create → Keys → JSON (скачать)
3. Создать таблицу → поделиться с `client_email` (роль **Редактор**)
4. ID таблицы — из URL: `.../spreadsheets/d/**ID**/edit`

Лист `stocks_coefs` создаётся автоматически.

### 3. Запустить

```bash
docker compose up
```

Остановить: `docker compose down`
Сбросить БД: `docker compose down -v`

## Проверка

**Логи:**
```bash
docker compose logs -f app
```
```
[INFO] fetch-tariffs - Received 82 warehouse tariff entries from WB API
[INFO] update-sheets - Google Sheets updated successfully
[INFO] app - === Service is running ===
```

**БД:**
```bash
docker compose exec postgres psql -U postgres -c \
  "SELECT warehouse_name, box_delivery_coef_expr FROM wb_box_tariffs WHERE tariff_date = CURRENT_DATE ORDER BY box_delivery_coef_expr LIMIT 5;"
```

**Google Таблица** — лист `stocks_coefs` с данными по всем складам, отсортированными по коэффициенту.

## Локальная разработка

```bash
npm install
docker compose up postgres -d   # только БД
npm run dev                      # hot reload через tsx
```
