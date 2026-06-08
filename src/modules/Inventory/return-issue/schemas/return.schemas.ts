/**
 * @file return.schemas.ts
 * @description Zod validation schemas สำหรับ Return Issue Stock (รับคืนจากการเบิก)
 */

import { z } from 'zod';

// ====================================================================================
// LINE SCHEMA (D8)
// ====================================================================================

export const returnIssueLineSchema = z.object({
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
    qty_ic: z
        .union([z.number(), z.literal('')])
        .refine(v => v !== '' && Number(v) >= 0, { message: 'จำนวนเบิกเดิมต้องไม่ติดลบ' }),
    qty_return_ic: z
        .union([z.number(), z.literal('')])
        .refine(v => v !== '' && Number(v) > 0, { message: 'จำนวนคืนต้องมากกว่า 0' }),
    lot_id: z.string().optional().nullable(),
    lot_no: z.string().optional(),
    unit_cost: z
        .union([z.number(), z.literal('')])
        .refine(v => v !== '' && Number(v) >= 0, { message: 'ต้นทุนต้องมากกว่าหรือเท่ากับ 0' })
        .default(0),
    good_amnt: z.number().min(0).default(0),
    standard_buy_price: z.number().optional().default(0),
    standard_cost: z.number().optional().default(0),
    stock_flag: z.number().int().refine(v => [-1, 0, 1].includes(v), {
        message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
    }).default(1), // รับคืนเข้าคลัง = เพิ่มสต็อก (1) เป็นค่าเริ่มต้น
    remark: z.string().max(255).optional(),
}).refine(data => {
    const qty = Number(data.qty_ic) || 0;
    const ret = Number(data.qty_return_ic) || 0;
    return ret <= qty;
}, {
    message: 'จำนวนคืนต้องไม่เกินจำนวนเบิกเดิม',
    path: ['qty_return_ic'],
});

// ====================================================================================
// HEADER SCHEMA (D7)
// ====================================================================================

export const returnIssueHeaderSchema = z.object({
    docu_item_id: z.string().uuid().optional(),

    docu_item_no: z
        .string()
        .optional()
        .nullable(),

    issue_stk_no: z
        .string()
        .min(1, 'กรุณาระบุเลขที่ใบเบิกอ้างอิง')
        .max(50),

    reissue_stk_no: z
        .string()
        .min(1, 'กรุณาระบุเลขที่เอกสารรับคืน')
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

    rece_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้รับสินค้าคืน'),

    stock_effect_ic: z
        .number()
        .int()
        .refine(v => [-1, 0, 1].includes(v), {
            message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
        })
        .default(1), // ค่าเริ่มต้น เพิ่มคลัง สำหรับการรับคืน

    amnt_total: z.number().min(0).default(0),

    remark: z.string().max(255).optional(),

    cancel_flag: z.string().length(1).default('N'),

    cancel_date: z.string().nullable().optional(),

    cancel_remark: z.string().max(255).optional(),

    lines: z
        .array(returnIssueLineSchema)
        .min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
});

// ====================================================================================
// INFERRED TYPES
// ====================================================================================

export type ReturnIssueHeaderFormData = z.infer<typeof returnIssueHeaderSchema>;
export type ReturnIssueLineFormData = z.infer<typeof returnIssueLineSchema>;
export type ReturnIssueFormData = ReturnIssueHeaderFormData;
