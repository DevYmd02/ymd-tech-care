import { z } from 'zod';

export const requisitionApproveLineSchema = z.object({
    docu_item_line_id: z.number().optional(),
    listno: z.number().int(),
    item_id: z.string(),
    item_code: z.string().optional(),
    item_name: z.string().optional(),
    uom_id: z.string(),
    uom_name: z.string().optional(),
    warehouse_id: z.string(),
    warehouse_name: z.string().optional(),
    location_id: z.string().optional().nullable(),
    location_name: z.string().optional(),
    lot_id: z.string().optional().nullable(),
    lot_no: z.string().optional(),
    qty_ic: z.number(),
    qty_approved: z.number().default(0),
    is_approved: z.boolean().default(true),
    remark: z.string().optional(),
});

export const requisitionApproveSchema = z.object({
    docu_item_id: z.string().optional(),
    issue_req_no: z.string(),
    docu_item_no: z.string().optional(),
    docu_date: z.string(),
    branch_id: z.string(),
    branch_name: z.string().optional(),
    emp_dept_id: z.string(),
    emp_dept_name: z.string().optional(),
    job_id: z.string(),
    job_name: z.string().optional(),
    created_by_emp_id: z.string(),
    save_emp_name: z.string().optional(),
    request_by_emp_id: z.string(),
    audit_emp_name: z.string().optional(),
    remark: z.string().optional(),
    qty_total: z.number().default(0),

    // Approval fields
    approval_no: z.string().optional(),
    approval_emp_id: z.string().min(1, 'กรุณาเลือกผู้อนุมัติ'),
    approval_emp_name: z.string().optional(),
    approved_date: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
    reject_reason: z.string().optional().default(''),

    lines: z.array(requisitionApproveLineSchema).default([]),
});

export type RequisitionApproveFormData = z.infer<typeof requisitionApproveSchema>;
export type RequisitionApproveLineFormData = z.infer<typeof requisitionApproveLineSchema>;
