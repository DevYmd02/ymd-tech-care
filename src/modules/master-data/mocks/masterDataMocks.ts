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
    DepartmentListItem,
    SectionListItem,
    JobListItem,
    EmployeeGroupListItem,
    PositionListItem,
    SalesZoneListItem,
    SalesChannelListItem,
    SalesTargetListItem,
    EmployeeListItem,
} from '@/modules/master-data/types/master-data-types';

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
        id: 1,
        branch_id: 1,
        branch_code: 'HQ',
        branch_name: 'สำนักงานใหญ่',
        is_active: true,
        created_at: '2024-01-15T00:00:00Z',
    },
    {
        id: 2,
        branch_id: 2,
        branch_code: 'BKK01',
        branch_name: 'สาขากรุงเทพ 1',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z',
    },
    {
        id: 3,
        branch_id: 3,
        branch_code: 'CNX01',
        branch_name: 'สาขาเชียงใหม่',
        is_active: true,
        created_at: '2024-03-10T00:00:00Z',
    },
    {
        id: 4,
        branch_id: 4,
        branch_code: 'PKT01',
        branch_name: 'สาขาภูเก็ต',
        is_active: false,
        created_at: '2024-04-20T00:00:00Z',
    },
];

/** Mock data สำหรับ Branch List - เฉพาะ DEV mode */
// ====================================================================================
// COMPANY MOCKS
// ====================================================================================

