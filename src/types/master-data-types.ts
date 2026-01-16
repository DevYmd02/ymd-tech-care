/**
 * @file master-data-types.ts
 * @description Types สำหรับ Master Data - Branch, Warehouse, ProductCategory, ItemType, UnitOfMeasure
 * @usage import type { BranchMaster, WarehouseMaster } from '@/types/master-data-types';
 */

// ====================================================================================
// COMMON TYPES
// ====================================================================================

/** Common status for all master data */
export type MasterDataStatus = 'ACTIVE' | 'INACTIVE';

/** Base interface for all master data */
export interface BaseMasterData {
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

// ====================================================================================
// BRANCH - กำหนดรหัสสาขา
// ====================================================================================

/**
 * BranchMaster - ข้อมูลสาขา (ตาม org_branch table)
 */
export interface BranchMaster extends BaseMasterData {
    branch_id: string;
    branch_code: string;
    branch_name: string;
}

/**
 * BranchFormData - สำหรับ Frontend Form
 */
export interface BranchFormData {
    branchCode: string;
    branchCodeSearch: string;
    branchName: string;
    isActive: boolean;
}

/**
 * BranchListItem - สำหรับแสดงในตาราง
 */
export interface BranchListItem {
    branch_id: string;
    branch_code: string;
    branch_name: string;
    is_active: boolean;
    created_at: string;
}

/**
 * BranchDropdownItem - สำหรับ Dropdown/Select
 */
export interface BranchDropdownItem {
    branch_id: string;
    branch_code: string;
    branch_name: string;
}

/** Initial form data สำหรับ new branch */
export const initialBranchFormData: BranchFormData = {
    branchCode: '',
    branchCodeSearch: '',
    branchName: '',
    isActive: true,
};

// ====================================================================================
// WAREHOUSE - กำหนดรหัสคลังสินค้า
// ====================================================================================

/**
 * WarehouseMaster - ข้อมูลคลังสินค้า
 */
export interface WarehouseMaster extends BaseMasterData {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
    branch_id?: string;
    address?: string;
}

/**
 * WarehouseFormData - สำหรับ Frontend Form
 */
export interface WarehouseFormData {
    warehouseCode: string;
    warehouseCodeSearch: string;
    warehouseName: string;
    branchId: string;
    branchName: string; // For display
    address: string;
    isActive: boolean;
}

/**
 * WarehouseListItem - สำหรับแสดงในตาราง
 */
export interface WarehouseListItem {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
    branch_name?: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new warehouse */
export const initialWarehouseFormData: WarehouseFormData = {
    warehouseCode: '',
    warehouseCodeSearch: '',
    warehouseName: '',
    branchId: '',
    branchName: '',
    address: '',
    isActive: true,
};

// ====================================================================================
// PRODUCT CATEGORY - กำหนดรหัสหมวดสินค้า
// ====================================================================================

/**
 * ProductCategoryMaster - ข้อมูลหมวดสินค้า
 */
export interface ProductCategoryMaster extends BaseMasterData {
    category_id: string;
    category_code: string;
    category_name: string;
    category_name_en?: string;
}

/**
 * ProductCategoryFormData - สำหรับ Frontend Form
 */
export interface ProductCategoryFormData {
    categoryCode: string;
    categoryCodeSearch: string;
    categoryName: string;
    categoryNameEn: string;
    isActive: boolean;
}

/**
 * ProductCategoryListItem - สำหรับแสดงในตาราง
 */
export interface ProductCategoryListItem {
    category_id: string;
    category_code: string;
    category_name: string;
    category_name_en?: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new product category */
export const initialProductCategoryFormData: ProductCategoryFormData = {
    categoryCode: '',
    categoryCodeSearch: '',
    categoryName: '',
    categoryNameEn: '',
    isActive: true,
};

// ====================================================================================
// ITEM TYPE - กำหนดรหัสประเภทสินค้า
// ====================================================================================

/**
 * ItemTypeMaster - ข้อมูลประเภทสินค้า
 */
export interface ItemTypeMaster extends BaseMasterData {
    item_type_id: string;
    item_type_code: string;
    item_type_name: string;
    item_type_name_en?: string;
}

/**
 * ItemTypeFormData - สำหรับ Frontend Form
 */
export interface ItemTypeFormData {
    itemTypeCode: string;
    itemTypeCodeSearch: string;
    itemTypeName: string;
    itemTypeNameEn: string;
    isActive: boolean;
}

/**
 * ItemTypeListItem - สำหรับแสดงในตาราง
 */
export interface ItemTypeListItem {
    item_type_id: string;
    item_type_code: string;
    item_type_name: string;
    item_type_name_en?: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new item type */
export const initialItemTypeFormData: ItemTypeFormData = {
    itemTypeCode: '',
    itemTypeCodeSearch: '',
    itemTypeName: '',
    itemTypeNameEn: '',
    isActive: true,
};

// ====================================================================================
// UNIT OF MEASURE - กำหนดรหัสหน่วยนับ
// ====================================================================================

/**
 * UnitMaster - ข้อมูลหน่วยนับ
 */
export interface UnitMaster extends BaseMasterData {
    unit_id: string;
    unit_code: string;
    unit_name: string;
    unit_name_en?: string;
}

/**
 * UnitFormData - สำหรับ Frontend Form
 */
export interface UnitFormData {
    unitCode: string;
    unitCodeSearch: string;
    unitName: string;
    unitNameEn: string;
    isActive: boolean;
}

/**
 * UnitListItem - สำหรับแสดงในตาราง
 */
export interface UnitListItem {
    unit_id: string;
    unit_code: string;
    unit_name: string;
    unit_name_en?: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new unit */
export const initialUnitFormData: UnitFormData = {
    unitCode: '',
    unitCodeSearch: '',
    unitName: '',
    unitNameEn: '',
    isActive: true,
};

// ====================================================================================
// API TYPES - Request/Response (Common for all master data)
// ====================================================================================

/** Generic list params */
export interface MasterDataListParams {
    status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
}

/** Generic list response */
export interface MasterDataListResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

/** Generic API response */
export interface MasterDataResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}
