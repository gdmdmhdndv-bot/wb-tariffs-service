import knexLib from "knex";
import knexConfig from "#config/knex/knexfile.js";

export const knex = knexLib(knexConfig);

export async function runMigrations(): Promise<void> {
    await knex.migrate.latest();
}
