import { z } from 'zod';
import type { PRLine } from '../types/pr-types';
import type { QuotationLine, QuotationHeader } from '../types/vq-types';

/**
 * 🧱 HYDRATION INTERFACES (Strict Zero-Any Policy)
 * Used for deep data recovery from various backend payload structures.
 */
export interface IHydrationVQLine extends Omit<Partial<QuotationLine>, 'item' | 'item_id'> {
    id?: number | string;
    product_id?: number | string;
    item_id?: number | string; 
    vqLines?: IHydrationVQLine[]; 
    item?: {
        id?: number | string;
        item_id?: number | string;
        product_id?: number | string;
        item_code?: string;
        item_name?: string;
        description?: string;
    };
}

export interface IHydrationVQHeader extends Omit<Partial<QuotationHeader>, 'vq_lines' | 'lines'> {
    id?: number | string;
    vq_header_id?: number; 
    vq_lines?: IHydrationVQLine[];
    lines?: IHydrationVQLine[];
    vqLines?: IHydrationVQLine[];
}

export interface IHydrationPRLine extends Omit<Partial<PRLine>, 'item' | 'item_id'> {
    id?: number | string;
    item_id?: number | string;
    item?: {
        id?: number | string;
        item_id?: number | string;
        item_code?: string;
        item_name?: string;
        description?: string;
    };
}

export interface ItemSelectorResult {
    id?: number | string;
    item_id?: number | string;
    product_id?: number | string;
    code?: string;
    item_code?: string;
    item_name?: string;
    name?: string;
    description?: string;
    uom_id?: number | string;
    unit_id?: number | string;
    standard_price?: number | string;
    standard_cost?: number | string;
    unit_price?: number | string;
}

/**
 * @file po-schemas.ts
 * @description Zod validation schemas for Purchase Order (PO) module.
 * @backend-ready Aligned with actual DB structure and QC → PO flow.
 */

// ====================================================================================
// 0. HELPERS
// ====================================================================================

/**
 * Helper สำหรับ ID ที่สามารถเป็นค่าว่างได้
 * แปลงค่าแปลกๆ (เช่น "", null, 0, NaN) ให้เป็น undefined อย่างปลอดภัย
 */
const optionalIdSchema = z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) || num === 0 ? undefined : num;
}, z.number().optional().nullable());

/**
 * Helper สำหรับตัวเลขทั่วไปที่เป็น Optional (เครดิตเทอม, ส่วนลด, อัตราแลกเปลี่ยน)
 * ป้องกันปัญหา expected number, received NaN เมื่อผู้ใช้ทิ้งช่องว่างไว้
 */
export const optionalNumberSchema = z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
}, z.number().optional().nullable());

// ====================================================================================
// 1. STATUS ENUM (Canonical — Single Source of Truth)
// ====================================================================================

export const POStatusEnum = z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'COMPLETED', 'CANCELLED', 'REJECTED']);
export type POStatus = z.infer<typeof POStatusEnum>;

export const PO_STATUS_OPTIONS = [
    { value: 'DRAFT',            label: 'แบบร่าง' },
    { value: 'PENDING_APPROVAL', label: 'รออนุมัติ' },
    { value: 'APPROVED',         label: 'อนุมัติแล้ว' },
    { value: 'REJECTED',         label: 'ไม่อนุมัติ' },
    { value: 'ISSUED',           label: 'ออก PO แล้ว' },
    { value: 'COMPLETED',        label: 'ปิดรายการ' },
    { value: 'CANCELLED',        label: 'ยกเลิก' },
] as const;

// ====================================================================================
// 2. PO TRANSACTION SCHEMA (History)
// ====================================================================================

export const POTransactionSchema = z.object({
    id:           optionalIdSchema,
    po_id:        optionalIdSchema,
    from_status:  POStatusEnum.optional(),
    to_status:    POStatusEnum,
    action_by:    z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number()),
    action_date:  z.string(),
    remark:       z.string().optional(),
});

export type POTransaction = z.infer<typeof POTransactionSchema>;

// ====================================================================================
// 3. PO LINE SCHEMA
// ====================================================================================

export const POLineSchema = z.object({
    id:              z.number().optional(), // Dual mapping for UI compatibility (matches item_id)
    code:            z.string().optional(), // Dual mapping for UI compatibility (matches item_code)
    line_no: z.coerce.number().min(1),
    item_id: z.coerce.number().min(1, "กรุณาเลือกรหัสสินค้าจากตาราง"),
    item_code:       z.string().optional(),
    item_name:       z.string().optional(),
    description:     z.string().optional().default(''),
    pr_line_id:      optionalIdSchema,
    status:          z.string().default('OPEN'),
    qty:             z.preprocess((val) => (val === "" ? NaN : Number(val)), z.number().min(0.0001, 'จำนวนต้องมากกว่า 0')),
    uom_id: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(1, 'กรุณาเลือกหน่วยนับ')),
    unit_price:      z.preprocess((val) => (val === "" ? NaN : Number(val)), z.number().min(0, 'ราคาต้องไม่ติดลบ')),
    tax_code_id:     optionalIdSchema,
    discount_expression: z.string().default('0'),
    required_receipt_type: z.enum(['FULL', 'PARTIAL']).default('FULL'),
    // Internal UI fields
    qty_ordered:     z.number().optional(),
    discount_amount: optionalNumberSchema,
    line_total:      z.number().nonnegative().optional(),
    receipt_type:    z.enum(['GOODS', 'SERVICE']).optional(),
});

