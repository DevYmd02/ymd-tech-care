import { z } from 'zod';

export const transferApprovalLineSchema = z.object({
    listno: z.number().int(),
    item_id: z.string().min(1, 'กรุณาระบุสินค้า'),
    item_code: z.string().optional(),
    item_name: z.string().min(1, 'กรุณาระบุชื่อสินค้า'),
    uom_id: z.string().min(1, 'กรุณาระบุหน่วยนับ'),
    income_inve_id: z.string().min(1, 'กรุณาระบุคลังต้นทาง'),
    income_inve_name: z.string().optional(),
    income_loca_id: z.string().optional().nullable(),
    income_loca_name: z.string().optional(),
    out_inve_id: z.string().min(1, 'กรุณาระบุคลังปลายทาง'),
    out_inve_name: z.string().optional(),
    out_loca_id: z.string().optional().nullable(),
    out_loca_name: z.string().optional(),
    qty_ic: z.number().min(0),
    appv_stock_qty: z
        .union([z.number(), z.literal('')])
        .refine(v => v !== '' && Number(v) >= 0, { message: 'จำนวนอนุมัติต้องไม่น้อยกว่า 0' })
        .transform(v => Number(v)),
    lot_id: z.string().optional().nullable(),
    lot_no: z.string().optional(),
    stock_flag: z.number().int().default(0),
    remark: z.string().max(255).optional(),
});

export const transferApprovalSchema = z.object({
    appv_transfer_id: z.string().uuid().optional(),
    appv_transfer_no: z.string().min(1, 'กรุณาระบุเลขที่เอกสารอนุมัติ').default('ระบบจะกรอกอัตโนมัติ'),
    transfer_req_id: z.string().min(1, 'กรุณาเลือกเอกสารขอโอนย้ายอ้างอิง'),
    transfer_req_no: z.string().optional(),
    appv_date: z.string().min(1, 'กรุณาระบุวันที่อนุมัติ'),
    emp_dept_id: z.string().min(1, 'กรุณาเลือกแผนก'),
    job_id: z.string().optional().nullable(),
    remark: z.string().max(255).optional(),
    branch_id: z.string().min(1, 'กรุณาเลือกสาขา'),
    appv_flag: z.enum(['Y', 'P', 'N']).default('Y'), // Y: ทั้งใบ, P: บางส่วน, N: ไม่อนุมัติ
    cancel_date: z.string().optional().nullable(),
    cancel_flag: z.string().length(1).default('N'),
    cancel_remark: z.string().max(255).optional(),
    save_emp_id: z.string().min(1, 'กรุณาเลือกผู้บันทึก'),
    appv_emp_id: z.string().min(1, 'กรุณาเลือกผู้อนุมัติ'),
    stock_effect_ic: z.number().int().default(0),
    lines: z.array(transferApprovalLineSchema).min(1, 'กรุณาระบุรายการอนุมัติอย่างน้อย 1 รายการ'),
});

export type TransferApprovalFormData = z.infer<typeof transferApprovalSchema>;
export type TransferApprovalLineFormData = z.infer<typeof transferApprovalLineSchema>;
