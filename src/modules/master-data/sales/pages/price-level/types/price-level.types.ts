/**
 * @file price-level.types.ts
 * @description Price Level types for Master Data
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// MASTER DATA TYPES (API)
// ====================================================================================

export interface PriceLevel extends BaseMasterData {
    item_id: string; // uuid (PK)
    uom_id: string; // uuid (FK)
    item_from_qty: number; // int(4)
    item_to_qty: number; // money(8)
    item_price1: number; // money(8)
    item_price2: number; // money(8)
    item_price3: number; // money(8)
    item_price4: number; // money(8)
    item_price5: number; // money(8)
    item_price6: number; // money(8)
    item_price7: number; // money(8)
    item_price8: number; // money(8)
    item_price9: number; // money(8)
    item_price10: number; // money(8)
    listno: number; // smallint(2)
    item_name: string; // varchar(255)
    item_name_en: string; // varchar(255)
    
    // Virtual fields for UI
    uom_name?: string;
    item_code?: string;
}

// ====================================================================================
// FORM DATA TYPES (UI)
// ====================================================================================

export interface PriceLevelFormData {
    itemId: string;
    uomId: string;
    itemFromQty: number;
    itemToQty: number;
    itemPrice1: number;
    itemPrice2: number;
    itemPrice3: number;
    itemPrice4: number;
    itemPrice5: number;
    itemPrice6: number;
    itemPrice7: number;
    itemPrice8: number;
    itemPrice9: number;
    itemPrice10: number;
    listno?: number;
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
