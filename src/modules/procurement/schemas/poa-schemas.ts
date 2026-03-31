/**
 * @file poa-schemas.ts
 * @description Zod validation schemas for Purchase Order Approval (POA) module.
 */

import { z } from 'zod';
import { POLineSchema } from './po-schemas';

export const POALineSchema = POLineSchema.extend({
    is_approved: z.boolean().optional(),
    line_remark: z.string().optional(),
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
    status: z.string().optional(), // Added for unified approval payload
    po_lines: z.array(POALineSchema),
});

export type POAFormData = z.infer<typeof POAFormSchema>;