export const mockDepartments: DepartmentListItem[] = [
    { id: 1, department_id: 1, department_code: 'ACC', department_name: 'ฝ่ายบัญชี', department_name_en: 'Accounting Department', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, department_id: 2, department_code: 'IT', department_name: 'ฝ่ายเทคโนโลยีสารสนเทศ', department_name_en: 'Information Technology Department', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 3, department_id: 3, department_code: 'HR', department_name: 'ฝ่ายทรัพยากรบุคคล', department_name_en: 'Human Resources Department', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 4, department_id: 4, department_code: 'FIN', department_name: 'ฝ่ายการเงิน', department_name_en: 'Finance Department', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockSections: SectionListItem[] = [
    { id: 1, section_id: 1, section_code: 'FIN-TRS', section_name: 'แผนกธุรการการเงิน', section_name_en: 'Treasury Department', department_id: 4, department_code: 'FIN', department_name: 'ฝ่ายการเงิน', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, section_id: 2, section_code: 'FIN-BUD', section_name: 'แผนกงบประมาณ', section_name_en: 'Budget Department', department_id: 4, department_code: 'FIN', department_name: 'ฝ่ายการเงิน', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 3, section_id: 3, section_code: 'ACC-GL', section_name: 'แผนกบัญชีทั่วไป', section_name_en: 'General Ledger Department', department_id: 1, department_code: 'ACC', department_name: 'ฝ่ายบัญชี', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockJobs: JobListItem[] = [
    { id: 1, job_id: 1, job_code: 'J-DEV', job_name: 'Developer', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, job_id: 2, job_code: 'J-MGR', job_name: 'Manager', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockEmployeeGroups: EmployeeGroupListItem[] = [
    { id: 1, group_id: 1, group_code: 'FULL', group_name: 'Full-Time', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, group_id: 2, group_code: 'CONT', group_name: 'Contractor', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockPositions: PositionListItem[] = [
    { id: 1, position_id: 1, position_code: 'SE', position_name: 'Software Engineer', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, position_id: 2, position_code: 'SSR', position_name: 'Senior Sales Key Account', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockSalesZones: SalesZoneListItem[] = [
    { id: 1, zone_id: 1, zone_code: 'BKK', zone_name: 'Bangkok', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, zone_id: 2, zone_code: 'NORTH', zone_name: 'Northern Region', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockSalesChannels: SalesChannelListItem[] = [
    { id: 1, channel_id: 1, channel_code: 'ONLINE', channel_name: 'Online Store', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
    { id: 2, channel_id: 2, channel_code: 'RETAIL', channel_name: 'Retail Shop', is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockSalesTargets: SalesTargetListItem[] = [
    { id: 1, target_id: 1, target_code: 'FY2026-Q1', target_name: 'Q1 2026 Sales Target', amount: 1000000, year: 2026, period: 1, is_active: true, created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
];

export const mockEmployees: EmployeeListItem[] = [
    { 
        id: 1,
        employee_id: 1, 
        employee_code: 'EMP001', 
        employee_name: 'Somchai Jaidee', 
        title_name: 'Mr.',
        first_name: 'Somchai', 
        last_name: 'Jaidee',
        email: 'somchai@ymd.com', 
        phone: '0812345678',
        department_id: 2, 
        department_name: 'Information Technology',
        position_id: 1, 
        position_name: 'Software Engineer',
        status: 'ACTIVE', 
        is_active: true, 
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
    },
];

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
        id: 1,
        warehouse_id: 1,
        warehouse_code: 'WH-HQ',
        warehouse_name: 'คลังสำนักงานใหญ่',
        branch_id: 1,
        branch_name: 'สำนักงานใหญ่',
        is_active: true,
        created_at: '2024-01-15T00:00:00Z',
    },
    {
        id: 2,
        warehouse_id: 2,
        warehouse_code: 'WH-BKK1',
        warehouse_name: 'คลังกรุงเทพ 1',
        branch_id: 2,
        branch_name: 'สาขากรุงเทพ 1',
        is_active: true,
        created_at: '2024-02-01T00:00:00Z',
    },
    {
        id: 3,
        warehouse_id: 3,
        warehouse_code: 'WH-CNX',
        warehouse_name: 'คลังเชียงใหม่',
        branch_id: 3,
        branch_name: 'สาขาเชียงใหม่',
        is_active: true,
        created_at: '2024-03-10T00:00:00Z',
    },
    {
        id: 4,
        warehouse_id: 4,
        warehouse_code: 'WH-PKT',
        warehouse_name: 'คลังภูเก็ต',
        branch_id: 4,
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
        id: 1,
        category_id: 1,
        category_code: 'MED',
        category_name: 'เวชภัณฑ์',
        category_name_en: 'Medical Supplies',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        category_id: 2,
        category_code: 'EQP',
        category_name: 'อุปกรณ์การแพทย์',
        category_name_en: 'Medical Equipment',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        category_id: 3,
        category_code: 'CON',
        category_name: 'วัสดุสิ้นเปลือง',
        category_name_en: 'Consumables',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 4,
        category_id: 4,
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
        id: 1,
        item_type_id: 1,
        item_type_code: 'DRUG',
        item_type_name: 'ยา',
        item_type_name_en: 'Drug',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        item_type_id: 2,
        item_type_code: 'SUPP',
        item_type_name: 'เวชภัณฑ์ทั่วไป',
        item_type_name_en: 'General Supplies',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        item_type_id: 3,
        item_type_code: 'INST',
        item_type_name: 'เครื่องมือ',
        item_type_name_en: 'Instrument',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 4,
        item_type_id: 4,
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
        id: 1,
        unit_id: 1,
        unit_code: 'PCS',
        unit_name: 'ชิ้น',
        unit_name_en: 'Piece',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        unit_id: 2,
        unit_code: 'BOX',
        unit_name: 'กล่อง',
        unit_name_en: 'Box',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        unit_id: 3,
        unit_code: 'BTL',
        unit_name: 'ขวด',
        unit_name_en: 'Bottle',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 4,
        unit_id: 4,
        unit_code: 'SET',
        unit_name: 'ชุด',
        unit_name_en: 'Set',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 5,
        unit_id: 5,
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
        id: 1,
        item_id: 1,
        item_code: 'RM-001',
        item_name: 'แผ่นเหล็ก เกรด A', // Thai Name
        item_name_en: 'Steel Sheet Grade A', // English Name
        description: 'High quality steel sheet for manufacturing',
        category_id: 1,
        category_name: 'Raw Materials (วัตถุดิบ)',
        item_type_code: 'RM',
        unit_name: 'Sheet (แผ่น)',
        uom_id: 1,
        uom_name: 'Sheet (แผ่น)',
        warehouse: '1001',
        location: 'A-12',
        standard_cost: 500,
        preferred_vendor_id: 3, // Siam Cement
        stock_qty: 150,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        item_id: 2,
        item_code: 'IT-001',
        item_name: 'โน้ตบุ๊ก Dell Latitude',
        item_name_en: 'Notebook Dell Latitude',
        description: 'Core i7, 16GB RAM, 512GB SSD',
        category_id: 1,
        category_name: 'IT Assets (สินทรัพย์ไอที)',
        item_type_code: 'ASSET',
        unit_name: 'Unit (เครื่อง)',
        uom_id: 2,
        uom_name: 'Unit (เครื่อง)',
        warehouse: '9001',
        location: 'C-05',
        standard_cost: 25000,
        preferred_vendor_id: 2, // JIB Computer
        stock_qty: 25,
        is_active: true,
        created_at: '2024-01-02T00:00:00Z',
    },
    {
        id: 3,
        item_id: 3,
        item_code: 'SP-001',
        item_name: 'ปั๊มไฮดรอลิก รุ่น X',
        item_name_en: 'Hydraulic Pump Model X',
        description: 'Spare part for heavy machinery',
        category_id: 1,
        category_name: 'Spare Parts (อะไหล่)',
        item_type_code: 'SP',
        unit_name: 'Set (ชุด)',
        uom_id: 4,
        uom_name: 'Set (ชุด)',
        warehouse: '3001',
        location: 'B-03',
        standard_cost: 15000,
        preferred_vendor_id: 5, // Somchai Construction
        stock_qty: 0,
        is_active: true,
        created_at: '2024-01-05T00:00:00Z',
    },
    {
        id: 4,
        item_id: 4,
        item_code: 'OF-001',
        item_name: 'กระดาษ A4 Double A',
        item_name_en: 'A4 Paper Double A',
        description: '80 gsm, 500 sheets per ream',
        category_id: 1,
        category_name: 'Office Supplies (วัสดุสำนักงาน)',
        item_type_code: 'CON',
        unit_name: 'Ream (รีม)',
        uom_id: 5,
        uom_name: 'Ream (รีม)',
        warehouse: '2001',
        location: 'Z-C',
        standard_cost: 120,
        preferred_vendor_id: 1, // OfficeMate
        stock_qty: 500,
        is_active: true,
        created_at: '2024-01-10T00:00:00Z',
    },
    {
        id: 5,
        item_id: 5,
        item_code: 'SF-001',
        item_name: 'หมวกนิรภัย 3M',
        item_name_en: 'Safety Helmet 3M',
        description: 'Industrial grade safety helmet, White',
        category_id: 1,
        category_name: 'Safety Gear (อุปกรณ์ความปลอดภัย)',
        item_type_code: 'CON',
        unit_name: 'Piece (ใบ)',
        uom_id: 1,
        uom_name: 'Piece (ใบ)',
        warehouse: '4001',
        location: 'B-10',
        standard_cost: 450,
        preferred_vendor_id: 3, // Siam Cement
        stock_qty: 80,
        is_active: true,
        created_at: '2024-01-12T00:00:00Z',
    },
    {
        id: 6,
        item_id: 6,
        item_code: 'PN-001',
        item_name: 'ปากกาลูกลื่น (Pens)',
        item_name_en: 'Ballpoint Pens',
        description: 'Blue ink, box of 12',
        category_id: 1,
        category_name: 'Office Supplies (วัสดุสำนักงาน)',
        item_type_code: 'CON',
        unit_name: 'Box (กล่อง)',
        uom_id: 2,
        uom_name: 'Box (กล่อง)',
        warehouse: '2001',
        location: 'Z-D',
        standard_cost: 150,
        preferred_vendor_id: 1, // OfficeMate
        stock_qty: 1200,
        is_active: true,
        created_at: '2024-01-15T00:00:00Z',
    },
];

/** Mock data สำหรับ Item Master List - เฉพาะ DEV mode */
export const mockItems: ItemListItem[] = IS_DEV ? _mockItems : [];

// ====================================================================================
// UOM CONVERSION MOCK DATA
// ====================================================================================

const _mockUOMConversions: UOMConversionListItem[] = [
    {
        id: 1,
        conversion_id: 1,
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
        id: 2,
        conversion_id: 2,
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
        id: 3,
        conversion_id: 3,
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
        id: 1,
        barcode_id: 1,
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        barcode: '8850007001234',
        unit_name: 'ลัง',
        is_primary: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        barcode_id: 2,
        item_code: 'RM-001',
        item_name: 'Paracetamol 500mg',
        barcode: '8850007001241',
        unit_name: 'แพ็ค',
        is_primary: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        barcode_id: 3,
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
        id: 1,
        cost_center_id: 1,
        cost_center_code: 'CC-IT',
        cost_center_name: 'แผนกไอที',
        description: 'Information Technology Department',
        budget_amount: 5000000,
        manager_name: 'Somchai IT',
        is_active: true,
    },
    {
        id: 2,
        cost_center_id: 2,
        cost_center_code: 'CC-HR',
        cost_center_name: 'แผนกทรัพยากรบุคคล',
        description: 'Human Resources Department',
        budget_amount: 2000000,
        manager_name: 'Somsri HR',
        is_active: true,
    },
    {
        id: 3,
        cost_center_id: 3,
        cost_center_code: 'CC-ACC',
        cost_center_name: 'แผนกบัญชี',
        description: 'Accounting Department',
        budget_amount: 3000000,
        manager_name: 'Somying ACC',
        is_active: true,
    },
    {
        id: 4,
        cost_center_id: 4,
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
        id: 1,
        project_id: 1,
        project_code: 'PRJ-2024-001',
        project_name: 'ปรับปรุงระบบ ERP Phase 1',
        description: 'Implementation of Procurement Module',
        cost_center_id: 1,
        budget_amount: 1500000,
        start_date: '2024-01-01',
        end_date: '2024-06-30',
        status: 'ACTIVE',
        is_active: true,
    },
    {
        id: 2,
        project_id: 2,
        project_code: 'PRJ-2024-002',
        project_name: 'ก่อสร้างอาคารใหม่',
        description: 'New Office Building Construction',
        cost_center_id: 999, // Custom generic
        budget_amount: 20000000,
        start_date: '2024-02-15',
        end_date: '2024-12-31',
        status: 'ON_HOLD',
        is_active: true,
    },
    {
        id: 3,
        project_id: 3,
        project_code: 'PRJ-2024-003',
        project_name: 'จัดจ้างทำความสะอาดประจำปี',
        description: 'Annual Cleaning Service Contract',
        cost_center_id: 2,
        budget_amount: 500000,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'ACTIVE',
        is_active: true,
    },
];

/** Mock data สำหรับ Project List - เฉพาะ DEV mode */
export const mockProjects: Project[] = IS_DEV ? _mockProjects : [];
