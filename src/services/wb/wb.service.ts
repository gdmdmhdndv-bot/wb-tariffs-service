import axios from "axios";
import { env } from "#config/env/env.js";
import type { WbBoxTariffsData, WbBoxTariffsResponseRaw, WbWarehouseTariffRaw } from "./wb.types.js";

const WB_TARIFFS_URL = "https://common-api.wildberries.ru/api/v1/tariffs/box";

/**
 * Parses a Russian-formatted number string to a float.
 * Returns null for empty strings or "-" (unavailable value).
 *
 * @example parseRuNumber("89,7") → 89.7
 * @example parseRuNumber("-")   → null
 */
function parseRuNumber(value: string): number | null {
    if (!value || value.trim() === "-") return null;
    const num = parseFloat(value.replace(",", "."));
    return isNaN(num) ? null : num;
}

/**
 * Parses a raw warehouse tariff entry, converting all string fields to numbers.
 */
function parseWarehouse(raw: WbWarehouseTariffRaw) {
    return {
        warehouseName: raw.warehouseName,
        geoName: raw.geoName ?? "",
        boxDeliveryBase: parseRuNumber(raw.boxDeliveryBase) ?? 0,
        boxDeliveryLiter: parseRuNumber(raw.boxDeliveryLiter) ?? 0,
        boxDeliveryCoefExpr: parseRuNumber(raw.boxDeliveryCoefExpr) ?? 0,
        boxDeliveryMarketplaceBase: parseRuNumber(raw.boxDeliveryMarketplaceBase),
        boxDeliveryMarketplaceLiter: parseRuNumber(raw.boxDeliveryMarketplaceLiter),
        boxDeliveryMarketplaceCoefExpr: parseRuNumber(raw.boxDeliveryMarketplaceCoefExpr),
        boxStorageBase: parseRuNumber(raw.boxStorageBase) ?? 0,
        boxStorageLiter: parseRuNumber(raw.boxStorageLiter) ?? 0,
        boxStorageCoefExpr: parseRuNumber(raw.boxStorageCoefExpr) ?? 0,
    };
}

/**
 * Fetches box tariff data from the Wildberries API for a given date
 * and parses all string values to numbers.
 *
 * @param date - ISO date string (YYYY-MM-DD); defaults to today
 * @returns Parsed tariff data ready for storage
 */
export async function fetchWbBoxTariffs(date?: string): Promise<WbBoxTariffsData> {
    const targetDate = date ?? new Date().toISOString().split("T")[0];

    const response = await axios.get<WbBoxTariffsResponseRaw>(WB_TARIFFS_URL, {
        params: { date: targetDate },
        headers: {
            Authorization: `Bearer ${env.WB_API_TOKEN}`,
        },
        timeout: 15_000,
    });

    const raw = response.data.response.data;

    return {
        dtNextBox: raw.dtNextBox || null,
        dtTillMax: raw.dtTillMax || null,
        warehouseList: raw.warehouseList.map(parseWarehouse),
    };
}
