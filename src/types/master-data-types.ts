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
// ITEM MASTER - กำหนดรหัสสินค้า
// ====================================================================================

/**
 * ItemMaster - ข้อมูลสินค้า
 */
export interface ItemMaster extends BaseMasterData {
    item_id: string;
    item_code: string;
    item_name: string;
    barcode?: string;
    category_id?: string;
    category_name: string;
    item_type_id?: string;
    item_type_name?: string;
    unit_id?: string;
    unit_name: string;
    purchasing_unit_id?: string;
    purchasing_unit_name?: string;
    sales_unit_id?: string;
    sales_unit_name?: string;
    tax_code?: string;
    is_active: boolean;
}

/**
 * ItemMasterFormData - สำหรับ Frontend Form
 */
export interface ItemMasterFormData {
    itemCode: string;
    itemCodeSearch: string;
    itemName: string;
    barcode: string;
    mainUnit: string;
    productCategory: string;
    itemType: string;
    purchasingUnit: string;
    salesUnit: string;
    taxCode: string;
    isActive: boolean;
}

/**
 * ItemListItem - สำหรับแสดงในตาราง
 */
export interface ItemListItem {
    item_id: string;
    item_code: string;
    item_name: string;
    category_name: string;
    unit_name: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new item master */
export const initialItemMasterFormData: ItemMasterFormData = {
    itemCode: '',
    itemCodeSearch: '',
    itemName: '',
    barcode: '',
    mainUnit: '',
    productCategory: '',
    itemType: '',
    purchasingUnit: '',
    salesUnit: '',
    taxCode: '',
    isActive: true,
};

// ====================================================================================
// ITEM UOM CONVERSION - แปลงหน่วย (หลายหน่วยนับ)
// ====================================================================================

/**
 * ItemUOMConversion - ข้อมูลการแปลงหน่วย
 */
export interface ItemUOMConversion {
    conversion_id: string;
    item_id: string;
    item_code: string;
    item_name: string;
    from_unit_id: string;
    from_unit_name: string;
    to_unit_id: string;
    to_unit_name: string;
    conversion_factor: number;
    is_purchase_unit: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * UOMConversionFormData - สำหรับ Frontend Form
 */
export interface UOMConversionFormData {
    itemCode: string;
    itemName: string;
    fromUnit: string;
    toUnit: string;
    conversionFactor: number;
    isPurchaseUnit: boolean;
}

/**
 * UOMConversionListItem - สำหรับแสดงในตาราง
 */
export interface UOMConversionListItem {
    conversion_id: string;
    item_code: string;
    item_name: string;
    from_unit_name: string;
    to_unit_name: string;
    conversion_factor: number;
    is_purchase_unit: boolean;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new UOM Conversion */
export const initialUOMConversionFormData: UOMConversionFormData = {
    itemCode: '',
    itemName: '',
    fromUnit: '',
    toUnit: '',
    conversionFactor: 0,
    isPurchaseUnit: false,
};

// ====================================================================================
// ITEM BARCODE - บาร์โค้ดหลายรายการ/หลายหน่วย
// ====================================================================================

/**
 * ItemBarcode - ข้อมูลบาร์โค้ดสินค้า
 */
export interface ItemBarcode {
    barcode_id: string;
    item_id: string;
    item_code: string;
    item_name: string;
    barcode: string;
    unit_id?: string;
    unit_name?: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * ItemBarcodeFormData - สำหรับ Frontend Form
 */
export interface ItemBarcodeFormData {
    itemCode: string;
    itemName: string;
    barcode: string;
    linkedUnit: string;
    isPrimary: boolean;
}

/**
 * ItemBarcodeListItem - สำหรับแสดงในตาราง
 */
export interface ItemBarcodeListItem {
    barcode_id: string;
    item_code: string;
    item_name: string;
    barcode: string;
    unit_name?: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new Item Barcode */
export const initialItemBarcodeFormData: ItemBarcodeFormData = {
    itemCode: '',
    itemName: '',
    barcode: '',
    linkedUnit: '',
    isPrimary: false,
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

// ====================================================================================
// COST CENTER - ศูนย์ต้นทุน
// ====================================================================================

/**
 * CostCenter - ข้อมูลศูนย์ต้นทุน (ย้ายมาจาก pr-types.ts)
 */
export interface CostCenter {
  cost_center_id: string;           // UUID - Primary Key
  cost_center_code: string;         // VARCHAR(50) - CC-IT, CC-HR
  cost_center_name: string;         // VARCHAR(200)
  description?: string;             // TEXT
  budget_amount: number;            // DECIMAL(18,2)
  manager_name: string;             // VARCHAR(200)
  is_active: boolean;               // BOOLEAN
}

// ====================================================================================
// PROJECT - โครงการ
// ====================================================================================

/**
 * ProjectStatus - สถานะโครงการ
 */
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

/**
 * Project - ข้อมูลโครงการ (ย้ายมาจาก pr-types.ts)
 */
export interface Project {
  project_id: string;               // UUID - Primary Key
  project_code: string;             // VARCHAR(50) - PRJ-2026-001
  project_name: string;             // VARCHAR(500)
  description?: string;             // TEXT
  cost_center_id: string;           // UUID FK → cost_center
  budget_amount: number;            // DECIMAL(18,2)
  start_date: string;               // DATE
  end_date: string;                 // DATE
  status: ProjectStatus;
}

// ====================================================================================
// APPROVAL WORKFLOW - กำหนด Flow การอนุมัติ
// ====================================================================================

/**
 * ApprovalDocType - ประเภทเอกสารที่ต้องอนุมัติ
 */
export type ApprovalDocType = 'PR' | 'PO' | 'GRN' | 'INVOICE';

/**
 * ApprovalFlow - ตารางกำหนดเงื่อนไขการอนุมัติ (approval_flow)
 */
export interface ApprovalFlow {
    flow_id: string;                // UUID - Primary Key
    doc_type: ApprovalDocType;      // ประเภทเอกสาร
    min_amount: number;             // วงเงินต่ำสุด
    max_amount: number;             // วงเงินสูงสุด
    
    // Relations
    approval_flow_steps?: ApprovalFlowStep[];
}

/**
 * ApprovalFlowStep - ขั้นตอนการอนุมัติ (approval_flow_step)
 */
export interface ApprovalFlowStep {
    step_id: string;                // UUID - Primary Key
    flow_id: string;                // FK -> approval_flow
    approver_user_id: string;       // User ที่ต้องอนุมัติในขั้นตอนนี้
    sequence_no: number;            // ลำดับการอนุมัติ (1, 2, 3...)
}
