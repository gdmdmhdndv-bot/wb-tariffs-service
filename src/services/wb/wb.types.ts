/**
 * Raw warehouse entry as returned by the WB API.
 * All numeric values come as strings with Russian decimal comma (e.g. "89,7").
 * Unavailable marketplace fields are represented as "-".
 */
export interface WbWarehouseTariffRaw {
    /** Warehouse name */
    warehouseName: string;
    /** Geographic region name (may be empty string) */
    geoName: string;
    /** Base delivery cost string, e.g. "46" or "89,7" */
    boxDeliveryBase: string;
    /** Per-liter delivery cost string */
    boxDeliveryLiter: string;
    /** Delivery coefficient (%) string, e.g. "100" or "195" */
    boxDeliveryCoefExpr: string;
    /** Marketplace base delivery cost string or "-" if N/A */
    boxDeliveryMarketplaceBase: string;
    /** Marketplace per-liter delivery cost string or "-" if N/A */
    boxDeliveryMarketplaceLiter: string;
    /** Marketplace delivery coefficient string or "-" if N/A */
    boxDeliveryMarketplaceCoefExpr: string;
    /** Base storage cost string */
    boxStorageBase: string;
    /** Per-liter storage cost string */
    boxStorageLiter: string;
    /** Storage coefficient (%) string */
    boxStorageCoefExpr: string;
}

/** Warehouse tariff entry after parsing strings to numbers */
export interface WbWarehouseTariff {
    warehouseName: string;
    geoName: string;
    boxDeliveryBase: number;
    boxDeliveryLiter: number;
    boxDeliveryCoefExpr: number;
    boxDeliveryMarketplaceBase: number | null;
    boxDeliveryMarketplaceLiter: number | null;
    boxDeliveryMarketplaceCoefExpr: number | null;
    boxStorageBase: number;
    boxStorageLiter: number;
    boxStorageCoefExpr: number;
}

/** Raw API response envelope */
export interface WbBoxTariffsResponseRaw {
    response: {
        data: {
            /** Date when the next tariff update takes effect (may be empty string) */
            dtNextBox: string;
            /** Maximum validity date for current tariffs */
            dtTillMax: string;
            warehouseList: WbWarehouseTariffRaw[];
        };
    };
}

/** Parsed tariff data ready for storage */
export interface WbBoxTariffsData {
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: WbWarehouseTariff[];
}

/** Row stored in the database */
export interface WbBoxTariffRow {
    id?: number;
    tariff_date: string;
    dt_next_box: string | null;
    dt_till_max: string | null;
    warehouse_name: string;
    geo_name: string | null;
    box_delivery_base: number;
    box_delivery_liter: number;
    box_delivery_coef_expr: number;
    box_delivery_marketplace_base: number | null;
    box_delivery_marketplace_liter: number | null;
    box_delivery_marketplace_coef_expr: number | null;
    box_storage_base: number;
    box_storage_liter: number;
    box_storage_coef_expr: number;
    updated_at?: string;
}
