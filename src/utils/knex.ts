import { fileURLToPath } from "url";
import path from "path";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const knexfile = path.resolve(__dirname, isDev ? "../config/knex/knexfile.ts" : "../config/knex/knexfile.js");

const args = process.argv.slice(2);
const result = spawnSync(
    "npx",
    ["knex", "--knexfile", knexfile, ...args],
    { stdio: "inherit", shell: true },
);

process.exit(result.status ?? 0);
