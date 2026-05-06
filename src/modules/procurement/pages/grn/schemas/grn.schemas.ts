import { z } from 'zod';

export const GRNLineSchema = z.object({
    po_line_id: z.number(),
    item_id: z.number(),
    item_code: z.string(),
    item_name: z.string(),
    qty_ordered: z.number().optional(),
    qty_received: z.number().min(0, "จำนวนที่รับต้องไม่ติดลบ"),
    accepted_qty: z.number().min(0),
    rejected_qty: z.number().min(0),
    uom_id: z.string().min(1, "กรุณาระบุหน่วย"),
    uom_name: z.string(),
    unit_price: z.number().optional(),
    line_total: z.number().optional(),
    qc_status: z.string().optional(),
    lot_id: z.string().optional(),
    lot_code: z.string().optional(),
    remark: z.string().optional(),
});

export const GRNFormSchema = z.object({
    grn_no: z.string().optional(),
    po_id: z.number({ message: "กรุณาเลือกใบสั่งซื้อ" }),
    received_date: z.string().min(1, "กรุณาระบุวันที่รับ"),
    warehouse_id: z.number({ message: "กรุณาระบุคลังสินค้า" }),
    received_by: z.number({ message: "กรุณาระบุผู้รับสินค้า" }),
    status: z.string().default('Draft'),
    remark: z.string().optional(),
    emp_dept_id: z.string().optional(),
    job_id: z.string().optional(),
    
    // Multicurrency
    isMulticurrency: z.boolean().default(false),
    curr_id: z.string().optional(),
    curr_type_id: z.string().optional(),
    curr_type_code: z.string().optional(),
    exchange_rate: z.number().optional(),
    rate_date: z.string().optional(),
    
    items: z.array(GRNLineSchema).min(1, "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"),
});

export type GRNFormValues = z.infer<typeof GRNFormSchema>;
export type GRNLineValues = z.infer<typeof GRNLineSchema>;
