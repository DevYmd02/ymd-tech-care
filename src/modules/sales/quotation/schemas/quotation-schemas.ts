import { z } from 'zod';

/**
 * Schema สำหรับข้อมูลแต่ละรายการในใบเสนอราคา (Line Item)
 */
export const QuotationLineSchema = z.object({
    sq_line_id: z.string().optional(),
    sq_id: z.string().optional(),
    item_id: z.coerce.number().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().optional(),
    item_name: z.string().optional(),
    qty: z.coerce.number().min(0.001, 'จำนวนต้องมากกว่า 0').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป'),
    uom_id: z.coerce.number().min(1, 'กรุณาเลือกหน่วยนับ'),
    unit_price: z.coerce.number().min(0.01, 'กรุณาระบุราคา').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป'),
    discount_expression: z.string().optional(),
    line_discount: z.coerce.number().default(0),
    tax_code_id: z.coerce.number().nullable().optional(),
    line_total: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    note: z.string().optional(),
    // Data from Pricing Engine
    price_source: z.number().optional(),      // 1=Price List, 2=Price Level
    price_source_name: z.string().optional(), // "PRICE_LIST", "PRICE_LEVEL", "MANUAL"
    price_level_priority: z.number().optional(), // Level Number (1, 2, 3...)
});

/**
 * Schema สำหรับข้อมูล Header ของใบเสนอราคา
 */
export const QuotationFormSchema = z.object({
    sq_id: z.string().optional(),
    sq_no: z.string().optional().or(z.literal('')),
    sq_date: z.string().min(1, 'กรุณาระบุวันที่'),
    lead_id: z.union([z.string(), z.number()]).or(z.literal('')).nullable().optional().transform(v => v === '' ? null : v),
    customer_id: z.coerce.number().min(1, 'กรุณาเลือกลูกค้า'),
    branch_id: z.coerce.number().min(1, 'กรุณาเลือกสาขา'),
    currency_code: z.string().min(1, 'กรุณาระบุสกุลเงิน'),
    isMulticurrency: z.boolean().default(false),
    base_currency_code: z.string().optional(),
    quote_currency_code: z.string().optional(),
    exchange_rate: z.coerce.number().default(1),
    exchange_rate_date: z.string().optional(),
    status: z.enum(['DRAFT', 'PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'CANCELLED', 'REJECTED', 'APPROVED']).default('DRAFT'),
    valid_until: z.string().optional(),
    sub_total: z.coerce.number().default(0),
    discount_expression: z.string().optional(),
    discount_amount: z.coerce.number().default(0),
    vat_amount: z.coerce.number().default(0),
    total_amount: z.coerce.number().min(0, 'ยอดรวมต้องไม่ติดลบ (ตรวจสอบส่วนลด)').max(9999999999999, 'ค่าที่ระบุมีจำนวนมากเกินไป').default(0),
    remarks: z.string().optional(),
    payment_term_days: z.coerce.number().default(0),
    onhold: z.enum(['Y', 'N']).default('N'),
    tax_code_id: z.coerce.number().min(1, 'กรุณาเลือกประเภทภาษี'),
    item_id: z.coerce.number().nullable().optional().transform(v => v === 0 ? null : v), // Item/Service Class
    sale_area_id: z.coerce.number().min(1, 'กรุณาเลือกเขตการขาย'),
    emp_sale_id: z.coerce.number().min(1, 'กรุณาเลือกพนักงานขาย'),
    emp_dept_id: z.coerce.number().min(1, 'กรุณาเลือกแผนก'),
    project_id: z.coerce.number().min(1, 'กรุณาเลือกโครงการ'),
    sq_status: z.string().optional(),
    status_remark: z.string().optional(),
    lines: z.array(QuotationLineSchema).min(1, 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'),
});

export type QuotationFormValues = z.infer<typeof QuotationFormSchema>;
export type QuotationLineValues = z.infer<typeof QuotationLineSchema>;

/**
 * ค่าเริ่มต้นสำหรับฟอร์มใบเสนอราคา
 */
export const getQuotationDefaultValues = (): QuotationFormValues => ({
    sq_no: '',
    sq_date: new Date().toISOString().split('T')[0],
    customer_id: 0,
    currency_code: 'THB',
    isMulticurrency: false,
    base_currency_code: 'THB',
    quote_currency_code: 'THB',
    exchange_rate: 1,
    exchange_rate_date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    onhold: 'N',
    payment_term_days: 0,
    sub_total: 0,
    discount_amount: 0,
    vat_amount: 0,
    total_amount: 0,
    lead_id: null,
    branch_id: 0,
    tax_code_id: 0,
    item_id: 0,
    sale_area_id: 0,
    emp_sale_id: 0,
    emp_dept_id: 0,
    project_id: 0,
    lines: [],
});
