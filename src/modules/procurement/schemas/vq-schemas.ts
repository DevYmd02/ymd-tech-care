import { z } from 'zod';

// ====================================================================================
// STATUS ENUM (Canonical — Single Source of Truth)
// ====================================================================================

/**
 * VQ Status Enum
 * PENDING  = รอผู้ขายตอบกลับ (No VQ ID)
 * DRAFT    = แบบร่าง (Internal draft)
 * RECORDED = บันทึกแล้ว (Procurement keyed in data — VQ ID generated)
 * DECLINED = ผู้ขายปฏิเสธ
 * EXPIRED  = หมดอายุ
 * CANCELLED = ยกเลิก
 */
export const VQStatusEnum = z.enum(['PENDING', 'DRAFT', 'RECORDED', 'DECLINED', 'EXPIRED', 'CANCELLED']);
export type VQStatus = z.infer<typeof VQStatusEnum>;

export const QuotationLineSchema = z.object({
  quotation_line_id: z.coerce.number().optional().default(0),
  item_id: z.coerce.number().min(1, "กรุณาสรุปรายการสินค้า (เลือกสินค้า)").optional(), 
  item_code: z.string().optional().default(""),
  item_name: z.string().optional().default(""),
  qty: z.coerce.number().min(1, "กรุณาระบุจำนวน").default(1), 
  uom_id: z.coerce.number().optional().or(z.literal(0)).default(0),
  uom_name: z.string().optional().default(""),
  unit_price: z.coerce.number().min(0.0001, "กรุณาระบุราคาสินค้า").default(0),
  discount_expression: z.string().optional().default(""),
  discount_amount: z.coerce.number().min(0).default(0),
  net_amount: z.coerce.number().default(0),
  no_quote: z.boolean().default(false),
  reference_price: z.coerce.number().optional().default(0),
  status: z.string().optional().default("OPEN"),
  remark: z.string().optional().default(""),
  pr_line_id: z.coerce.number().optional().default(0),
  rfq_line_id: z.coerce.number().optional().default(0),
}).refine(data => {
  // 🛡️ @Agent_Line_Guard: If this is NOT a ghost line (has some data), it must have an ID or Code
  const isGhost = !data.item_id && !data.item_code;
  if (!isGhost) {
      return !!(data.item_id || data.item_code);
  }
  return true;
}, {
  message: "กรุณาระบุรหัสสินค้า",
  path: ["item_code"]
}).refine(data => {
  // If no_quote is false (offered), unit_price must be > 0
  if (!data.no_quote) {
    return (Number(data.unit_price) || 0) > 0;
  }
  return true;
}, {
  message: "กรุณาระบุราคาต่อหน่วย (หรือเลือก 'ไม่เสนอราคา')",
  path: ["unit_price"]
});

export const QuotationHeaderSchema = z.object({
  quotation_no: z.string().optional(),
  quotation_date: z.string().min(1, 'Date is required'),
  vendor_id: z.coerce.number().min(1, 'Vendor is required'),
  vendor_code: z.string().optional(),
  vendor_name: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  qc_id: z.coerce.number().optional(), // FK to Comparison
  rfq_id: z.coerce.number().optional(), // FK to Request For Quotation
  pr_id: z.coerce.number().optional(), // FK to Purchase Request
  rfq_no: z.string().optional(), // Human-readable Ref RFQ
  currency: z.string().min(1, 'Currency is required'),
  isMulticurrency: z.boolean().optional(),
  exchange_rate_date: z.string().optional(),
  target_currency: z.string().optional(),
  exchange_rate: z.coerce.number().min(0.0001, 'Exchange rate must be positive').optional(),
  payment_term_days: z.coerce.number().min(0).optional(),
  payment_terms: z.string().optional(),
  delivery_days: z.coerce.number().min(0).optional(),
  lead_time_days: z.coerce.number().min(0).optional(),
  valid_until: z.string().min(1, 'Valid until date is required'),
  remark: z.string().optional(),
  discount_expression: z.string().optional(),
  tax_code_id: z.coerce.number().min(1, 'กรุณาเลือกภาษี'),
  sub_total: z.coerce.number().optional(),
  pre_tax_amount: z.coerce.number().optional(),
  tax_amount: z.coerce.number().optional(),
  tax_rate: z.coerce.number().optional(),
  net_amount: z.coerce.number().optional(),
  total_amount: z.coerce.number().optional(),
  status: VQStatusEnum,
  vq_lines: z.array(QuotationLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ')
    .refine(lines => lines.some(l => (l.item_id && Number(l.item_id) > 0) || (l.item_code && l.item_code.trim() !== '')), {
      message: "ต้องมีรายการสินค้าที่สมบูรณ์อย่างน้อย 1 รายการ"
    }),
})
.superRefine((data, ctx) => {
  if (data.isMulticurrency) {
    if (!data.currency || data.currency === 'THB') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุสกุลเงินต่างประเทศ",
        path: ["currency"]
      });
    }
    if (!data.exchange_rate || data.exchange_rate <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาระบุอัตราแลกเปลี่ยน",
        path: ["exchange_rate"]
      });
    }
  }
});

export type QuotationFormData = z.infer<typeof QuotationHeaderSchema>;
export type QuotationLineFormData = z.infer<typeof QuotationLineSchema>;