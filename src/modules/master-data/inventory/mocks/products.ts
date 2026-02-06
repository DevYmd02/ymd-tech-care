/**
 * @file products.ts
 * @description Product Lookup Interface & Mock Data for Bilingual Support
 */

// =============================================================================
// INTERFACE - Item Lookup (ค้นหาสินค้า)
// =============================================================================

export interface ProductLookup {
    /** รหัสสินค้า (e.g., ITEM-001) */
    item_code: string;
    /** ชื่อสินค้า (ไทย) */
    item_name: string;
    /** ชื่อสินค้า (อังกฤษ) */
    item_name_en: string;
    /** หมวดสินค้า */
    category_name: string;
    /** หน่วยนับ */
    unit_name: string;
    /** ประเภทสินค้า (Badge) */
    item_type_code: string;
    /** ราคา/หน่วย (Mock) */
    unit_price: number;
    /** Legacy: Unit (Backward Compatibility) */
    unit: string;
}

// =============================================================================
// MOCK DATA (Hardcoded for Bilingual Demo)
// =============================================================================

export const MOCK_PRODUCTS: ProductLookup[] = [
    {
        item_code: 'RM-001',
        item_name: 'แผ่นเหล็ก เกรด A',
        item_name_en: 'Steel Sheet Grade A',
        category_name: 'Raw Materials (วัตถุดิบ)',
        unit_name: 'Sheet (แผ่น)',
        item_type_code: 'RM',
        unit_price: 500,
        unit: 'Sheet (แผ่น)'
    },
    {
        item_code: 'IT-001',
        item_name: 'โน้ตบุ๊ก Dell Latitude',
        item_name_en: 'Notebook Dell Latitude',
        category_name: 'IT Assets (สินทรัพย์ไอที)',
        unit_name: 'Unit (เครื่อง)',
        item_type_code: 'ASSET',
        unit_price: 25000,
        unit: 'Unit (เครื่อง)'
    },
    {
        item_code: 'SP-001',
        item_name: 'ปั๊มไฮดรอลิก รุ่น X',
        item_name_en: 'Hydraulic Pump Model X',
        category_name: 'Spare Parts (อะไหล่)',
        unit_name: 'Set (ชุด)',
        item_type_code: 'SP',
        unit_price: 15000,
        unit: 'Set (ชุด)'
    },
    {
        item_code: 'OF-001',
        item_name: 'กระดาษ A4 Double A',
        item_name_en: 'A4 Paper Double A',
        category_name: 'Office Supplies (วัสดุสำนักงาน)',
        unit_name: 'Ream (รีม)',
        item_type_code: 'CON',
        unit_price: 120,
        unit: 'Ream (รีม)'
    },
    {
        item_code: 'SF-001',
        item_name: 'หมวกนิรภัย 3M',
        item_name_en: 'Safety Helmet 3M',
        category_name: 'Safety Gear (อุปกรณ์ความปลอดภัย)',
        unit_name: 'Piece (ใบ)',
        item_type_code: 'CON',
        unit_price: 450,
        unit: 'Piece (ใบ)'
    }
];

// Legacy export compatibility
export type Product = ProductLookup;
