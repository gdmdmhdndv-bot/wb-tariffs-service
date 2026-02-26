import { knex } from "#postgres/knex.js";
import type { WbBoxTariffsData, WbBoxTariffRow } from "#services/wb/wb.types.js";

const TABLE = "wb_box_tariffs";

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

export async function getLatestTariffs(): Promise<WbBoxTariffRow[]> {
    return knex(TABLE)
        .where("tariff_date", knex(TABLE).max("tariff_date"))
        .orderBy("box_delivery_coef_expr", "asc");
}
