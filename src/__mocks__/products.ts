/**
 * @file products.ts
 * @description Centralized mock data สำหรับ Product/Item Lookup (ค้นหาสินค้า)
 * 
 * @reference Image: Item Lookup Modal with columns:
 * - รหัส (Code)
 * - ชื่อสินค้า (Product Name)
 * - หน่วย (Unit)
 * - ราคา/หน่วย (Unit Price)
 * 
 * @note Mock data จะถูก export เฉพาะใน DEV mode เท่านั้น
 */

const IS_DEV = import.meta.env.DEV;

// =============================================================================
// INTERFACE - Item Lookup (ค้นหาสินค้า)
// =============================================================================

/**
 * ProductLookup - สำหรับ Item Lookup Modal
 * Matches the reference image columns exactly
 */
export interface ProductLookup {
    /** รหัสสินค้า (e.g., ITEM-001) */
    item_code: string;
    /** ชื่อสินค้า */
    item_name: string;
    /** หน่วยนับ */
    unit: string;
    /** ราคา/หน่วย */
    unit_price: number;
}

// =============================================================================
// MOCK DATA - Matching Reference Image
// =============================================================================

const _mockProducts: ProductLookup[] = [
    {
        item_code: 'ITEM-001',
        item_name: 'คอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex 7010',
        unit: 'เครื่อง',
        unit_price: 25000.00,
    },
    {
        item_code: 'ITEM-002',
        item_name: 'จอมอนิเตอร์ LED 24 นิ้ว Samsung',
        unit: 'เครื่อง',
        unit_price: 5500.00,
    },
    {
        item_code: 'ITEM-003',
        item_name: 'เมาส์ไร้สาย Logitech M185',
        unit: 'ชิ้น',
        unit_price: 350.00,
    },
    {
        item_code: 'ITEM-004',
        item_name: 'คีย์บอร์ด Mechanical Gaming RGB',
        unit: 'ชิ้น',
        unit_price: 2800.00,
    },
    {
        item_code: 'ITEM-005',
        item_name: 'เครื่องพิมพ์เลเซอร์ HP LaserJet Pro',
        unit: 'เครื่อง',
        unit_price: 8900.00,
    },
    {
        item_code: 'ITEM-006',
        item_name: 'กระดาษ A4 80 แกรม (500 แผ่น/รีม)',
        unit: 'รีม',
        unit_price: 120.00,
    },
    // Additional items for variety
    {
        item_code: 'ITEM-007',
        item_name: 'Notebook Dell Latitude 5540',
        unit: 'เครื่อง',
        unit_price: 35000.00,
    },
    {
        item_code: 'ITEM-008',
        item_name: 'หมึกพิมพ์ HP 12A Original',
        unit: 'ตลับ',
        unit_price: 2500.00,
    },
    {
        item_code: 'ITEM-009',
        item_name: 'โต๊ะทำงานไม้ 120x60 ซม.',
        unit: 'ตัว',
        unit_price: 3200.00,
    },
    {
        item_code: 'ITEM-010',
        item_name: 'เก้าอี้สำนักงานปรับระดับ',
        unit: 'ตัว',
        unit_price: 1800.00,
    },
];

// =============================================================================
// EXPORTS
// =============================================================================

/** Mock data สำหรับ Item Lookup - เฉพาะ DEV mode */
export const MOCK_PRODUCTS: ProductLookup[] = IS_DEV ? _mockProducts : [];

// Legacy export for backward compatibility
export type Product = ProductLookup;
