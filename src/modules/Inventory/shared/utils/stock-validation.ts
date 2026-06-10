/**
 * @file stock-validation.ts
 * @description Inventory module stock validation logic.
 * 
 * Mirrors the Sales module's stock-validation.ts but for Inventory-specific
 * document types (ISSUE_REQ, APPV_ISSUE, ISSUE, TRANSFER, etc.)
 * 
 * ## IC Option Resolution Hierarchy (Priority high → low):
 * 1. IC Option List (document-specific override per system_document_code)
 * 2. Branch General Settings (check_deficit, check_deficit_option, check_qty_flag)
 * 3. Global System Default (hardcoded safe fallback)
 */

export interface InventoryICOption {
    /** ตรวจสอบสินค้าติดลบ: 1=ห้าม, 2=อนุญาต, 3=เตือนก่อน */
    negative_stock_check: number;
    /** ตรวจสอบจำนวน: 0=รวม, 2=แยกคลัง, 3=แยกคลัง+ที่เก็บ */
    negative_stock_mode: number;
    /** ตรวจสอบจำนวนจอง: 1=ยอดคงเหลือ, 2=ยอดจอง */
    quantity_validation_flag: number;
}

export interface InventoryStockValidationResult {
    isValid: boolean;
    type?: 'error' | 'warning';
    message?: string;
    code?:
        | 'INVALID_QTY'
        | 'NEGATIVE_STOCK_NOT_ALLOWED'
        | 'NEGATIVE_STOCK_ALLOWED'
        | 'INSUFFICIENT_STOCK_WARNING'
        | 'WAREHOUSE_REQUIRED'
        | 'WAREHOUSE_LOCATION_REQUIRED';
}

const NEGATIVE_STOCK = {
    BLOCK: 1, // ห้ามติดลบ
    ALLOW: 2, // อนุญาตติดลบ
    WARN: 3,  // เตือนก่อน
} as const;

const STOCK_MODE = {
    ITEM_LEVEL: 0,
    TOTAL: 1,
    WAREHOUSE_REQUIRED: 2,
    WAREHOUSE_LOCATION_REQUIRED: 3,
} as const;

const QTY_FLAG = {
    MUST_BE_POSITIVE: 1,
} as const;

/**
 * Default IC Options — safe fallback for Inventory module.
 * Defaults to blocking negative stock and requiring a warehouse.
 */
export const DEFAULT_INVENTORY_IC_OPTIONS: InventoryICOption = {
    negative_stock_check: 1,      // ห้ามติดลบ
    quantity_validation_flag: 1,  // ยอดคงเหลือ
    negative_stock_mode: 2,       // แยกคลังสินค้า
};

/**
 * Validates a stock transaction line against the resolved IC options.
 * 
 * Used for form validation (blocking submission) and UI feedback (showing warnings).
 * 
 * @param qty - จำนวนที่ต้องการเบิก/โอน
 * @param availableQty - จำนวนสินค้าคงเหลือ
 * @param warehouseId - รหัสคลังสินค้าที่เลือก
 * @param locationId - รหัสที่เก็บที่เลือก (null ถ้าไม่กำหนด)
 * @param options - IC Options ที่ resolve แล้ว
 */
export const validateInventoryStock = (
    qty: number,
    availableQty: number,
    warehouseId: number | string | null | undefined,
    locationId: number | string | null | undefined,
    options: InventoryICOption = DEFAULT_INVENTORY_IC_OPTIONS
): InventoryStockValidationResult => {
    // ─── Guard: Check if required scope (Warehouse/Location) is missing ───
    const isWarehouseReq = options.negative_stock_mode === STOCK_MODE.WAREHOUSE_REQUIRED;
    const isLocationReq = options.negative_stock_mode === STOCK_MODE.WAREHOUSE_LOCATION_REQUIRED;
    const isMissingScope =
        (isWarehouseReq && !warehouseId) ||
        (isLocationReq && (!warehouseId || !locationId));

    // ─── 1. Negative Stock Rules (skip if scope not selected yet) ───
    if (!isMissingScope) {
        if (options.negative_stock_check === NEGATIVE_STOCK.BLOCK && qty > availableQty) {
            return {
                isValid: false,
                type: 'error',
                code: 'NEGATIVE_STOCK_NOT_ALLOWED',
                message: 'สต็อกไม่เพียงพอ (ห้ามติดลบ)',
            };
        }
        if (options.negative_stock_check === NEGATIVE_STOCK.ALLOW && qty > availableQty) {
            return {
                isValid: true,
                type: 'warning',
                code: 'NEGATIVE_STOCK_ALLOWED',
                message: 'สต็อกไม่พอ (อนุญาตให้ติดลบได้)',
            };
        }
        if (options.negative_stock_check === NEGATIVE_STOCK.WARN && qty > availableQty) {
            return {
                isValid: true,
                type: 'warning',
                code: 'INSUFFICIENT_STOCK_WARNING',
                message: 'สต็อกไม่พอ (ระบบจะตัดสต็อกติดลบ)',
            };
        }
    }

    // ─── 2. Quantity Validation ───
    if (options.quantity_validation_flag === QTY_FLAG.MUST_BE_POSITIVE && qty <= 0) {
        return {
            isValid: false,
            type: 'error',
            code: 'INVALID_QTY',
            message: 'จำนวนสินค้าต้องมากกว่า 0',
        };
    }

    // ─── 3. Warehouse / Location Scope Rules ───
    if (options.negative_stock_mode === STOCK_MODE.WAREHOUSE_REQUIRED && !warehouseId) {
        return {
            isValid: false,
            type: 'error',
            code: 'WAREHOUSE_REQUIRED',
            message: 'กรุณาระบุคลังสินค้า',
        };
    }
    if (
        options.negative_stock_mode === STOCK_MODE.WAREHOUSE_LOCATION_REQUIRED &&
        (!warehouseId || !locationId)
    ) {
        return {
            isValid: false,
            type: 'error',
            code: 'WAREHOUSE_LOCATION_REQUIRED',
            message: 'กรุณาระบุคลังและที่เก็บ',
        };
    }

    return { isValid: true };
};
