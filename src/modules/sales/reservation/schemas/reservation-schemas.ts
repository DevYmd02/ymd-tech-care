import { z } from 'zod';

/**
 * Schema สำหรับข้อมูลแต่ละรายการในใบสั่งจอง (Line Item)
 */
export const ReservationLineSchema = z.object({
    id: z.string().optional(),
    reservation_id: z.string().optional(),
    item_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().optional(),
    item_name: z.string().optional(),
    qty_reserved: z.coerce.number().min(0.001, 'จำนวนต้องมากกว่า 0'),
    warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้า'),
    location_id: z.string().min(1, 'กรุณาเลือกที่เก็บ'),
    uom_id: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
    unit_price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
    lot_no: z.string().optional(),
    line_discount_input: z.string().optional(),
    line_discount: z.coerce.number().default(0),
    reserve_policy: z.enum(['AUTO', 'MANUAL']).default('AUTO'),
    line_total: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    tax_code_id: z.coerce.number().optional(),
    note: z.string().optional(),
});

/**
 * Schema สำหรับข้อมูล Header ของใบสั่งจอง
 */
export const ReservationFormSchema = z.object({
    reservation_id: z.string().optional(),
    reservation_no: z.string().min(1, 'กรุณาระบุเลขที่ใบสั่งจอง'),
    reservation_date: z.string().min(1, 'กรุณาระบุวันที่จอง'),
    lead_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    customer_id: z.string().min(1, 'กรุณาเลือกลูกค้า'),
    branch_id: z.string().min(1, 'กรุณาเลือกสาขา'),
    sq_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    aq_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    currency_code: z.string().min(1, 'กรุณาระบุสกุลเงิน'),
    isMulticurrency: z.boolean().default(false),
    base_currency_code: z.string().optional(),
    quote_currency_code: z.string().optional(),
    exchange_rate: z.coerce.number().default(1),
    exchange_rate_date: z.string().optional(),
    ship_days: z.coerce.number().default(0),
    status: z.enum(['DRAFT', 'CONFIRMED', 'RELEASED', 'EXPIRED', 'CANCELLED']).default('DRAFT'),
    remarks: z.string().optional(),
    payment_term_days: z.coerce.number().default(0),
    sub_total: z.coerce.number().default(0),
    discount_input: z.string().optional(),
    discount_amount: z.coerce.number().default(0),
    vat_amount: z.coerce.number().default(0),
    total_amount: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    onhold: z.enum(['Y', 'N']).default('N'),
    tax_code_id: z.coerce.number().nullable().optional(),
    item_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    sale_area_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    emp_sale_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    emp_dept_id: z.string().min(1, 'กรุณาเลือกแผนก'),
    job_id: z.string().or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    status_remark: z.string().optional(),
    ship_date: z.string().optional(),
    lines: z.array(ReservationLineSchema).min(1, 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'),
});

export type ReservationFormValues = z.infer<typeof ReservationFormSchema>;
export type ReservationLineValues = z.infer<typeof ReservationLineSchema>;

/**
 * ค่าเริ่มต้นสำหรับฟอร์มใบสั่งจอง
 */
export const getReservationDefaultValues = (): Partial<ReservationFormValues> => ({
    reservation_no: 'RS-AUTO',
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
    ship_date: new Date().toISOString().split('T')[0],
    lines: [],
});
