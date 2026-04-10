/**
 * @file price-level-name.types.ts
 * @description Types for Price Level Name Lookup Master Data
 * @table item_price_level_name — เพิ่มเติมใช้เพื่อแสดงชื่อเท่านั้น
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// MASTER DATA TYPES (API)
// ====================================================================================

export interface PriceLevelName extends BaseMasterData {
    id: number;
    code: string;
    name: string;
    level_no: number;
}

export interface ApiPriceLevelName {
    id?: number | string;
    code?: string;
    name?: string;
    level_no?: number | string;
    levelNo?: number | string;
}

// ====================================================================================
// FORM DATA TYPES (UI)
// ====================================================================================

export interface PriceLevelNameFormData {
    code: string;
    name: string;
    levelNo: number | string;
}

export interface PriceLevelNameFilter {
    search: string;
    page: number;
    limit: number;
}
