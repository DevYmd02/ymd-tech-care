import { z } from 'zod';

export const PRLineSchema = z.object({
  item_id: z.string(),
  item_code: z.string(),
  item_name: z.string(),
  item_description: z.string().optional(),
  quantity: z.number(),
  uom: z.string(),
  uom_id: z.union([z.string(), z.number()]).optional(),
  est_unit_price: z.number(),
  est_amount: z.number(),
  needed_date: z.string(),
  preferred_vendor_id: z.string().optional(),
  remark: z.string().optional(),
});

export const PRFormSchema = z.object({
  pr_no: z.string(),
  request_date: z.string(),
  required_date: z.string(),
  requester_name: z.string().optional(),
  cost_center_id: z.string().min(1, 'Please select cost center'),
  project_id: z.string().optional(),
  purpose: z.string().min(1, 'Please enter purpose'),
  currency_id: z.string(),
  is_multicurrency: z.boolean(),
  exchange_rate: z.number(),
  rate_date: z.string().optional(),
  currency_type_id: z.string().optional(),
  exchange_round: z.number().optional(),
  allow_adjust: z.number().optional(),
  preferred_vendor_id: z.string().optional(),
  vendor_name: z.string().optional(),
  delivery_date: z.string().optional(),
  credit_days: z.number().optional(),
  vendor_quote_no: z.string().optional(),
  shipping_method: z.string().optional(),
  remarks: z.string().optional(),
  lines: z.array(PRLineSchema),
  is_on_hold: z.union([z.boolean(), z.string()]),
  cancelflag: z.enum(['Y', 'N']).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  total_amount: z.number(),
});

export type PRFormSchemaType = z.infer<typeof PRFormSchema>;
export type PRLineSchemaType = z.infer<typeof PRLineSchema>;
