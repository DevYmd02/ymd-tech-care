import { z } from 'zod';

/**
 * Schema สำหรับข้อมูลแต่ละรายการในใบสั่งจอง (Line Item)
 */
export const ReservationLineSchema = z.object({
    id: z.coerce.string().optional(),
    reservation_id: z.coerce.string().optional(),
    item_id: z.coerce.string().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().optional().nullable(),
    item_name: z.string().optional().nullable(),
    qty_reserved: z.coerce.number().min(0.001, 'จำนวนจองต้องมากกว่า 0'),
    warehouse_id: z.coerce.string().optional().nullable(),
    location_id: z.coerce.string().optional().nullable(),
    uom_id: z.coerce.string().min(1, 'กรุณาเลือกหน่วยนับ'),
    unit_price: z.coerce.number().min(0, 'ราคาต่อหน่วยต้องไม่ติดลบ'),
    lot_id: z.coerce.number().optional().nullable(),
    lot_no: z.string().optional().nullable(),
    line_discount_input: z.string().optional().nullable(),
    line_discount: z.coerce.number().default(0),
    line_total: z.coerce.number().min(0, 'ยอดรวมรายการต้องไม่ติดลบ').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    tax_code_id: z.coerce.number().optional().nullable(),
    note: z.string().optional().nullable(),
    price_source: z.coerce.number().optional().nullable(),
    price_source_name: z.string().optional().nullable(),
    price_level_priority: z.coerce.number().optional().nullable(),
});

/**
 * Schema สำหรับข้อมูล Header ของใบสั่งจอง
 */
export const ReservationFormSchema = z.object({
    reservation_id: z.coerce.string().optional().nullable(),
    version: z.coerce.number().optional().nullable(),
    reservation_no: z.string().optional(),
    reservation_date: z.string().min(1, 'กรุณาระบุวันที่จอง'),
    lead_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    customer_id: z.coerce.string().min(1, 'กรุณาเลือกลูกค้า'),
    branch_id: z.coerce.string().min(1, 'กรุณาเลือกสาขา'),
    sq_id: z.coerce.string().nullable().optional().transform(v => v === '' ? null : v),
    sq_no: z.string().optional().nullable(),
    aq_id: z.coerce.string().nullable().optional().transform(v => v === '' ? null : v),
    aq_no: z.string().optional().nullable(),
    currency_code: z.string().min(1, 'กรุณาระบุสกุลเงิน'),
    isMulticurrency: z.boolean().default(false),
    base_currency_code: z.string().optional().nullable(),
    quote_currency_code: z.string().optional().nullable(),
    exchange_rate: z.coerce.number().default(1),
    exchange_rate_date: z.string().optional().nullable(),
    ship_days: z.coerce.number().min(0, 'จำนวนวันส่งของต้องไม่ติดลบ').default(0),
    status: z.enum(['DRAFT', 'CONFIRMED', 'RELEASED', 'EXPIRED', 'CANCELLED']).default('DRAFT'),
    remarks: z.string().optional().nullable(),
    payment_term_days: z.coerce.number().min(0, 'เครดิตเทอมต้องไม่ติดลบ').default(0),
    sub_total: z.coerce.number().default(0),
    discount_input: z.string().optional().nullable(),
    discount_amount: z.coerce.number().default(0),
    vat_amount: z.coerce.number().default(0),
    total_amount: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    onhold: z.enum(['Y', 'N']).default('N'),
    tax_code_id: z.coerce.number().nullable().optional(),
    item_id: z.coerce.string().nullable().optional().transform(v => v === '' ? null : v),
    sale_area_id: z.coerce.string().nullable().optional().transform(v => v === '' ? null : v),
    emp_sale_id: z.coerce.string().nullable().optional().transform(v => v === '' ? null : v),
    emp_dept_id: z.coerce.string().min(1, 'กรุณาเลือกแผนก'),
    job_id: z.coerce.string().nullable().optional().transform(v => v === '' ? null : v),
    status_remark: z.string().optional().nullable(),
    lines: z.array(ReservationLineSchema).min(1, 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'),
});

export type ReservationFormValues = z.infer<typeof ReservationFormSchema>;
export type ReservationLineValues = z.infer<typeof ReservationLineSchema>;

/**
 * ค่าเริ่มต้นสำหรับฟอร์มใบสั่งจอง
 */
export const getReservationDefaultValues = (): Partial<ReservationFormValues> => ({
    reservation_no: '',
    reservation_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    branch_id: '',
    currency_code: 'THB',
    isMulticurrency: false,
    base_currency_code: 'THB',
    quote_currency_code: 'THB',
    exchange_rate: 1,
    exchange_rate_date: new Date().toISOString().split('T')[0],
    ship_days: 0,
    status: 'DRAFT',
    onhold: 'N',
    payment_term_days: 0,
    sub_total: 0,
    discount_amount: 0,
    vat_amount: 0,
    total_amount: 0,
    sale_area_id: '',
    emp_sale_id: '',
    emp_dept_id: '',
    job_id: '',
    remarks: '',
    lines: [],
});
