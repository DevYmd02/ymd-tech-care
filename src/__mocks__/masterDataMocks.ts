/**
 * @file masterDataMocks.ts
 * @description Mock data สำหรับ Master Data - Branch, Warehouse, ProductCategory, ItemType, UnitOfMeasure
 * 
 * @note Mock data จะถูก export เฉพาะใน DEV mode เท่านั้น
 *       ใน Production build จะ export เป็น array ว่าง เพื่อลดขนาด bundle
 * 
 * @usage 
 * - DEV: ใช้ mock data ในการพัฒนา UI
 * - PROD: ควรเปลี่ยนไปใช้ service API จริง (เช่น branchService.getList())
 */

import type {
    BranchListItem,
    BranchDropdownItem,
    WarehouseListItem,
    ProductCategoryListItem,
    ItemTypeListItem,
    UnitListItem,
    ItemListItem,
    UOMConversionListItem,
    ItemBarcodeListItem,
    CostCenter,
    Project,
} from '../types/master-data-types';

// ====================================================================================
// ENVIRONMENT FLAG
// ====================================================================================

/** true = Development mode, false = Production mode */
const IS_DEV = import.meta.env.DEV;

// ====================================================================================
// BRANCH MOCK DATA
// ====================================================================================

const _mockBranches: BranchListItem[] = [
    {
        branch_id: 'BR001',
        branch_code: 'HQ',
        branch_name: 'สำนักงานใหญ่',
        is_active: true,
        created_at: '2024-01-15T00:00:00Z',
    },
    {
        branch_id: 'BR002',
        branch_code: 'BKK01',
        branch_name: 'สาขากรุงเทพ 1',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z',
    },
    {
        branch_id: 'BR003',
        branch_code: 'CNX01',
        branch_name: 'สาขาเชียงใหม่',
        is_active: true,
        created_at: '2024-03-10T00:00:00Z',
    },
    {
        branch_id: 'BR004',
        branch_code: 'PKT01',
        branch_name: 'สาขาภูเก็ต',
        is_active: false,
        created_at: '2024-04-20T00:00:00Z',
    },
];

/** Mock data สำหรับ Branch List - เฉพาะ DEV mode */
export const mockBranches: BranchListItem[] = IS_DEV ? _mockBranches : [];

/** Mock dropdown สำหรับ Branch - เฉพาะ DEV mode */
export const mockBranchDropdown: BranchDropdownItem[] = IS_DEV
    ? _mockBranches.filter(b => b.is_active).map(b => ({
        branch_id: b.branch_id,
        branch_code: b.branch_code,
        branch_name: b.branch_name,
    }))
    : [];

// ====================================================================================
// WAREHOUSE MOCK DATA
// ====================================================================================

const _mockWarehouses: WarehouseListItem[] = [
    {
        warehouse_id: 'WH001',
        warehouse_code: 'WH-HQ',
        warehouse_name: 'คลังสำนักงานใหญ่',
        branch_name: 'สำนักงานใหญ่',
        is_active: true,
        created_at: '2024-01-15T00:00:00Z',
    },
    {
        warehouse_id: 'WH002',
        warehouse_code: 'WH-BKK1',
        warehouse_name: 'คลังกรุงเทพ 1',
        branch_name: 'สาขากรุงเทพ 1',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z',
    },
    {
        warehouse_id: 'WH003',
        warehouse_code: 'WH-CNX',
        warehouse_name: 'คลังเชียงใหม่',
        branch_name: 'สาขาเชียงใหม่',
        is_active: true,
        created_at: '2024-03-10T00:00:00Z',
    },
    {
        warehouse_id: 'WH004',
        warehouse_code: 'WH-PKT',
        warehouse_name: 'คลังภูเก็ต',
        branch_name: 'สาขาภูเก็ต',
        is_active: false,
        created_at: '2024-04-20T00:00:00Z',
    },
];

/** Mock data สำหรับ Warehouse List - เฉพาะ DEV mode */
export const mockWarehouses: WarehouseListItem[] = IS_DEV ? _mockWarehouses : [];

// ====================================================================================
// PRODUCT CATEGORY MOCK DATA
// ====================================================================================

