import { z } from 'zod';

export const QuotationLineSchema = z.object({
  quotation_line_id: z.string().optional(),
  item_id: z.string().optional(),
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  qty: z.number().min(0, 'Quantity cannot be negative'),
  uom_id: z.string().optional(),
  uom_name: z.string().optional(),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  discount_amount: z.number().min(0),
  net_amount: z.number(),
  no_quote: z.boolean(),
});

export const QuotationHeaderSchema = z.object({
  quotation_no: z.string().optional(),
  quotation_date: z.string().min(1, 'Date is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  vendor_name: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  qc_id: z.string().optional(), // Ref RFQ
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
  sub_total: z.number().optional(),
  pre_tax_amount: z.number().optional(),
  tax_amount: z.number().optional(),
  tax_rate: z.number().optional(),
  net_amount: z.number().optional(),
  total_amount: z.number().optional(),
  lines: z.array(QuotationLineSchema).min(1, 'At least one item is required'),
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