import cron from "node-cron";
import { runMigrations } from "#postgres/knex.js";
import { fetchTariffsJob } from "#jobs/fetch-tariffs.job.js";
import { updateSheetsJob } from "#jobs/update-sheets.job.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger("app");

async function bootstrap(): Promise<void> {
    logger.info("=== WB Tariffs Service starting ===");

    logger.info("Running database migrations...");
    await runMigrations();
    logger.info("Database migrations complete");

    logger.info("Running initial jobs on startup...");
    await fetchTariffsJob();
    try {
        await updateSheetsJob();
    } catch (err) {
        logger.error("Initial sheets update failed (will retry on next cron tick):", err);
    }

    cron.schedule("0 * * * *", async () => {
        try {
            await fetchTariffsJob();
        } catch {
            logger.error("Scheduled fetchTariffsJob failed (will retry next hour)");
        }
    });

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
