/**
 * @file transfer-in.schemas.ts
 * @description Zod Schemas สำหรับ Validation ของ Transfer In
 */

import { z } from 'zod';

// ====================================================================================
// LINE SCHEMA
// ====================================================================================

export const transferInLineSchema = z.object({
    appv_transfer_line_id: z.union([z.string(), z.number()]).optional(),
    item_id: z.union([z.string(), z.number()]),
    item_name: z.string().optional(),
    qty: z.coerce.number().min(0.01, 'จำนวนต้องมากกว่า 0'),
    qty_approved: z.coerce.number().optional(),
    uom_id: z.union([z.string(), z.number()]),
    from_warehouse_id: z.union([z.string(), z.number()]),
    from_location_id: z.union([z.string(), z.number()]).nullable().optional(),
    to_warehouse_id: z.union([z.string(), z.number()]),
    to_location_id: z.union([z.string(), z.number()]).nullable().optional(),
    lot_id: z.union([z.string(), z.number()]).nullable().optional(),
    lot_balance_id: z.union([z.string(), z.number()]).nullable().optional(),
    remarks: z.string().nullable().optional(),
    conversion_id: z.union([z.string(), z.number()]).optional(),
});

// ====================================================================================
// FORM SCHEMA (HEADER + LINES)
// ====================================================================================

export const transferInFormSchema = z.object({
    transfer_in_no: z.string().optional(),
    transfer_in_date: z.string(),
    appv_transfer_id: z.union([z.string(), z.number()]).optional(),
    emp_dept_id: z.union([z.string(), z.number()]),
    branch_id: z.union([z.string(), z.number()]),
    project_id: z.union([z.string(), z.number()]).optional(),
    remarks: z.string().optional(),
    created_by_emp_id: z.union([z.string(), z.number()]).optional(),
    status: z.string().optional(),
    doc_link_ic_id: z.union([z.string(), z.number()]).optional(),
    stock_effect_ic: z.coerce.number().nullable().optional(),
    doc_type_no: z.union([z.string(), z.number()]).optional(),
    
    lines: z.array(transferInLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
});

export type TransferInFormValues = z.infer<typeof transferInFormSchema>;
