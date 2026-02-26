import { knex } from "#postgres/knex.js";
import type { WbBoxTariffsData, WbBoxTariffRow } from "#services/wb/wb.types.js";

const TABLE = "wb_box_tariffs";

/**
 * Upserts tariff data for a given date into the database.
 * If a record for (tariff_date, warehouse_name) already exists, it is updated in-place.
 *
 * @param data - Parsed WB API response data
 * @param tariffDate - ISO date string (YYYY-MM-DD); defaults to today
 */
export async function upsertTariffs(data: WbBoxTariffsData, tariffDate?: string): Promise<void> {
    const date = tariffDate ?? new Date().toISOString().split("T")[0];

    const rows: Omit<WbBoxTariffRow, "id" | "updated_at">[] = data.warehouseList.map((wh) => ({
        tariff_date: date,
        dt_next_box: data.dtNextBox,
        dt_till_max: data.dtTillMax,
        warehouse_name: wh.warehouseName,
        geo_name: wh.geoName || null,
        box_delivery_base: wh.boxDeliveryBase,
        box_delivery_liter: wh.boxDeliveryLiter,
        box_delivery_coef_expr: wh.boxDeliveryCoefExpr,
        box_delivery_marketplace_base: wh.boxDeliveryMarketplaceBase,
        box_delivery_marketplace_liter: wh.boxDeliveryMarketplaceLiter,
        box_delivery_marketplace_coef_expr: wh.boxDeliveryMarketplaceCoefExpr,
        box_storage_base: wh.boxStorageBase,
        box_storage_liter: wh.boxStorageLiter,
        box_storage_coef_expr: wh.boxStorageCoefExpr,
    }));

    // Process in chunks to avoid hitting query parameter limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        await knex(TABLE)
            .insert(chunk.map((r) => ({ ...r, updated_at: knex.fn.now() })))
            .onConflict(["tariff_date", "warehouse_name"])
            .merge([
                "dt_next_box",
                "dt_till_max",
                "geo_name",
                "box_delivery_base",
                "box_delivery_liter",
                "box_delivery_coef_expr",
                "box_delivery_marketplace_base",
                "box_delivery_marketplace_liter",
                "box_delivery_marketplace_coef_expr",
                "box_storage_base",
                "box_storage_liter",
                "box_storage_coef_expr",
                "updated_at",
            ]);
    }
}

/**
 * Retrieves the latest day's tariff rows, sorted by delivery coefficient ascending.
 *
 * @returns Array of tariff rows sorted by box_delivery_coef_expr ASC
 */
export async function getLatestTariffs(): Promise<WbBoxTariffRow[]> {
    const latestDate = await knex(TABLE).max("tariff_date as max_date").first<{ max_date: string | null }>();

    if (!latestDate?.max_date) {
        return [];
    }

    return knex(TABLE).where("tariff_date", latestDate.max_date).orderBy("box_delivery_coef_expr", "asc");
}
