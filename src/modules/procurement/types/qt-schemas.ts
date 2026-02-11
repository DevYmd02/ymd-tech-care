import { z } from 'zod';

export const QuotationLineSchema = z.object({
  quotation_line_id: z.string().optional(),
  item_id: z.string().optional(),
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  qty: z.number().min(0.01, 'Quantity must be greater than 0'),
  uom_id: z.string().optional(),
  uom_name: z.string().optional(),
  unit_price: z.number().min(0, 'Price must be positive'),
  discount_amount: z.number().min(0),
  net_amount: z.number(),
  warehouse: z.string().optional(),
  location: z.string().optional(),
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
  currency_code: z.string().min(1, 'Currency is required'),
  exchange_rate: z.number().min(0.0001, 'Exchange rate must be positive'),
  payment_term_days: z.number().min(0).optional(),
  lead_time_days: z.number().min(0).optional(),
  valid_until: z.string().min(1, 'Valid until date is required'),
  remarks: z.string().optional(),
  total_amount: z.number().optional(),
  lines: z.array(QuotationLineSchema).min(1, 'At least one item is required'),
});

export type QuotationFormData = z.infer<typeof QuotationHeaderSchema>;
export type QuotationLineFormData = z.infer<typeof QuotationLineSchema>;
