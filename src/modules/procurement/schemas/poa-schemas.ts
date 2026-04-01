/**
 * @file poa-schemas.ts
 * @description Zod validation schemas for Purchase Order Approval (POA) module.
 */

import { z } from 'zod';
import { POLineSchema } from './po-schemas';

export const POALineSchema = POLineSchema.extend({
    is_approved: z.boolean().optional(),
    line_remark: z.string().optional(),
    remaining_qty: z.coerce.number().optional(),
    previously_approved_qty: z.coerce.number().optional(),
    is_processed: z.boolean().optional(),
});

export const POAFormSchema = z.object({
    po_no: z.string().optional(),
    po_date: z.string().optional(),
    vendor_id: z.number().optional(),
    vendor_name: z.string().optional(),
    remarks: z.string().optional(),
    reject_reason: z.string().optional(),
    currency_code: z.string().optional(),
    target_currency: z.string().optional(),
    exchange_rate_date: z.string().optional(),
    exchange_rate: z.number().optional(),
    status: z.string().optional(),
    
    // Header Sync Fields
    branch_id: z.number().optional(),
    branch_name: z.string().optional(),
    payment_term_days: z.number().optional(),
    delivery_date: z.string().optional(),
    tax_code_id: z.number().optional(),
    tax_name: z.string().optional(),
    pr_no: z.string().optional(),
    qc_no: z.string().optional(),
    created_by_name: z.string().optional(),
    
    po_lines: z.array(POALineSchema),
});

export type POAFormData = z.infer<typeof POAFormSchema>;
