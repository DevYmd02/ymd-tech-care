/**
 * @file inventory-master.types.ts
 * @description Type definitions for Inventory Master Data entities
 * @usage import type { Brand, Color, ... } from './inventory-master.types';
 */

import type { IBaseMaster, IBaseFormData } from '@/shared/types/common-master.types';

// ====================================================================================
// RE-EXPORT BASE TYPES FOR CONVENIENCE (Local compatibility)
// ====================================================================================

export type { IBaseMaster, IBaseFormData };

// ====================================================================================
// ITEM GROUP - กลุ่มสินค้า
// ====================================================================================

export interface ItemGroup extends IBaseMaster {
    item_group_id: number;
}

export type ItemGroupFormData = IBaseFormData;

// ====================================================================================
// BRAND - ยี่ห้อสินค้า
// ====================================================================================

export interface Brand extends IBaseMaster {
    brand_id: number;
}

export type BrandFormData = IBaseFormData;

// ====================================================================================
// PATTERN - รูปแบบสินค้า
// ====================================================================================

export interface Pattern extends IBaseMaster {
    pattern_id: number;
}

export type PatternFormData = IBaseFormData;

// ====================================================================================
// DESIGN - การออกแบบสินค้า
// ====================================================================================

export interface Design extends IBaseMaster {
    design_id: number;
}

export type DesignFormData = IBaseFormData;

// ====================================================================================
// GRADE - เกรดสินค้า
// ====================================================================================

export interface Grade extends IBaseMaster {
    grade_id: number;
}

export type GradeFormData = IBaseFormData;

// ====================================================================================
// MODEL - รุ่นสินค้า
// ====================================================================================

export interface Model extends IBaseMaster {
    model_id: number;
}

export type ModelFormData = IBaseFormData;

// ====================================================================================
// SIZE - ขนาดสินค้า
// ====================================================================================

export interface Size extends IBaseMaster {
    size_id: number;
}

export type SizeFormData = IBaseFormData;

// ====================================================================================
// COLOR - สีสินค้า
// ====================================================================================

export interface Color extends IBaseMaster {
    color_id: number;
    hex_code?: string; // Optional hex color code
}

export interface ColorFormData extends IBaseFormData {
    hexCode?: string;
}

// ====================================================================================
// LOCATION - ที่เก็บสินค้า
// ====================================================================================

export interface Location extends IBaseMaster {
    location_id: number;
    warehouse_id?: number; // Reference to warehouse
}

export interface LocationFormData extends IBaseFormData {
    warehouseId?: number;
}

// ====================================================================================
// SHELF - ชั้นวางสินค้า
// ====================================================================================

export interface Shelf extends IBaseMaster {
    shelf_id: number;
    location_id?: number; // Reference to location
}

export interface ShelfFormData extends IBaseFormData {
    locationId?: number;
}

// ====================================================================================
// LOT NO - Lot No สินค้า
// ====================================================================================

export interface LotNo extends IBaseMaster {
    lot_no_id: number;
    expiry_date?: string;
}

export interface LotNoFormData extends IBaseFormData {
    expiryDate?: string;
}

// ====================================================================================
// TYPE EXPORTS FOR CONVENIENCE
// ====================================================================================

export type InventoryMasterType = 
    | ItemGroup 
    | Brand 
    | Pattern 
    | Design 
    | Grade 
    | Model 
    | Size 
    | Color 
    | Location 
    | Shelf 
    | LotNo;
