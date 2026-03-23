/**
 * @file poa-schemas.ts
 * @description Zod validation schemas for Purchase Order Approval (POA) module.
 */

import { z } from 'zod';
import { POLineSchema } from './po-schemas';

export const POAFormSchema = z.object({
    po_no: z.string().optional(),
    po_date: z.string().optional(),
    vendor_id: z.number().optional(),
    vendor_name: z.string().optional(),
    remarks: z.string().optional(),
    reject_reason: z.string().optional(),
    po_lines: z.array(POLineSchema),
});

export type POAFormData = z.infer<typeof POAFormSchema>;
