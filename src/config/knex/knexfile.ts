import type { Knex } from "knex";
import { env } from "#config/env/env.js";

const isDev = env.NODE_ENV === "development";

const config: Knex.Config = {
    client: "pg",
    connection: {
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        database: env.POSTGRES_DB,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
    },
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        directory: isDev ? "./src/postgres/migrations" : "./dist/postgres/migrations",
        extension: isDev ? "ts" : "js",
        stub: isDev ? "./src/config/knex/migration.stub.js" : undefined,
    },
};

export default config;