const _mockProductCategories: ProductCategoryListItem[] = [
    {
        category_id: 'CAT001',
        category_code: 'MED',
        category_name: 'เวชภัณฑ์',
        category_name_en: 'Medical Supplies',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        category_id: 'CAT002',
        category_code: 'EQP',
        category_name: 'อุปกรณ์การแพทย์',
        category_name_en: 'Medical Equipment',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        category_id: 'CAT003',
        category_code: 'CON',
        category_name: 'วัสดุสิ้นเปลือง',
        category_name_en: 'Consumables',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        category_id: 'CAT004',
        category_code: 'LAB',
        category_name: 'อุปกรณ์ห้องปฏิบัติการ',
        category_name_en: 'Laboratory Equipment',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
    },
];

/** Mock data สำหรับ Product Category List - เฉพาะ DEV mode */
export const mockProductCategories: ProductCategoryListItem[] = IS_DEV ? _mockProductCategories : [];

// ====================================================================================
// ITEM TYPE MOCK DATA
// ====================================================================================

const _mockItemTypes: ItemTypeListItem[] = [
    {
        item_type_id: 'IT001',
        item_type_code: 'DRUG',
        item_type_name: 'ยา',
        item_type_name_en: 'Drug',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        item_type_id: 'IT002',
        item_type_code: 'SUPP',
        item_type_name: 'เวชภัณฑ์ทั่วไป',
        item_type_name_en: 'General Supplies',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        item_type_id: 'IT003',
        item_type_code: 'INST',
        item_type_name: 'เครื่องมือ',
        item_type_name_en: 'Instrument',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        item_type_id: 'IT004',
        item_type_code: 'CHEM',
        item_type_name: 'สารเคมี',
        item_type_name_en: 'Chemical',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
    },
];

/** Mock data สำหรับ Item Type List - เฉพาะ DEV mode */
export const mockItemTypes: ItemTypeListItem[] = IS_DEV ? _mockItemTypes : [];

// ====================================================================================
// UNIT OF MEASURE MOCK DATA
// ====================================================================================

const _mockUnits: UnitListItem[] = [
    {
        unit_id: 'UN001',
        unit_code: 'PCS',
        unit_name: 'ชิ้น',
        unit_name_en: 'Piece',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        unit_id: 'UN002',
        unit_code: 'BOX',
        unit_name: 'กล่อง',
        unit_name_en: 'Box',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        unit_id: 'UN003',
        unit_code: 'BTL',
        unit_name: 'ขวด',
        unit_name_en: 'Bottle',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        unit_id: 'UN004',
        unit_code: 'SET',
        unit_name: 'ชุด',
        unit_name_en: 'Set',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        unit_id: 'UN005',
        unit_code: 'PKG',
        unit_name: 'แพ็ค',
        unit_name_en: 'Package',
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
    },
];

/** Mock data สำหรับ Unit List - เฉพาะ DEV mode */
export const mockUnits: UnitListItem[] = IS_DEV ? _mockUnits : [];

// ====================================================================================
// ITEM MASTER MOCK DATA
// ====================================================================================

const _mockItems: ItemListItem[] = [
    {
        item_id: 'IT001',
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        category_name: 'ยา (Drug)',
        unit_name: 'เม็ด (Tablet)',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        item_id: 'IT002',
        item_code: 'EQ-005',
        item_name: 'Surgical Mask',
        category_name: 'เวชภัณฑ์ (Medical Supplies)',
        unit_name: 'กล่อง (Box)',
        is_active: true,
        created_at: '2024-01-02T00:00:00Z',
    },
    {
        item_id: 'IT003',
        item_code: 'SV-001',
        item_name: 'ค่าบริการตรวจสุขภาพ',
        category_name: 'บริการ (Service)',
        unit_name: 'ครั้ง (Time)',
        is_active: true,
        created_at: '2024-01-05T00:00:00Z',
    },
    {
        item_id: 'IT004',
        item_code: 'MED-002',
        item_name: 'Amoxicillin 250mg',
        category_name: 'ยา (Drug)',
        unit_name: 'แคปซูล (Capsule)',
        is_active: true,
        created_at: '2024-01-10T00:00:00Z',
    },
];

/** Mock data สำหรับ Item Master List - เฉพาะ DEV mode */
export const mockItems: ItemListItem[] = IS_DEV ? _mockItems : [];

// ====================================================================================
// UOM CONVERSION MOCK DATA
// ====================================================================================

