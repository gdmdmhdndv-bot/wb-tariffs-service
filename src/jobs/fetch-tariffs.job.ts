import { fetchWbBoxTariffs } from "#services/wb/wb.service.js";
import { upsertTariffs } from "#services/tariffs/tariffs.service.js";
import { getLogger } from "#utils/logger.js";

const logger = getLogger("fetch-tariffs");

/**
 * Fetches the current day's box tariffs from the WB API and upserts them into the database.
 * Designed to run hourly — records for the same day are updated in-place.
 */
export async function fetchTariffsJob(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    logger.info(`Starting tariff fetch for date: ${today}`);

    try {
        const data = await fetchWbBoxTariffs(today);
        const count = data.warehouseList.length;
        logger.info(`Received ${count} warehouse tariff entries from WB API`);

        await upsertTariffs(data, today);
        logger.info(`Upserted ${count} tariff entries for date ${today}`);
    } catch (error) {
        logger.error("Failed to fetch/save WB tariffs:", error);
        throw error;
    }
}
