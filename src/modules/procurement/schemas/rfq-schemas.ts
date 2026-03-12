import { z } from 'zod';

// ====================================================================================
// STATUS ENUM (Canonical — Self-Contained)
// ====================================================================================

export const RFQStatusEnum = z.enum(['DRAFT', 'SENT', 'CLOSED', 'CANCELLED']);
export type RFQStatusType = z.infer<typeof RFQStatusEnum>;

export const RFQVendorStatusEnum = z.enum(['PENDING', 'SENT', 'RESPONDED', 'NO_RESPONSE', 'DECLINED', 'RECORDED']);
export type RFQVendorStatusType = z.infer<typeof RFQVendorStatusEnum>;

// ====================================================================================
// SHARED MESSAGE CONSTANTS (Mirrors qt-schemas.ts style)
// ====================================================================================
const MESSAGES = {
    REQUIRED: 'Required',
    POSITIVE_NUMBER: 'Must be positive',
    NON_NEGATIVE: 'Cannot be negative',
    INVALID_EMAIL: 'Invalid email format',
    AT_LEAST_ONE_ITEM: 'At least one item is required',
};

// ====================================================================================
// VENDOR SCHEMA (RFQVendorFormData)
// ====================================================================================
export const RFQVendorSchema = z.object({
    vendor_id: z.number().optional(),
    vendor_code: z.string().optional().or(z.literal('')),
    vendor_name: z.string().optional().or(z.literal('')),
    vendor_name_display: z.string().optional().or(z.literal('')),
    status: RFQVendorStatusEnum.optional(),
    is_existing: z.boolean().optional(),
});

// ====================================================================================
// LINE ITEM SCHEMA (RFQLineFormData)
// ✅ Only qty is truly required with a meaningful validation.
//    Other fields are optional to allow draft saves with incomplete line data.
// ====================================================================================
export const RFQLineSchema = z.object({
    line_no: z.number().int().min(1, MESSAGES.POSITIVE_NUMBER),
    item_code: z.string().optional().or(z.literal('')),
    item_name: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    qty: z.number().min(0, 'Quantity must be zero or greater'),
    uom: z.string().optional().or(z.literal('')),
    uom_id: z.number().optional(),
    required_receipt_type: z.string().optional().or(z.literal('')),
    target_delivery_date: z.string().optional().or(z.literal('')),
    note_to_vendor: z.string().optional().or(z.literal('')),
    
    // Traceability fields from PR
    item_id: z.number().optional(),
    pr_line_id: z.number().optional(),
    est_unit_price: z.number().min(0, MESSAGES.NON_NEGATIVE).optional(),
    est_amount: z.number().min(0, MESSAGES.NON_NEGATIVE).optional(),
});

// ====================================================================================
// HEADER / MAIN FORM SCHEMA (RFQFormData)
// ✅ Required (red asterisk in UI):
//    rfq_date, status, branch_id, quotation_due_date, rfqLines (min 1)
// ❌ Optional (no asterisk, auto-fill, or informational):
//    pr_no, pr_id, receive_location, payment_term_hint, incoterm,
//    requested_by, requested_by_user_id, remarks, purpose, vendors
// ====================================================================================
export const RFQFormSchema = z.object({
    // Header — auto-generated, not user-validated
    rfq_no: z.string(),

    // ✅ Required by UI (red asterisk)
    rfq_date: z.string().min(1, MESSAGES.REQUIRED),
    status: RFQStatusEnum,
    branch_id: z.number().int().min(1, 'กรุณาเลือกสาขา (Required)'),
    quotation_due_date: z.string().min(1, MESSAGES.REQUIRED),

    // Optional — PR reference (can create blank RFQ without PR)
    pr_id: z.number().nullable().optional(),
    pr_no: z.string().nullable().optional(),

    // Optional — user/cost center info
    project_id: z.number().nullable().optional(),
    requested_by_user_id: z.number().optional(),
    requested_by: z.string().optional().or(z.literal('')),

    // Optional — free-text fields with no asterisk in UI
    receive_location: z.string().optional().or(z.literal('')),
    payment_term_hint: z.string().optional().or(z.literal('')),
    incoterm: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
    purpose: z.string().optional().or(z.literal('')),

    // Currency — always has defaults, optional for multicurrency fields
    rfq_base_currency_code: z.string().min(1, MESSAGES.REQUIRED),
    rfq_quote_currency_code: z.string().optional().or(z.literal('')),
    rfq_exchange_rate_date: z.string().optional().or(z.literal('')),
    rfq_exchange_rate: z.number().min(0, MESSAGES.NON_NEGATIVE).optional(),
    isMulticurrency: z.boolean().default(false),

    // V-07: Fields carried over from PR (use coerce to handle API returning strings like "7")
    cost_center_id: z.coerce.number().optional(),
    pr_tax_code_id: z.coerce.number().optional(),
    pr_tax_rate: z.coerce.number().min(0, MESSAGES.NON_NEGATIVE).optional(),

    // ✅ Lines required (must have at least 1)
    rfqLines: z.array(RFQLineSchema).min(1, MESSAGES.AT_LEAST_ONE_ITEM),

    // Optional — vendors can be added after initial save
    vendors: z.array(RFQVendorSchema).optional().default([]),
}).refine((data) => {
    if (!data.vendors || data.vendors.length <= 1) return true;
    const vendorIds = data.vendors
        .map(v => v.vendor_id)
        .filter((id): id is number => id !== undefined);
    return new Set(vendorIds).size === vendorIds.length;
}, {
    message: "ไม่สามารถเลือกผู้ขายซ้ำกันได้",
    path: ["vendors"],
});

// ====================================================================================
// TYPE INFERENCES
// ====================================================================================
export type RFQFormValues = z.infer<typeof RFQFormSchema>;
export type RFQLineValues = z.infer<typeof RFQLineSchema>;
export type RFQVendorValues = z.infer<typeof RFQVendorSchema>;

// ====================================================================================
// DEFAULT VALUES & HELPERS
// ====================================================================================

export const createEmptyRFQLine = (lineNo: number): RFQLineValues => ({
    line_no: lineNo,
    item_code: '',
    item_name: '',
    description: '',
    qty: 0,
    uom: '',
    uom_id: 0,
    required_receipt_type: 'FULL',
    target_delivery_date: '',
    note_to_vendor: '',
});

export const getRFQDefaultFormValues = (): RFQFormValues => ({
    rfq_no: 'DRAFT',
    rfq_date: new Date().toLocaleDateString('en-CA'),
    pr_id: null,
    pr_no: null,
    branch_id: 0,
    project_id: null,
    requested_by_user_id: 1,
    requested_by: 'ระบบจะกรอกอัตโนมัติ',
    status: 'DRAFT',
    quotation_due_date: '',
    rfq_base_currency_code: 'THB',
    rfq_quote_currency_code: 'THB',
    rfq_exchange_rate: 1,
    rfq_exchange_rate_date: '',
    receive_location: '',
    payment_term_hint: '',
    incoterm: '',
    remarks: '',
    isMulticurrency: false,
    purpose: '',
    rfqLines: Array.from({ length: 1 }, (_, i) => createEmptyRFQLine(i + 1)),
    vendors: [],
});
