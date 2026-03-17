/**
 * @file itemConstants.ts
 * @description Centralized constants for Item Master module
 */

export const ITEM_CATEGORIES = [
    { id: '01', code: '01', name: 'ผลิตภัณฑ์ปรับอากาศ' }
];

export const ITEM_GROUPS = [
    { id: '01-001', name: 'ตั้ง' }
];

export const ITEM_BRANDS = [
    { id: '01-FT', name: 'เฟรชไทม์' }
];

export const ITEM_PATTERNS = [
    { id: 'PT01', name: 'Standard Pattern' } 
];

export const ITEM_DESIGNS = [
    { id: '01', name: 'กระปุก' }
];

export const ITEM_GRADES = [
    { id: 'GR01', name: 'Standard Grade' }
];

export const ITEM_MODELS = [
    { id: 'FT', name: 'เฟรชไทม์' }
];

export const ITEM_SIZES = [
    { id: '180g', name: '180 กรัม' }
];

export const ITEM_COLORS = [
    { id: 'MT22001', name: 'ซีพี แล็คซัตร้า' }
];

export const ITEM_TYPES = [
    { id: 'IT001', code: 'FG', name: 'สินค้าสำเร็จรูป' }
];

export const ITEM_UOMS = [
    { id: 'PCS', code: 'PCS', name: 'ชิ้น' },
    { id: 'MULTI', code: 'MULTI', name: 'Multi Unit' }
];

export const ITEM_TAX_CODES = [
    { id: 'TX01', code: 'VAT7', name: 'VAT 7%', rate: 7 },
    { id: 'TX02', code: 'VAT0', name: 'VAT 0%', rate: 0 }
];

export const ITEM_NATURES = [
    { id: 'LOT', name: 'Lot & Expire' }
];

export const ITEM_COSTING_METHODS = [
    { id: 'FIFO', name: 'FIFO' }
];

export const ITEM_PRODUCT_SUBTYPES = [
    { id: 'NORMAL', name: 'สินค้าปกติ' }
];

export const ITEM_COMMISSIONS = [
    { id: 'NONE', name: 'ไม่คิดคอมมิชชั่น' }
];

/**
 * Helper to get name from ID in constants
 */
export const getItemName = (
    id: string | number, 
    source: unknown[], 
    idField = 'id', 
    nameField = 'name'
): string => {
    if (!Array.isArray(source)) return '';
    const found = source.find(item => {
        const obj = item as Record<string, unknown>;
        return obj && typeof obj === 'object' && String(obj[idField]) === String(id);
    });
    if (!found) return '';
    const obj = found as Record<string, unknown>;
    return String(obj[nameField] || '');
};
