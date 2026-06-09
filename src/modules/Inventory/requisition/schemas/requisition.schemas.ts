/**
 * @file requisition.schemas.ts
 * @description Zod validation schemas สำหรับ Issue Requisition (ใบขอเบิก)
 */

import { z } from 'zod';

// ====================================================================================
// LINE SCHEMA (D2)
// ====================================================================================

export const requisitionLineSchema = z.object({
    _tempId: z.string().optional(),
    docu_item_line_id: z.number().optional(),
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
    qty_ic: z
        .union([z.number(), z.literal('')])
        .refine(v => v !== '' && Number(v) > 0, { message: 'จำนวนต้องมากกว่า 0' }),
    stock_flag: z.number().int().refine(v => [-1, 0, 1].includes(v), {
        message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
    }),
    remark: z.string().max(255).optional(),
});

// ====================================================================================
// HEADER SCHEMA (D1)
// ====================================================================================

export const requisitionHeaderSchema = z.object({
    docu_item_id: z.string().uuid().optional(),

    docu_item_no: z
        .string()
        .min(1, 'กรุณาเลือกรายการเอกสาร'),

    issue_req_no: z
        .string()
        .min(1, 'กรุณาระบุเลขที่เอกสาร')
        .max(50, 'เลขที่เอกสารต้องไม่เกิน 50 ตัวอักษร'), // ขยายขนาดเล็กน้อยเพื่อรองรับข้อความ placeholder

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

    created_by_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้บันทึก'),

    request_by_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้ขอเบิก'),

    qty_total: z.number().min(0).default(0),

    stock_effect_ic: z
        .number()
        .int()
        .refine(v => [-1, 0, 1].includes(v), {
            message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
        })
        .default(0),

    remark: z.string().max(255).optional(),

    cancel_flag: z.string().length(1).default('N'),

    cancel_date: z.string().nullable().optional(),

    cancel_remark: z.string().max(255).optional(),

    lines: z
        .array(requisitionLineSchema)
        .min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
});

// ====================================================================================
// INFERRED TYPES
// ====================================================================================

export type RequisitionHeaderFormData = z.infer<typeof requisitionHeaderSchema>;
export type RequisitionLineFormData = z.infer<typeof requisitionLineSchema>;
export type RequisitionFormData = RequisitionHeaderFormData;
