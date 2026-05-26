import { z } from 'zod';

/**
 * Schema สำหรับข้อมูลแต่ละรายการในใบสั่งขาย (Line Item)
 */
export const SalesOrderLineSchema = z.object({
    so_line_id: z.union([z.string(), z.number()]).optional(),
    so_id: z.union([z.string(), z.number()]).optional(),
    item_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().default(''),
    item_name: z.string().default(''),
    qty_ordered: z.coerce.number().min(0.001, 'จำนวนต้องมากกว่า 0'),
    uom_id: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
    warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้า'),
    location_id: z.string().min(1, 'กรุณาเลือกที่เก็บ'),
    unit_price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
    lot_id: z.string().optional(),
    lot_no: z.string().optional(),
    line_discount_input: z.string().optional(),
    line_discount: z.coerce.number().default(0),
    line_total: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    note: z.string().optional(),
    tax_code_id: z.coerce.number().optional(),
    reservation_line_id: z.coerce.number().optional(),
    price_source: z.any().optional(),
    price_source_name: z.any().optional(),
    price_level_priority: z.any().optional(),
    item_uom_id: z.any().optional(),
}).passthrough();

/**
 * Schema สำหรับข้อมูล Header ของใบสั่งขาย
 */
export const SalesOrderFormSchema = z.object({
    so_id: z.union([z.string(), z.number()]).optional(),
    so_no: z.string().optional(),
    so_date: z.string().min(1, 'กรุณาระบุวันที่สั่งขาย'),
    customer_id: z.string().min(1, 'กรุณาเลือกลูกค้า'),
    branch_id: z.string().min(1, 'กรุณาเลือกสาขา'),
    reservation_id: z.string().optional(),
    reservation_no: z.string().optional(),
    currency_code: z.string().min(1, 'กรุณาระบุสกุลเงิน'),
    isMulticurrency: z.boolean().default(false),
    base_currency_code: z.string().optional(),
    quote_currency_code: z.string().optional(),
    exchange_rate: z.coerce.number().default(1),
    exchange_rate_date: z.string().optional(),
    ship_days: z.coerce.number().default(0),
    status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED', 'CLOSED', 'CANCELLED']).default('DRAFT'),
    remarks: z.string().optional(),
    payment_term_days: z.coerce.number().default(0),
    sub_total: z.coerce.number().default(0),
    discount_input: z.string().optional(),
    discount_amount: z.coerce.number().default(0),
    vat_amount: z.coerce.number().default(0),
    total_amount: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    onhold: z.enum(['Y', 'N']).default('N'),
    tax_code_id: z.coerce.number().optional(),
    emp_sale_id: z.union([z.string(), z.number()]).optional(),
    emp_sale_name: z.string().optional(),
    emp_area_id: z.string().optional(),
    emp_dept_id: z.string().min(1, 'กรุณาเลือกแผนก'),
    job_id: z.string().optional(),
    status_remark: z.string().optional(),
    ship_date: z.string().optional(),
    lines: z.array(SalesOrderLineSchema).min(1, 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'),
});

export type SalesOrderFormValues = z.infer<typeof SalesOrderFormSchema>;
export type SalesOrderLineValues = z.infer<typeof SalesOrderLineSchema>;

/**
 * ค่าเริ่มต้นสำหรับฟอร์มใบสั่งขาย
 */
export const getSalesOrderDefaultValues = (): Partial<SalesOrderFormValues> => ({
    so_no: '',
    so_date: new Date().toISOString().split('T')[0],
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
    emp_dept_id: '',
    job_id: '',
    ship_date: new Date().toISOString().split('T')[0],
    lines: [],
});
