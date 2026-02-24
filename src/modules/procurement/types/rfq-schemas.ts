import { z } from 'zod';
import { 
    RFQ_STATUS_OPTIONS,
    RFQ_VENDOR_STATUS_OPTIONS
} from './rfq-types';

// ====================================================================================
// SHARED MESSAGE CONSTANTS (Mirrors qt-schemas.ts style)
// ====================================================================================
const MESSAGES = {
    REQUIRED: 'Required',
    POSITIVE_NUMBER: 'Must be positive',
    NON_NEGATIVE: 'Cannot be negative',
    INVALID_EMAIL: 'Invalid email format',
    AT_LEAST_ONE_ITEM: 'At least one item is required',
    AT_LEAST_ONE_VENDOR: 'At least one vendor is required',
};

// ====================================================================================
// VENDOR SCHEMA (RFQVendorFormData)
// ====================================================================================
export const RFQVendorSchema = z.object({
    vendor_id: z.string().optional(),
    vendor_code: z.string().min(1, MESSAGES.REQUIRED),
    vendor_name: z.string().min(1, MESSAGES.REQUIRED),
    vendor_name_display: z.string().min(1, MESSAGES.REQUIRED),
    status: z.enum(RFQ_VENDOR_STATUS_OPTIONS).optional(),
});

// ====================================================================================
// LINE ITEM SCHEMA (RFQLineFormData)
// ====================================================================================
export const RFQLineSchema = z.object({
    line_no: z.number().int().min(1, MESSAGES.POSITIVE_NUMBER),
    item_code: z.string().min(1, MESSAGES.REQUIRED),
    item_name: z.string().min(1, MESSAGES.REQUIRED),
    item_description: z.string().optional().or(z.literal('')),
    required_qty: z.number().min(0.0001, 'Quantity must be greater than zero'),
    uom: z.string().min(1, MESSAGES.REQUIRED),
    required_date: z.string().min(1, MESSAGES.REQUIRED),
    remarks: z.string().optional().or(z.literal('')),
    
    // Traceability fields from PR
    item_id: z.string().optional(),
    pr_line_id: z.string().optional(),
    est_unit_price: z.number().min(0, MESSAGES.NON_NEGATIVE).optional(),
    est_amount: z.number().min(0, MESSAGES.NON_NEGATIVE).optional(),
});

// ====================================================================================
// HEADER / MAIN FORM SCHEMA (RFQFormData)
// ====================================================================================
export const RFQFormSchema = z.object({
    // Header
    rfq_no: z.string().optional().or(z.literal('')),
    rfq_date: z.string().min(1, MESSAGES.REQUIRED),
    pr_id: z.string().nullable().optional(),
    pr_no: z.string().nullable().optional(),
    branch_id: z.string().nullable().optional(),
    project_id: z.string().nullable().optional(),
    created_by_name: z.string().min(1, MESSAGES.REQUIRED),
    
    // Using string validation for enums from form, optionally casting/refining.
    status: z.enum(RFQ_STATUS_OPTIONS),
    
    quote_due_date: z.string().min(1, MESSAGES.REQUIRED),
    currency: z.string().min(1, MESSAGES.REQUIRED),
    target_currency: z.string().optional(),
    exchange_rate_date: z.string().optional(),
    exchange_rate: z.number().min(0.0001, MESSAGES.POSITIVE_NUMBER),
    delivery_location: z.string().min(1, MESSAGES.REQUIRED),
    payment_terms: z.string().min(1, MESSAGES.REQUIRED),
    incoterm: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
    isMulticurrency: z.boolean().default(false),
    
    // V-07: Fields carried over from PR
    purpose: z.string().optional().or(z.literal('')),
    cost_center_id: z.string().optional(),
    pr_tax_code_id: z.string().optional(),
    pr_tax_rate: z.number().min(0, MESSAGES.NON_NEGATIVE).optional(),
    
    // Arrays
    lines: z.array(RFQLineSchema).min(1, MESSAGES.AT_LEAST_ONE_ITEM),
    vendors: z.array(RFQVendorSchema).min(1, MESSAGES.AT_LEAST_ONE_VENDOR),
});

// ====================================================================================
// TYPE INFERENCES
// ====================================================================================
export type RFQFormValues = z.infer<typeof RFQFormSchema>;
export type RFQLineValues = z.infer<typeof RFQLineSchema>;
export type RFQVendorValues = z.infer<typeof RFQVendorSchema>;
