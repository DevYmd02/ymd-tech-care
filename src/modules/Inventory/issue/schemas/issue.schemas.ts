/**
 * @file issue.schemas.ts
 * @description Zod validation schemas สำหรับ Stock Issue (ใบเบิก)
 */

import { z } from 'zod';

// ====================================================================================
// LINE SCHEMA (D6)
// ====================================================================================

export const issueStockLineSchema = z.object({
    _tempId: z.string().optional(),
    listno: z.number().int().min(1),
    item_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().optional(),
    item_name: z.string().max(255).optional(),
    uom_id: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
    item_uom_id: z.any().optional(),
    warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้า'),
    warehouse_name: z.string().optional(),
    location_id: z.string().optional().nullable(),
    location_name: z.string().optional(),
    lot_id: z.string().optional().nullable(),
    lot_no: z.string().optional(),
    lot_available_qty: z.number().optional(),
    qty_ic: z
        .union([z.number(), z.literal('')])
        .superRefine((v, ctx) => {
            if (v === '') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'กรุณากรอกจำนวน' });
            } else if (Number(v) <= 0) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'จำนวนต้องมากกว่า 0' });
            }
        }),
    unit_cost: z
        .union([z.number(), z.literal('')])
        .refine(v => v !== '' && Number(v) >= 0, { message: 'ต้นทุนต้องมากกว่าหรือเท่ากับ 0' })
        .default(0),
    good_amnt: z.number().min(0).default(0),
    standard_buy_price: z.number().optional().default(0),
    standard_cost: z.number().optional().default(0),
    stock_flag: z.number().int().refine(v => [-1, 0, 1].includes(v), {
        message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
    }).default(-1), // ค่าเริ่มต้นเป็น ลดสต็อก (-1) สำหรับใบเบิก
    remark: z.string().max(255).optional(),
    appvissue_req_line_id: z.number().optional(),
    lot_balance_id: z.number().optional(),
});

// ====================================================================================
// HEADER SCHEMA (D5)
// ====================================================================================

export const issueStockHeaderSchema = z.object({
    docu_item_id: z.string().uuid().optional(),
    appv_issue_req_id: z.number().optional(),
    doc_link_ic_id: z.number().optional(),

    docu_item_no: z
        .string()
        .min(1, 'กรุณาเลือกรายการเอกสาร'),

    appvissue_req_no: z
        .string()
        .min(1, 'กรุณาระบุเลขที่เอกสารอนุมัติ (อ้างอิง)')
        .max(50),

    issue_req_no: z
        .string()
        .max(50)
        .optional()
        .nullable(),

    issue_stk_no: z
        .string()
        .min(1, 'กรุณาระบุเลขที่เอกสารใบเบิก')
        .max(50),

    docu_date: z
        .string()
        .min(1, 'กรุณาระบุวันที่เอกสาร'),

    emp_dept_id: z
        .string()
        .min(1, 'กรุณาเลือกแผนก'),

    job_id: z
        .string()
        .min(1, 'กรุณาเลือก Job'),

    branch_id: z
        .string()
        .min(1, 'กรุณาเลือกสาขา'),

    save_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้บันทึก'),

    received_by_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้รับสินค้า'),

    stock_effect_ic: z
        .number()
        .int()
        .refine(v => [-1, 0, 1].includes(v), {
            message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
        })
        .default(-1), // ค่าเริ่มต้น ลดคลัง สำหรับการเบิกจ่าย

    amnt_total: z.number().min(0).default(0),

    remark: z.string().max(255).optional(),

    cancel_flag: z.string().length(1).default('N'),

    cancel_date: z.string().nullable().optional(),

    cancel_remark: z.string().max(255).optional(),

    lines: z
        .array(issueStockLineSchema)
        .min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
});

// ====================================================================================
// INFERRED TYPES
// ====================================================================================

export type IssueStockHeaderFormData = z.infer<typeof issueStockHeaderSchema>;
export type IssueStockLineFormData = z.infer<typeof issueStockLineSchema>;
export type IssueStockFormData = IssueStockHeaderFormData;
