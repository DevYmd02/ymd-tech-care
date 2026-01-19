/**
 * @file masterDataMocks.ts
 * @description Mock data สำหรับ Master Data - Branch, Warehouse, ProductCategory, ItemType, UnitOfMeasure
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
} from '../types/master-data-types';

// ====================================================================================
// BRANCH MOCK DATA
// ====================================================================================

export const mockBranches: BranchListItem[] = [
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

export const mockBranchDropdown: BranchDropdownItem[] = mockBranches
    .filter(b => b.is_active)
    .map(b => ({
        branch_id: b.branch_id,
        branch_code: b.branch_code,
        branch_name: b.branch_name,
    }));

// ====================================================================================
// WAREHOUSE MOCK DATA
// ====================================================================================

export const mockWarehouses: WarehouseListItem[] = [
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

// ====================================================================================
// PRODUCT CATEGORY MOCK DATA
// ====================================================================================

export const mockProductCategories: ProductCategoryListItem[] = [
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

// ====================================================================================
// ITEM TYPE MOCK DATA
// ====================================================================================

export const mockItemTypes: ItemTypeListItem[] = [
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

// ====================================================================================
// UNIT OF MEASURE MOCK DATA
// ====================================================================================

export const mockUnits: UnitListItem[] = [
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

// ====================================================================================
// ITEM MASTER MOCK DATA
// ====================================================================================

export const mockItems: ItemListItem[] = [
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

// ====================================================================================
// UOM CONVERSION MOCK DATA
// ====================================================================================

export const mockUOMConversions: UOMConversionListItem[] = [
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

// ====================================================================================
// ITEM BARCODE MOCK DATA
// ====================================================================================

export const mockItemBarcodes: ItemBarcodeListItem[] = [
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
