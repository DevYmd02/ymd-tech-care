/**
 * @file item-master-options.mock.ts
 * @description Standardized Mock Options for Item Master Form Dropdowns
 * @version Legacy-Match
 */

// Helper to get name from ID
export const getName = (
    id: string | number, 
    source: Array<Record<string, string | number | boolean>>, 
    idField = 'id', 
    nameField = 'name'
): string => {
    // Convert both to string for comparison to be safe
    const found = source.find(item => String(item[idField]) === String(id));
    return found ? String(found[nameField]) : '';
};

// =============================================================================
// DROPDOWN OPTIONS
// =============================================================================

// Category (หมวดสินค้า)
// Legacy: 01 | ผลิตภัณฑ์ปรับอากาศ
export const MOCK_CATEGORIES = [
    { id: '01', code: '01', name: 'ผลิตภัณฑ์ปรับอากาศ' }
];

// Group (กลุ่มสินค้า)
// Legacy: 01-001 | ตั้ง
export const MOCK_GROUPS = [
    { id: '01-001', name: 'ตั้ง' }
];

// Brand (ยี่ห้อสินค้า)
// Legacy: 01-FT | เฟรชไทม์
export const MOCK_BRANDS = [
    { id: '01-FT', name: 'เฟรชไทม์' }
];

// Pattern (รูปแบบสินค้า)
// Legacy: (Empty/Generic)
export const MOCK_PATTERNS = [
    { id: 'PT01', name: 'Standard Pattern' } 
];

// Design (การออกแบบ)
// Legacy: 01 | กระปุก
export const MOCK_DESIGNS = [
    { id: '01', name: 'กระปุก' }
];

// Grade (เกรดสินค้า)
// Legacy: (Not specified, keep generic or empty)
export const MOCK_GRADES = [
    { id: 'GR01', name: 'Standard Grade' }
];

// Model (รุ่นสินค้า)
// Legacy: FT | เฟรชไทม์
export const MOCK_MODELS = [
    { id: 'FT', name: 'เฟรชไทม์' }
];

// Size (ขนาดสินค้า)
// Legacy: 180g | 180 กรัม
export const MOCK_SIZES = [
    { id: '180g', name: '180 กรัม' }
];

// Color (สีสินค้า)
// Legacy: MT22001 | ซีพี แล็คซัตร้า
export const MOCK_COLORS = [
    { id: 'MT22001', name: 'ซีพี แล็คซัตร้า' }
];

// Item Type (ประเภทสินค้า)
// Legacy: FG | สินค้าสำเร็จรูป
export const MOCK_TYPES = [
    { id: 'IT001', code: 'FG', name: 'สินค้าสำเร็จรูป' }
];

// Unit (หน่วยนับสินค้า)
// Legacy: PCS | ชิ้น, Multi Unit
export const MOCK_UOMS = [
    { id: 'PCS', code: 'PCS', name: 'ชิ้น' },
    { id: 'MULTI', code: 'MULTI', name: 'Multi Unit' }
];

// Tax Type (ประเภทภาษี)
// Legacy: (Not specified, keep generic)
export const MOCK_TAX_CODES = [
    { id: 'TX01', code: 'VAT7', name: 'VAT 7%', rate: 7 },
    { id: 'TX02', code: 'VAT0', name: 'VAT 0%', rate: 0 }
];

// Nature (ลักษณะสินค้า) - NEW
// Legacy: Lot | Lot & Expire
export const MOCK_NATURES = [
    { id: 'LOT', name: 'Lot & Expire' }
];

// Costing (การคิดต้นทุน) - NEW
// Legacy: FIFO | FIFO
export const MOCK_COSTING_METHODS = [
    { id: 'FIFO', name: 'FIFO' }
];

// Product Subtype (รายการกลุ่มสินค้า) - NEW
// Legacy: สินค้าปกติ
export const MOCK_PRODUCT_SUBTYPES = [
    { id: 'NORMAL', name: 'สินค้าปกติ' }
];

// Commission (การคิดคอมมิชชั่น) - NEW
// Legacy: ไม่คิดคอมมิชชั่น
export const MOCK_COMMISSIONS = [
    { id: 'NONE', name: 'ไม่คิดคอมมิชชั่น' }
];
