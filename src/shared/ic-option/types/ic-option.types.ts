/**
 * @file ic-option.types.ts
 * @description Global IC Option types shared across all modules.
 *
 * Used by: Sales, Inventory, Purchase (จัดซื้อ), MRP, and any future module.
 *
 * ## IC Option Resolution Hierarchy (Priority high → low):
 * 1. IC Option List (document-specific override per system_document_code)
 * 2. Branch General Settings (check_deficit, check_deficit_option, check_qty_flag)
 * 3. Global System Default (hardcoded safe fallback)
 */

import { z } from 'zod';

// ============================================================
// CORE IC OPTION INTERFACE
// ============================================================

/** Resolved IC options used by validateStock() and useICOptions() */
export interface ICOption {
    /** ตรวจสอบสินค้าติดลบ: 1=ห้าม, 2=อนุญาต, 3=เตือนก่อน */
    negative_stock_check: number;
    /** ตรวจสอบจำนวน: 0=รวม, 1=รวมคลัง, 2=แยกคลัง, 3=แยกคลัง+ที่เก็บ */
    negative_stock_mode: number;
    /** ตรวจสอบจำนวนจอง: 1=ยอดคงเหลือ, 2=ยอดจอง */
    quantity_validation_flag: number;
}

export interface StockValidationResult {
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

// ============================================================
// DROPDOWN OPTION CONSTANTS (for UI selects in IC Settings)
// ============================================================

/** Maps to: ตรวจสอบสินค้าติดลบ */
export const NEGATIVE_STOCK_CHECK_OPTIONS = [
    { id: 0, name: '(Default)' },
    { id: 1, name: 'สินค้าติดลบไม่ได้' },
    { id: 2, name: 'สินค้าติดลบได้' },
    { id: 3, name: 'แสดงข้อความถามก่อนใช้' },
    { id: 4, name: 'ตามรายตัวสินค้า' },
] as const;

/** Maps to: ตรวจสอบจำนวนสินค้า */
export const NEGATIVE_STOCK_MODE_OPTIONS = [
    { id: 0, name: '(Default)' },
    { id: 1, name: 'รวมคลังสินค้า' },
    { id: 2, name: 'แยกคลังสินค้า' },
    { id: 3, name: 'แยกคลังและที่เก็บ' },
] as const;

/** Maps to: ตรวจสินค้าติดลบด้วย */
export const QUANTITY_VALIDATION_OPTIONS = [
    { id: 0, name: '(Default)' },
    { id: 1, name: 'ยอดสินค้าคงเหลือ' },
    { id: 2, name: 'ยอดจองสินค้า' },
] as const;

// ============================================================
// BRANCH IC OPTION (ตั้งค่าทั่วไป) — Schema & Type
// ============================================================

const flagSchema = z.preprocess((val) => {
    if (val === 1 || val === '1' || val === 'Y' || val === 'y' || val === true) return 'Y';
    return 'N';
}, z.string().length(1));

export const icOptionSchema = z.object({
    ic_option_id: z.coerce.string().optional(),
    branch_id: z.coerce.number().min(1, 'กรุณาระบุรหัสสาขา'),

    aging_expire: z.coerce.string().min(1, 'กรุณาระบุระยะเวลา Aging').max(50, 'ห้ามเกิน 50 ตัวอักษร'),

    set_price1: z.number().int().min(0),
    set_price2: z.number().int().min(0),
    set_price3: z.number().int().min(0),
    set_price4: z.number().int().min(0),

    auto_perpetual_cost: flagSchema,
    barcode_flag: flagSchema,
    check_deficit: z.coerce.number().int().min(0).default(0),
    check_deficit_option: z.coerce.number().int().min(0).default(0),
    check_max_qty: flagSchema,
    check_min_qty: flagSchema,
    check_qty_flag: z.coerce.number().int().min(0).default(0),
    check_standcost: flagSchema,
    expire_alert_flag: flagSchema,
    order_alert_flag: flagSchema,
    post_cost_flag: flagSchema,
    reorder_flag: flagSchema,
    set_autopost: flagSchema,
    set_costcn: flagSchema,
    set_costcn_ap: flagSchema,
    set_costcn_ap_refinv: flagSchema,
    set_costcn_refinv: flagSchema,
    set_cost_return_issueref: flagSchema,
    set_goodqty: flagSchema,
    set_inve: flagSchema,
    set_price: flagSchema,
    set_price_ic: flagSchema,
    set_price_pack: flagSchema,
    set_price_po: flagSchema,
    trasfer_cost_flag: flagSchema,

    branch_code: z.coerce.string().optional(),
    branch_name: z.coerce.string().optional(),
});

export type ICOptionBranchConfig = z.infer<typeof icOptionSchema>;
export type ICOptionFormData = ICOptionBranchConfig;

export interface ICOptionFilters {
    search?: string;
    page: number;
    limit: number;
}

// ============================================================
// IC OPTION LIST (per-document override) — Schema & Type
// ============================================================

export const icOptionListSchema = z.object({
    option_list_id: z.coerce.number().optional(),
    ic_option_id: z.coerce.number(),
    system_document_id: z.coerce.number(),
    sort_order: z.coerce.number().optional().default(0),

    negative_stock_check: z.coerce.number().int().min(0).default(0),
    negative_stock_mode: z.coerce.number().int().min(0).default(0),
    quantity_validation_flag: z.coerce.number().int().min(0).default(0),

    system_document_code: z.coerce.string().optional(),
    system_document_name: z.coerce.string().optional(),
    system_document_name_eng: z.coerce.string().optional(),
});

export type ICOptionListItem = z.infer<typeof icOptionListSchema>;

export interface ICOptionListFormData {
    ic_option_id: number;
    system_document_id: number;
    sort_order: number;
    negative_stock_check: number;
    negative_stock_mode: number;
    quantity_validation_flag: number;
}

// ============================================================
// SYSTEM DOCUMENT — Type
// ============================================================

export interface SystemDocument {
    system_document_id: number;
    system_document_code: string;
    system_document_name: string;
    system_document_name_eng?: string;
    sort_order?: number;
    is_active?: boolean;
}
