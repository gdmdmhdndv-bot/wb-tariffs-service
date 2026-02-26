export interface WbWarehouseTariffRaw {
    warehouseName: string;
    geoName: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxDeliveryCoefExpr: string;
    boxDeliveryMarketplaceBase: string;
    boxDeliveryMarketplaceLiter: string;
    boxDeliveryMarketplaceCoefExpr: string;
    boxStorageBase: string;
    boxStorageLiter: string;
    boxStorageCoefExpr: string;
}

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

export interface WbBoxTariffsResponseRaw {
    response: {
        data: {
            dtNextBox: string;
            dtTillMax: string;
            warehouseList: WbWarehouseTariffRaw[];
        };
    };
}

export interface WbBoxTariffsData {
    dtNextBox: string | null;
    dtTillMax: string | null;
    warehouseList: WbWarehouseTariff[];
}

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