export type POLine = z.infer<typeof POLineSchema>;

// ====================================================================================
// 4. PO LIST ITEM SCHEMA (for API response / table display)
// ====================================================================================

export const POListItemSchema = z.object({
    po_id:            optionalIdSchema,
    po_header_id:     optionalIdSchema,
    po_no:            z.string().optional(),
    po_date:          z.string().optional(),
    qc_id:            optionalIdSchema,
    qc_no:            z.string().optional(),
    pr_id:            optionalIdSchema,
    pr_no:            z.string().optional(),
    vendor_id:        z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number()),
    vendor_name:      z.string().optional(),
    branch_id:        optionalIdSchema,
    status:           POStatusEnum,
    currency_code:    z.string().default('THB'),
    exchange_rate:    z.number().default(1),
    payment_term_days: z.number().int().nonnegative().default(30),
    subtotal:         z.number().nonnegative(),
    tax_amount:       z.number().nonnegative().default(0),
    total_amount:     z.number().nonnegative(),
    remarks:          z.string().optional(),
    reject_reason:    z.string().optional(),
    created_by:       optionalIdSchema,
    created_at:       z.string().optional(),
    transactions:     z.array(POTransactionSchema).optional(),
    item_count:       z.number().int().nonnegative().optional(),
});

export type POListItem = z.infer<typeof POListItemSchema>;

// ====================================================================================
// 5. CREATE PO SCHEMA (Strict — Backend API Ready)
// ====================================================================================

export const CreatePOSchema = z.object({
    pr_id: optionalIdSchema,
    rfq_id: optionalIdSchema,
    vendor_id: z.preprocess((val) => (val === "" || val === null || Number(val) === 0 ? undefined : Number(val)), z.number().min(1, 'กรุณาเลือกผู้ขาย')),
    branch_id: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(1, 'กรุณาสั่งซื้อจากสาขา')),
    warehouse_id: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(1, 'กรุณาระบุคลังสินค้าที่จะรับสินค้า')),
    base_currency_code: z.string().min(1, 'กรุณาระบุสกุลเงินหลัก'),
    quote_currency_code: z.string().min(1, 'กรุณาระบุสกุลเงินที่เสนอ'),
    exchange_rate: optionalNumberSchema,
    exchange_rate_date: z.string().min(1, 'กรุณาระบุวันที่อัตราแลกเปลียน'),
    tax_code_id: optionalIdSchema,
    discount_expression: z.string().optional().default('0'),
    payment_term_days: optionalNumberSchema,
    credit_days: optionalNumberSchema,
    vendor_quote_no: z.string().optional().default(''),
    shipping_method: z.string().optional().default(''),
    delivery_date: z.string().optional().nullable(),
    remark: z.string().optional().default(''),
    status: z.string().default('DRAFT'),
    created_at:     z.string(),
    created_by: optionalIdSchema,
    winning_vq_id: optionalIdSchema,
    po_lines: z.array(POLineSchema).min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
    qc_id:          optionalIdSchema,
    qc_no:          z.string().optional(),
    pr_no:          z.string().optional(),
    vendor_name:    z.string().optional(),
    order_date:     z.string().optional(),
    currency_code:  z.string().optional(),
    total_amount:   z.number().optional(),
});

export type CreatePOData = z.infer<typeof CreatePOSchema>;

// ====================================================================================
// 6. PO FORM SCHEMA (Internal — used by POFormModal with react-hook-form)
// ====================================================================================

export const POFormSchema = z.object({
    // Header
    po_no:    z.string().optional(),
    rfq_id:   optionalIdSchema,
    winning_vq_id: optionalIdSchema,
    qc_id:    optionalIdSchema,
    qc_no:    z.string().optional(),
    pr_id:    optionalIdSchema,
    pr_no:    z.string().optional(),
    po_date:  z.string().min(1, 'กรุณาระบุวันที่ PO'),
    vendor_id: z.preprocess((val) => (val === "" || val === null || Number(val) === 0 ? undefined : Number(val)), z.number().min(1, 'กรุณาเลือกผู้ขาย')),
    vendor_name:            z.string().optional(),
    branch_id: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(1, 'กรุณาเลือกสาขา')),
    ship_to_warehouse_id: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().min(1, 'กรุณาเลือกคลังสินค้า')),

    // Terms
    tax_code_id: optionalIdSchema,
    is_multicurrency:   z.boolean().default(false),
    currency_code: z.string().min(1, 'กรุณาระบุสกุลเงิน'),
    base_currency_code: z.string().default('THB'),
    quote_currency_code: z.string().default('THB'),
    target_currency: z.string().optional().nullable(),
    exchange_rate_date: z.string().optional(),
    exchange_rate: optionalNumberSchema,
    payment_term_days: optionalNumberSchema,
    credit_days: optionalNumberSchema,
    delivery_date:      z.string().min(1, 'กรุณาระบุกำหนดส่งของ'),
    remarks:  z.string().optional(),
    discount_expression: z.string().default('0'),
    po_lines: z.array(POLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
});

export type POFormData = z.infer<typeof POFormSchema>;
