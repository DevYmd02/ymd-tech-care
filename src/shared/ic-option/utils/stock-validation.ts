/**
 * @file stock-validation.ts
 * @description Global stock validation utility — shared across all modules.
 *
 * Used by: Sales, Inventory, Purchase (จัดซื้อ), MRP, and any future module.
 *
 * ## IC Option Resolution Hierarchy (Priority high → low):
 * 1. IC Option List (document-specific override per system_document_code)
 * 2. Branch General Settings (check_deficit, check_deficit_option, check_qty_flag)
 * 3. Global System Default → DEFAULT_IC_OPTIONS below
 */

import type { ICOption, StockValidationResult } from '../types/ic-option.types';

export type { ICOption, StockValidationResult };

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
 * Default IC Options — safe fallback for all modules.
 * Defaults to: block negative stock, require warehouse, check balance qty.
 */
export const DEFAULT_IC_OPTIONS: ICOption = {
    negative_stock_check: 1,     // ห้ามติดลบ
    quantity_validation_flag: 1, // ยอดคงเหลือ
    negative_stock_mode: 2,      // แยกคลังสินค้า
};

/**
 * Validates a stock transaction line against the resolved IC options.
 *
 * Used for form validation (blocking submission) and UI feedback (showing warnings).
 *
 * @param qty           - จำนวนที่ต้องการเบิก/โอน/จอง
 * @param availableQty  - จำนวนสินค้าคงเหลือ
 * @param warehouseId   - รหัสคลังสินค้าที่เลือก
 * @param locationId    - รหัสที่เก็บที่เลือก (null ถ้าไม่กำหนด)
 * @param options       - IC Options ที่ resolve แล้ว (จาก useICOptions)
 *
 * @example
 * // Sales reservation
 * const result = validateStock(qty, availQty, warehouseId, locationId, icOptions);
 *
 * // Inventory issue
 * const result = validateStock(qty, availQty, warehouseId, locationId, icOptions);
 */
export const validateStock = (
    qty: number,
    availableQty: number,
    warehouseId: number | string | null | undefined,
    locationId: number | string | null | undefined,
    options: ICOption = DEFAULT_IC_OPTIONS
): StockValidationResult => {
    // ─── Guard: Check if required scope (Warehouse/Location) is missing ───
    const isWarehouseReq = options.negative_stock_mode === STOCK_MODE.WAREHOUSE_REQUIRED;
    const isLocationReq = options.negative_stock_mode === STOCK_MODE.WAREHOUSE_LOCATION_REQUIRED;
    const isMissingScope =
        (isWarehouseReq && !warehouseId) ||
        (isLocationReq && (!warehouseId || !locationId));

    // ─── 1. Negative Stock Rules (skip if scope not selected yet) ───
    // UX: Don't yell at user before they've had a chance to pick a warehouse/location.
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

// ─── Legacy aliases (backward-compat for existing imports) ───────────────────
/** @deprecated Use `validateStock` instead */
export const validateLineStock = validateStock;
/** @deprecated Use `validateStock` instead */
export const validateInventoryStock = validateStock;
/** @deprecated Use `DEFAULT_IC_OPTIONS` instead */
export const DEFAULT_INVENTORY_IC_OPTIONS = DEFAULT_IC_OPTIONS;
