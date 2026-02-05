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
// COMPANY DOMAIN TYPES
// ====================================================================================

// --- DEPARTMENT (ฝ่าย) ---
export interface DepartmentMaster extends BaseMasterData {
    department_id: string;
    department_code: string;
    department_name: string;
    department_name_en?: string;
}
export interface DepartmentFormData {
    departmentCode: string;
    departmentName: string;
    departmentNameEn: string;
    isActive: boolean;
}
export type DepartmentListItem = DepartmentMaster;

// --- SECTION (แผนก) ---
export interface SectionMaster extends BaseMasterData {
    section_id: string;
    section_code: string;
    section_name: string;
    section_name_en?: string;
    department_id?: string; // Optional link to Department
    department_code?: string; // Added for reference
    department_name?: string;
}
export interface SectionFormData {
    sectionCode: string;
    sectionName: string;
    sectionNameEn: string;
    departmentId: string;
    isActive: boolean;
}
export type SectionListItem = SectionMaster;

// --- JOB (Job) ---
export interface JobMaster extends BaseMasterData {
    job_id: string;
    job_code: string;
    job_name: string;
}
export interface JobFormData {
    jobCode: string;
    jobName: string;
    isActive: boolean;
}
export type JobListItem = JobMaster;

// --- EMPLOYEE GROUP (กลุ่มพนักงาน) ---
export interface EmployeeGroupMaster extends BaseMasterData {
    group_id: string;
    group_code: string;
    group_name: string;
}
export interface EmployeeGroupFormData {
    groupCode: string;
    groupName: string;
    isActive: boolean;
}
export type EmployeeGroupListItem = EmployeeGroupMaster;

// --- POSITION (ตำแหน่ง) ---
export interface PositionMaster extends BaseMasterData {
    position_id: string;
    position_code: string;
    position_name: string;
}
export interface PositionFormData {
    positionCode: string;
    positionName: string;
    isActive: boolean;
}
export type PositionListItem = PositionMaster;

// --- SALES ZONE (เขตการขาย) ---
export interface SalesZoneMaster extends BaseMasterData {
    zone_id: string;
    zone_code: string;
    zone_name: string;
}
export interface SalesZoneFormData {
    zoneCode: string;
    zoneName: string;
    isActive: boolean;
}
export type SalesZoneListItem = SalesZoneMaster;

// --- SALES CHANNEL (ช่องทางการขาย) ---
export interface SalesChannelMaster extends BaseMasterData {
    channel_id: string;
    channel_code: string;
    channel_name: string;
}
export interface SalesChannelFormData {
    channelCode: string;
    channelName: string;
    isActive: boolean;
}
export type SalesChannelListItem = SalesChannelMaster;

// --- SALES TARGET (เป้าการขาย) ---
export interface SalesTargetMaster extends BaseMasterData {
    target_id: string;
    target_code: string; // Maybe Auto-gen?
    target_name: string; // Description
    amount: number;
    year: number;
    period: number; // Month 1-12 or Quarter
}
export interface SalesTargetFormData {
    targetCode: string;
    targetName: string;
    amount: number;
    year: number;
    period: number;
    isActive: boolean;
}
export type SalesTargetListItem = SalesTargetMaster;

// --- EMPLOYEE (พนักงาน) ---
export interface EmployeeMaster extends BaseMasterData {
    employee_id: string;
    employee_code: string;
    employee_name: string; // First + Last
    title_name?: string;   // Mr, Ms
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    position_id?: string;
    position_name?: string;
    department_id?: string;
    department_name?: string;
    status: 'ACTIVE' | 'RESIGNED' | 'SUSPENDED'; // Overrides generic boolean? Or map to boolean
}
// For consistency with other master data forms
export interface EmployeeFormData {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    positionId: string;
    departmentId: string;
    isActive: boolean; // Map to status
}
export type EmployeeListItem = EmployeeMaster;

