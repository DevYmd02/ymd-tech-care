/**
 * @file price-level.types.ts
 * @description Price Level types for Master Data
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// MASTER DATA TYPES (API)
// ====================================================================================

export interface PriceLevel extends BaseMasterData {
    multi_price_item_id?: number; 
    id?: number; 
    item_id: number;
    uom_id?: number;
    item_uom_id?: number;
    item_from_qty: number | null;
    item_to_qty: number | null;
    item_price1: number | null;
    item_price2: number | null;
    item_price3: number | null;
    item_price4: number | null;
    item_price5: number | null;
    item_price6: number | null;
    item_price7: number | null;
    item_price8: number | null;
    item_price9: number | null;
    item_price10: number | null;
    listno: number | null;
    item_name: string;
    item_name_en: string;
    
    // Virtual fields for UI (Joined)
    uom_name?: string;
    uom_name_en?: string;
    item_code?: string;
    item_uom?: {
        item_uom_id: number;
        from_uom?: {
            uom_name?: string;
            uom_code?: string;
            uom_nameeng?: string;
            uom_name_en?: string;
        } | null;
        factor?: string | number;
    } | null;
}

/**
 * Interface representing the raw structure from the backend API
 */
export interface ApiPriceLevel {
    multi_price_item_id?: number | string;
    id?: number | string;
    item_id?: number | string;
    itemId?: number | string;
    uom_id?: number | string;
    uomId?: number | string;
    item_uom_id?: number | string;
    itemUomId?: number | string;
    item_from_qty?: number | string;
    itemFromQty?: number | string;
    item_to_qty?: number | string;
    itemToQty?: number | string;
    item_price1?: number | string | null;
    item_price2?: number | string | null;
    item_price3?: number | string | null;
    item_price4?: number | string | null;
    item_price5?: number | string | null;
    item_price6?: number | string | null;
    item_price7?: number | string | null;
    item_price8?: number | string | null;
    item_price9?: number | string | null;
    item_price10?: number | string | null;
    listno?: number | string;
    item_name?: string;
    item_name_en?: string;
    item_code?: string;
    uom_name?: string;
    item_uom?: {
        from_uom?: {
            uom_name?: string;
            uom_code?: string;
            uom_nameeng?: string;
            uom_name_en?: string;
        } | null;
    } | null;
}

// ====================================================================================
// FORM DATA TYPES (UI)
// ====================================================================================

export interface PriceLevelFormData {
    itemId: number | string;
    itemUomId: number | string;
    uomId?: number | string;
    itemFromQty: number | null;
    itemToQty: number | null;
    itemPrice1: number | null;
    itemPrice2: number | null;
    itemPrice3: number | null;
    itemPrice4: number | null;
    itemPrice5: number | null;
    itemPrice6: number | null;
    itemPrice7: number | null;
    itemPrice8: number | null;
    itemPrice9: number | null;
    itemPrice10: number | null;
    listno: number | null;
    itemName?: string;
    itemNameEn?: string;
    
    // UI Helpers
    uomName?: string;
    itemCode?: string;
}

export interface PriceLevelFilter {
    search: string;
    page: number;
    limit: number;
}
