import { getLatestTariffs } from "#services/tariffs/tariffs.service.js";
import { updateAllSheets } from "#services/sheets/sheets.service.js";
import { getLogger } from "#utils/logger.js";
import { env } from "#config/env/env.js";

const logger = getLogger("update-sheets");

/**
 * Reads the latest day's tariff data from the database (sorted by delivery coefficient ASC)
 * and pushes it to all configured Google Sheets.
 */
export async function updateSheetsJob(): Promise<void> {
    logger.info(`Starting Google Sheets update for ${env.GOOGLE_SPREADSHEET_IDS.length} spreadsheet(s)`);

    try {
        const rows = await getLatestTariffs();

        if (rows.length === 0) {
            logger.warn("No tariff data found in the database — skipping sheets update");
            return;
        }

        logger.info(`Pushing ${rows.length} rows (sorted by delivery coefficient ASC) to sheets`);
        await updateAllSheets(rows);
        logger.info("Google Sheets updated successfully");
    } catch (error) {
        logger.error("Failed to update Google Sheets:", error);
        throw error;
    }
}
