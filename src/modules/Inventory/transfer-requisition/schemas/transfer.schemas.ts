/**
 * @file transfer.schemas.ts
 * @description Zod validation schemas สำหรับ Transfer Requisition (ใบขอโอนย้ายสินค้า)
 */

import { z } from 'zod';

// ====================================================================================
// LINE SCHEMA (D10)
// ====================================================================================

export const transferLineSchema = z.object({
    _tempId: z.string().optional(),
    listno: z.number().int().min(1),
    item_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().optional(),
    item_name: z.string().max(255).optional(),
    uom_id: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
    item_uom_id: z.string().optional(),
    from_warehouse_id: z.string().min(1, 'กรุณาเลือกคลังต้นทาง'),
    from_warehouse_name: z.string().optional(),
    from_location_id: z.string().optional().nullable(),
    from_location_name: z.string().optional(),
    to_warehouse_id: z.string().min(1, 'กรุณาเลือกคลังปลายทาง'),
    to_warehouse_name: z.string().optional(),
    to_location_id: z.string().optional().nullable(),
    to_location_name: z.string().optional(),
    qty_ic: z
        .union([z.number({ message: 'กรุณาระบุจำนวนเป็นตัวเลข' }), z.literal(''), z.nan()])
        .refine(v => v !== '' && !isNaN(Number(v)) && Number(v) > 0, { message: 'จำนวนต้องมากกว่า 0' }),
    lot_id: z.string().optional().nullable(),
    lot_balance_id: z.string().optional().nullable(),
    lot_no: z.string().optional(),
    lot_available_qty: z.number().optional(),
    stock_flag: z.number().int().refine(v => [-1, 0, 1].includes(v), {
        message: 'ผลต่อ Stock ต้องเป็น -1, 0 หรือ 1',
    }).default(0), // default 0 = ไม่ส่งผลต่อยอดรวมใหญ่ทันที หรือเป็นไปตามกระบวนการโอนย้าย
    remark: z.string().max(255).optional(),
}).refine(data => {
    // ป้องกันการเลือกคลังต้นทางและปลายทางเป็นคลังเดียวกัน
    return data.from_warehouse_id !== data.to_warehouse_id;
}, {
    message: 'คลังปลายทางต้องไม่ใช่คลังเดียวกับคลังต้นทาง',
    path: ['to_warehouse_id'],
});

// ====================================================================================
// HEADER SCHEMA (D9)
// ====================================================================================

export const transferHeaderSchema = z.object({
    transfer__req_id: z.string().min(1).optional(),

    transfer__req_no: z
        .string()
        .min(1, 'กรุณาระบุเลขที่เอกสารขอโอนย้าย')
        .max(50),

    docu_date: z
        .string()
        .min(1, 'กรุณาระบุวันที่เอกสาร'),

    docu_item_no: z
        .string()
        .min(1, 'กรุณาเลือกรายการเอกสาร'),

    branch_id: z
        .string()
        .min(1, 'กรุณาเลือกสาขา'),

    save_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้บันทึก'),

    transfer_emp_id: z
        .string()
        .min(1, 'กรุณาเลือกผู้ขอโอน'),

    transfer_emp_name: z.string().optional(),

    stock_effect_ic: z
        .number()
        .int()
        .nullable()
        .optional()
        .default(0),

    remark: z.string().max(255).optional(),

    cancelflag: z.string().length(1).default('N'),

    cancle_remark: z.string().max(255).optional(),

    status: z.string().optional().default('DRAFT'),

    lines: z
        .array(transferLineSchema)
        .min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
});

// ====================================================================================
// INFERRED TYPES
// ====================================================================================

export type TransferHeaderFormData = z.infer<typeof transferHeaderSchema>;
export type TransferLineFormData = z.infer<typeof transferLineSchema>;
export type TransferFormData = TransferHeaderFormData;
