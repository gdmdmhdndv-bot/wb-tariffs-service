import { google } from "googleapis";
import { env } from "#config/env/env.js";
import type { WbBoxTariffRow } from "#services/wb/wb.types.js";

const SHEET_NAME = "stocks_coefs";

const HEADERS = [
    "Дата тарифа",
    "Склад",
    "Регион",
    "Коэф. доставки (%)",
    "Доставка база (руб.)",
    "Доставка за литр (руб.)",
    "Коэф. доставки МП (%)",
    "Доставка МП база (руб.)",
    "Доставка МП за литр (руб.)",
    "Коэф. хранения (%)",
    "Хранение база (руб.)",
    "Хранение за литр (руб.)",
    "Действует до",
    "Обновлено",
];

function createSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
}

function rowToSheetValues(row: WbBoxTariffRow): (string | number)[] {
    return [
        row.tariff_date,
        row.warehouse_name,
        row.geo_name ?? "",
        row.box_delivery_coef_expr,
        row.box_delivery_base,
        row.box_delivery_liter,
        row.box_delivery_marketplace_coef_expr ?? "",
        row.box_delivery_marketplace_base ?? "",
        row.box_delivery_marketplace_liter ?? "",
        row.box_storage_coef_expr,
        row.box_storage_base,
        row.box_storage_liter,
        row.dt_till_max ?? "",
        row.updated_at ?? "",
    ];
}

async function updateSpreadsheet(
    sheetsClient: ReturnType<typeof google.sheets>,
    spreadsheetId: string,
    rows: WbBoxTariffRow[],
): Promise<void> {
    const spreadsheet = await sheetsClient.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some((s) => s.properties?.title === SHEET_NAME);

    if (!sheetExists) {
        await sheetsClient.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
            },
        });
    }

    await sheetsClient.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_NAME}!A:Z`,
    });

    const values = [HEADERS, ...rows.map(rowToSheetValues)];

    await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
    });
}

export async function updateAllSheets(rows: WbBoxTariffRow[]): Promise<void> {
    const sheets = createSheetsClient();
    const spreadsheetIds = env.GOOGLE_SPREADSHEET_IDS;

    const results = await Promise.allSettled(
        spreadsheetIds.map((id) => updateSpreadsheet(sheets, id, rows)),
    );

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            throw new Error(`Failed to update spreadsheet ${spreadsheetIds[index]}: ${result.reason}`);
        }
    });
}
