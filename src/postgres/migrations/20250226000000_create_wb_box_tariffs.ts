import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wb_box_tariffs", (table) => {
        table.increments("id").primary();

        // The date for which these tariffs apply (one record per warehouse per day)
        table.date("tariff_date").notNullable();

        // Metadata from API response
        table.date("dt_next_box").nullable();
        table.date("dt_till_max").nullable();

        // Warehouse info
        table.string("warehouse_name", 255).notNullable();
        table.string("geo_name", 255).nullable();

        // Delivery tariffs (seller → buyer via WB warehouse)
        table.decimal("box_delivery_base", 10, 2).notNullable().defaultTo(0);
        table.decimal("box_delivery_liter", 10, 2).notNullable().defaultTo(0);
        table.decimal("box_delivery_coef_expr", 10, 2).notNullable().defaultTo(0);

        // Marketplace delivery tariffs (nullable — "-" in API means not applicable)
        table.decimal("box_delivery_marketplace_base", 10, 2).nullable();
        table.decimal("box_delivery_marketplace_liter", 10, 2).nullable();
        table.decimal("box_delivery_marketplace_coef_expr", 10, 2).nullable();

        // Storage tariffs
        table.decimal("box_storage_base", 10, 2).notNullable().defaultTo(0);
        table.decimal("box_storage_liter", 10, 2).notNullable().defaultTo(0);
        table.decimal("box_storage_coef_expr", 10, 2).notNullable().defaultTo(0);

        table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

        // Unique constraint for upsert (one record per warehouse per day)
        table.unique(["tariff_date", "warehouse_name"]);
    });

    await knex.schema.raw(`
        CREATE INDEX idx_wb_box_tariffs_date
        ON wb_box_tariffs (tariff_date DESC)
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("wb_box_tariffs");
}
