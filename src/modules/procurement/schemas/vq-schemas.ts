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
  quotation_line_id: z.coerce.number().optional(),
  item_id: z.coerce.number().optional().or(z.literal(0)),
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  qty: z.number().min(0, 'Quantity cannot be negative'),
  uom_id: z.coerce.number().optional().or(z.literal(0)),
  uom_name: z.string().optional(),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  discount_expression: z.string().optional(),
  discount_amount: z.number().min(0),
  net_amount: z.number(),
  no_quote: z.boolean(),
  reference_price: z.number().optional(),
  status: z.string().optional(),
}).refine(data => {
  // If no_quote is false (offered), unit_price must be > 0
  if (!data.no_quote) {
    return data.unit_price > 0;
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
  rfq_no: z.string().optional(), // Human-readable Ref RFQ
  currency: z.string().min(1, 'Currency is required'),
  isMulticurrency: z.boolean().optional(),
  exchange_rate_date: z.string().optional(),
  target_currency: z.string().optional(),
  exchange_rate: z.number().min(0.0001, 'Exchange rate must be positive').optional(),
  payment_term_days: z.number().min(0).optional(),
  payment_terms: z.string().optional(),
  delivery_days: z.number().min(0).optional(),
  lead_time_days: z.number().min(0).optional(),
  valid_until: z.string().min(1, 'Valid until date is required'),
  remark: z.string().optional(),
  discount_expression: z.string().optional(),
  tax_code_id: z.coerce.number().min(1, 'กรุณาเลือกภาษี'),
  sub_total: z.number().optional(),
  pre_tax_amount: z.number().optional(),
  tax_amount: z.number().optional(),
  tax_rate: z.number().optional(),
  net_amount: z.number().optional(),
  total_amount: z.number().optional(),
  status: VQStatusEnum,
  vq_lines: z.array(QuotationLineSchema).min(1, 'At least one item is required'),
}).superRefine((data, ctx) => {
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