// ====================================================================================
// WAREHOUSE
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
    item_name_en?: string; // Added for bilingual support
    marketing_name?: string; // Legacy: ชื่อทางการตลาด
    billing_name?: string;   // Legacy: ชื่อในการออกบิล
    description?: string;
    warehouse?: string;
    location?: string;
    standard_cost?: number;
    barcode?: string;
    category_id?: string;
    category_name: string;
    item_type_id?: string;
    item_type_code?: string; // Added for type badge
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
    // Primary Identifiers
    item_code: string;       // Map to: item_code
    item_name: string;       // Map to: item_name
    item_name_en: string;    // Legacy requirement (Handle as optional if not in DB yet)
    marketing_name: string;  // Legacy: ชื่อทางการตลาด
    billing_name: string;    // Legacy: ชื่อในการออกบิล
    category_id: string;     // Map to: category_id

    // Attributes (Cols 1)
    good_class_id: string;   // Group
    good_brand_id: string;   // Brand (Schema: good_brand_id)
    good_pattern_id: string; // Pattern (Schema: good_pattern_id)
    good_design_id: string;  // Design (Schema: good_design_id)
    good_size_id: string;    // Size (Schema: good_size_id)
    good_model_id?: string;  // Legacy (Warning: May not exist in DB Schema)
    good_grade_id?: string;  // Legacy (Warning: May not exist in DB Schema)
    good_color_id?: string;  // Legacy (Warning: May not exist in DB Schema)

    // Stock & Cost (Cols 2)
    base_uom_id: string;     // Map to: base_uom_id
    item_type_code: string;  // Map to: item_type_code
    costing_method?: string; // Legacy

    // Financial & Status (Cols 3)
    default_tax_code: string; // Map to: default_tax_code
    tax_rate?: number;
    barcode?: string;         // Map to: barcode
    is_active: boolean;       // Map to: is_active
    is_on_hold?: boolean;     // Legacy
    nature_id?: string;       // Legacy (Nature/ลักษณะสินค้า)
    product_subtype_id?: string; // Legacy (Group Item/รายการกลุ่มสินค้า)
    commission_type?: string; // Legacy (Commission/การคิดคอมมิชชั่น)
    std_amount?: number;      // Legacy (Amount/กำหนดจำนวน)
    discount_amount?: string; // Legacy (Discount/ส่วนลดสินค้า)
    is_buddy?: boolean;       // Legacy (Buddy)
}

/**
 * ItemListItem - สำหรับแสดงในตาราง
 */
export interface ItemListItem {
    item_id: string;
    item_code: string;
    item_name: string;
    item_name_en?: string; // Added for bilingual support
    marketing_name?: string; // Legacy: ชื่อทางการตลาด
    billing_name?: string;   // Legacy: ชื่อในการออกบิล
    description?: string;
    warehouse?: string;
    location?: string;
    standard_cost?: number;
    category_name: string;
    item_type_code?: string; // Added for type badge
    unit_name: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new item master */
export const initialItemMasterFormData: ItemMasterFormData = {
    // Primary Identifiers
    item_code: '',
    item_name: '',
    item_name_en: '',
    marketing_name: '',
    billing_name: '',
    category_id: '',

    // Attributes
    good_class_id: '',
    good_brand_id: '',
    good_pattern_id: '',
    good_design_id: '',
    good_size_id: '',
    good_model_id: '',
    good_grade_id: '',
    good_color_id: '',

    // Stock & Cost
    base_uom_id: '',
    item_type_code: '',
    costing_method: '',

    // Financial & Status
    default_tax_code: 'VAT7',
    barcode: '',
    is_active: true,
    is_on_hold: false,
    nature_id: '',
    product_subtype_id: '',
    commission_type: '',
    std_amount: 0,
    discount_amount: '',
    is_buddy: false,
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

// ====================================================================================
// REQUEST / RESPONSE TYPES for Services
// ====================================================================================

export interface BranchCreateRequest {
  branch_code: string;
  branch_name: string;
}

export interface BranchUpdateRequest extends Partial<BranchCreateRequest> {
  branch_id: string;
}

export interface WarehouseCreateRequest {
  warehouse_code: string;
  warehouse_name: string;
  branch_id: string;
  address?: string;
  is_active?: boolean;
}

export interface WarehouseUpdateRequest extends Partial<WarehouseCreateRequest> {
  warehouse_id: string;
}

export interface ProductCategoryCreateRequest {
  category_code: string;
  category_name: string;
  category_name_en?: string;
  is_active?: boolean;
}

export interface ProductCategoryUpdateRequest extends Partial<ProductCategoryCreateRequest> {
  category_id: string;
}

export interface ItemTypeCreateRequest {
  item_type_code: string;
  item_type_name: string;
  item_type_name_en?: string;
  is_active?: boolean;
}

export interface ItemTypeUpdateRequest extends Partial<ItemTypeCreateRequest> {
  item_type_id: string;
}

export interface UnitCreateRequest {
  unit_code: string;
  unit_name: string;
  unit_name_en?: string;
  is_active?: boolean;
}

export interface UnitUpdateRequest extends Partial<UnitCreateRequest> {
  unit_id: string;
}
