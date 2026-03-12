import { z } from 'zod';

/**
 * @file po-schemas.ts
 * @description Zod validation schemas for Purchase Order (PO) module.
 * @backend-ready Aligned with actual DB structure and QC → PO flow.
 */

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
    id:           z.coerce.number().optional(),
    po_id:        z.coerce.number().optional(),
    from_status:  POStatusEnum.optional(),
    to_status:    POStatusEnum,
    action_by:    z.coerce.number(),
    action_date:  z.string(),
    remark:       z.string().optional(),
});

export type POTransaction = z.infer<typeof POTransactionSchema>;

// ====================================================================================
// 2. PO LINE SCHEMA
// ====================================================================================

export const POLineSchema = z.object({
    item_id:         z.coerce.number().optional(),
    item_code:       z.string().optional(),
    item_name:       z.string().optional(),
    description:     z.string().optional(),
    qty_ordered:     z.number().positive('จำนวนสั่งต้องมากกว่า 0'),
    uom_id:          z.coerce.number(),
    unit_price:      z.number().nonnegative('ราคาต่อหน่วยต้องไม่ติดลบ'),
    discount_amount: z.number().nonnegative().default(0),
    tax_code_id:     z.coerce.number().optional(),
    line_total:      z.number().nonnegative(),
    receipt_type:    z.enum(['GOODS', 'SERVICE']).default('GOODS'),
});

export type POLine = z.infer<typeof POLineSchema>;

// ====================================================================================
// 3. PO LIST ITEM SCHEMA (for API response / table display)
// ====================================================================================

export const POListItemSchema = z.object({
    po_id:            z.coerce.number().optional(),
    po_no:            z.string().optional(),
    po_date:          z.string().optional(),            // ISO date string

    // QC Traceability
    qc_id:            z.coerce.number().optional(),
    qc_no:            z.string().optional(),

    // PR Linkage (Pro-Tip #1)
    pr_id:            z.coerce.number().optional(),
    pr_no:            z.string().optional(),

    // Vendor (Pro-Tip #2)
    vendor_id:        z.coerce.number(),
    vendor_name:      z.string().optional(),

    branch_id:        z.coerce.number().optional(),

    status:           POStatusEnum,

    currency_code:    z.string().default('THB'),
    exchange_rate:    z.number().default(1),
    payment_term_days: z.number().int().nonnegative().default(30),

    subtotal:         z.number().nonnegative(),
    tax_amount:       z.number().nonnegative().default(0),
    total_amount:     z.number().nonnegative(),

    remarks:          z.string().optional(),
    reject_reason:    z.string().optional(),
    created_by:       z.coerce.number().optional(),
    created_at:       z.string().optional(),
    transactions:     z.array(POTransactionSchema).optional(),

    // Aggregates
    item_count:       z.number().int().nonnegative().optional(),
});

export type POListItem = z.infer<typeof POListItemSchema>;

// ====================================================================================
// 4. CREATE PO SCHEMA (Strict — Backend API Ready)
// ====================================================================================

export const CreatePOSchema = z.object({
    // Source document linkage
    qc_id:         z.coerce.number(),              // Required — origin QC
    qc_no:         z.string().optional(),

    // PR Linkage (Pro-Tip #1) — upstream reference from QC
    pr_id:         z.coerce.number().optional(),
    pr_no:         z.string().optional(),

    // Vendor (Pro-Tip #2) — must be the winner vendor from QC
    vendor_id:     z.coerce.number(),           // Required — prevents vendor leak
    vendor_name:   z.string().optional(),
    branch_id:     z.coerce.number().optional(),

    order_date:    z.string().min(1, 'วันที่สั่งซื้อจำเป็นต้องระบุ'),    // ISO date
    delivery_date: z.string().optional(),
    payment_term_days: z.number().int().nonnegative().default(30),

    currency_code: z.string().default('THB'),
    exchange_rate: z.number().positive().default(1),

    tax_code_id:   z.coerce.number().optional(),
    total_amount:  z.number().positive('ยอดรวมต้องมากกว่า 0'),

    items:         z.array(POLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
    remarks:       z.string().optional(),
    reject_reason: z.string().optional(),
});

export type CreatePOData = z.infer<typeof CreatePOSchema>;

// ====================================================================================
// 5. PO FORM SCHEMA (Internal — used by POFormModal with react-hook-form)
// ====================================================================================

/**
 * POFormSchema — Internal validation for the PO creation/edit form.
 * Includes all 9 header fields displayed in the 3-row × 3-col form layout,
 * plus qc_id / qc_no to preserve the QC → PO traceability chain.
 */
export const POFormSchema = z.object({
    // ── Document Identity ───────────────────────────────────────────────────
    po_no:    z.string().optional(),          // Auto-generated by backend; display only

    // ── QC Traceability (QC → PO flow) ──────────────────────────────────────
    qc_id:    z.coerce.number().optional(),
    qc_no:    z.string().optional(),

    // ── PR Reference ────────────────────────────────────────────────────────
    pr_id:    z.coerce.number().optional(),
    pr_no:    z.string().optional(),

    // ── Row 1 ───────────────────────────────────────────────────────────────
    po_date:  z.string().min(1, 'กรุณาระบุวันที่ PO'),

    // ── Row 2 ───────────────────────────────────────────────────────────────
    vendor_id:              z.coerce.number().optional(),
    vendor_name:            z.string().optional(),
    branch_id:              z.coerce.number().optional(),
    ship_to_warehouse_id:   z.coerce.number().optional(),
    tax_code_id:            z.coerce.number().optional(),

    // ── Row 3 ─ Multicurrency ────────────────────────────────────────────────
    is_multicurrency:   z.boolean().default(false),
    currency_code:      z.string().default('THB'),
    target_currency:    z.string().optional(),         // e.g. 'USD' when converting THB → USD
    exchange_rate_date: z.string().optional(),         // ISO date of the rate lookup
    exchange_rate:      z.number().positive().default(1),

    // ── Row 4 ─ Terms ────────────────────────────────────────────────────────
    payment_term_days:  z.number().int().nonnegative().default(30),
    delivery_date:      z.string().optional(),

    // ── Remarks & Line Items ─────────────────────────────────────────────────
    remarks:  z.string().optional(),
    reject_reason: z.string().optional(),
    lines:    z.array(POLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
});

export type POFormData = z.infer<typeof POFormSchema>;