const _mockUOMConversions: UOMConversionListItem[] = [
    {
        conversion_id: 'UC001',
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        from_unit_name: 'ลัง',
        to_unit_name: 'แพ็ค',
        conversion_factor: 12,
        is_purchase_unit: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        conversion_id: 'UC002',
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        from_unit_name: 'แพ็ค',
        to_unit_name: 'ชิ้น',
        conversion_factor: 6,
        is_purchase_unit: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        conversion_id: 'UC003',
        item_code: 'EQ-005',
        item_name: 'Surgical Mask',
        from_unit_name: 'ลัง',
        to_unit_name: 'กล่อง',
        conversion_factor: 20,
        is_purchase_unit: true,
        is_active: true,
        created_at: '2024-01-02T00:00:00Z',
    },
];

/** Mock data สำหรับ UOM Conversion List - เฉพาะ DEV mode */
export const mockUOMConversions: UOMConversionListItem[] = IS_DEV ? _mockUOMConversions : [];

// ====================================================================================
// ITEM BARCODE MOCK DATA
// ====================================================================================

const _mockItemBarcodes: ItemBarcodeListItem[] = [
    {
        barcode_id: 'BC001',
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        barcode: '8850007001234',
        unit_name: 'ลัง',
        is_primary: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        barcode_id: 'BC002',
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        barcode: '8850007001241',
        unit_name: 'แพ็ค',
        is_primary: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        barcode_id: 'BC003',
        item_code: 'EQ-005',
        item_name: 'Surgical Mask',
        barcode: '8850007005678',
        unit_name: undefined,
        is_primary: true,
        is_active: true,
        created_at: '2024-01-02T00:00:00Z',
    },
];

/** Mock data สำหรับ Item Barcode List - เฉพาะ DEV mode */
export const mockItemBarcodes: ItemBarcodeListItem[] = IS_DEV ? _mockItemBarcodes : [];

// ====================================================================================
// COST CENTER MOCK DATA
// ====================================================================================

const _mockCostCenters: CostCenter[] = [
    {
        cost_center_id: 'CC001',
        cost_center_code: 'CC-IT',
        cost_center_name: 'แผนกไอที',
        description: 'Information Technology Department',
        budget_amount: 5000000,
        manager_name: 'Somchai IT',
        is_active: true,
    },
    {
        cost_center_id: 'CC002',
        cost_center_code: 'CC-HR',
        cost_center_name: 'แผนกทรัพยากรบุคคล',
        description: 'Human Resources Department',
        budget_amount: 2000000,
        manager_name: 'Somsri HR',
        is_active: true,
    },
    {
        cost_center_id: 'CC003',
        cost_center_code: 'CC-ACC',
        cost_center_name: 'แผนกบัญชี',
        description: 'Accounting Department',
        budget_amount: 3000000,
        manager_name: 'Somying ACC',
        is_active: true,
    },
    {
        cost_center_id: 'CC004',
        cost_center_code: 'CC-MKT',
        cost_center_name: 'แผนกการตลาด',
        description: 'Marketing Department',
        budget_amount: 8000000,
        manager_name: 'Sompong MKT',
        is_active: false,
    },
];

/** Mock data สำหรับ Cost Center List - เฉพาะ DEV mode */
export const mockCostCenters: CostCenter[] = IS_DEV ? _mockCostCenters : [];

// ====================================================================================
// PROJECT MOCK DATA
// ====================================================================================

const _mockProjects: Project[] = [
    {
        project_id: 'PRJ001',
        project_code: 'PRJ-2024-001',
        project_name: 'ปรับปรุงระบบ ERP Phase 1',
        description: 'Implementation of Procurement Module',
        cost_center_id: 'CC001',
        budget_amount: 1500000,
        start_date: '2024-01-01',
        end_date: '2024-06-30',
        status: 'ACTIVE',
    },
    {
        project_id: 'PRJ002',
        project_code: 'PRJ-2024-002',
        project_name: 'ก่อสร้างอาคารใหม่',
        description: 'New Office Building Construction',
        cost_center_id: 'CC-GEN',
        budget_amount: 20000000,
        start_date: '2024-02-15',
        end_date: '2024-12-31',
        status: 'ON_HOLD',
    },
    {
        project_id: 'PRJ003',
        project_code: 'PRJ-2024-003',
        project_name: 'จัดจ้างทำความสะอาดประจำปี',
        description: 'Annual Cleaning Service Contract',
        cost_center_id: 'CC002',
        budget_amount: 500000,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'ACTIVE',
    },
];

/** Mock data สำหรับ Project List - เฉพาะ DEV mode */
export const mockProjects: Project[] = IS_DEV ? _mockProjects : [];
