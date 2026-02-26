import cron from "node-cron";
import { runMigrations } from "#postgres/knex.js";
import { fetchTariffsJob } from "#jobs/fetch-tariffs.job.js";
import { updateSheetsJob } from "#jobs/update-sheets.job.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger("app");

async function bootstrap(): Promise<void> {
    logger.info("=== WB Tariffs Service starting ===");

    // 1. Run database migrations
    logger.info("Running database migrations...");
    await runMigrations();
    logger.info("Database migrations complete");

    // 2. Run jobs immediately on startup so we don't wait for the first cron tick
    logger.info("Running initial jobs on startup...");
    await fetchTariffsJob();
    try {
        await updateSheetsJob();
    } catch (err) {
        logger.error("Initial sheets update failed (will retry on next cron tick):", err);
    }

    // 3. Schedule hourly tariff fetch: runs at the start of every hour
    //    e.g. 01:00, 02:00, 03:00 ...
    cron.schedule("0 * * * *", async () => {
        try {
            await fetchTariffsJob();
        } catch {
            logger.error("Scheduled fetchTariffsJob failed (will retry next hour)");
        }
    });

    // 4. Schedule hourly sheets update: runs 5 minutes after every hour
    //    slight offset so the DB is populated before we read it
    cron.schedule("5 * * * *", async () => {
        try {
            await updateSheetsJob();
        } catch {
            logger.error("Scheduled updateSheetsJob failed (will retry next hour)");
        }
    });

    logger.info("Cron jobs scheduled (fetch: :00, sheets: :05 every hour)");
    logger.info("=== Service is running ===");
}

bootstrap().catch((err: unknown) => {
    logger.error("Fatal error during bootstrap:", err);
    process.exit(1);
});
