import { z } from 'zod';

export const PRLineSchema = z.object({
  item_id: z.string(),
  item_code: z.string(),
  item_name: z.string(),
  description: z.string().optional(),
  qty: z.number().optional(),
  uom: z.string().optional(),
  uom_id: z.string().optional(),
  est_unit_price: z.number().optional(),
  est_amount: z.number().optional(),
  needed_date: z.string().optional(),
  preferred_vendor_id: z.string().optional(),
  remark: z.string().optional(),
  discount: z.number().optional(),
  line_discount_raw: z.string().optional(),
  warehouse_id: z.string().optional(),
  location: z.string().optional(),
// Removed strict line-level validations (UOM, Warehouse, Needed Date) per user request
// to prevent blocking submission when mock data IDs are missing.
}).superRefine(() => {
  // Logic for filtering empty rows is handled in onSubmit and PRFormSchema.superRefine
});

export const PRFormSchema = z.object({
  preparer_name: z.string(),
  pr_no: z.string().trim(),
  pr_date: z.string().trim(),
  need_by_date: z.string().trim().min(1, 'กรุณาระบุวันที่ต้องการใช้'),
  requester_name: z.string().trim().min(1, 'กรุณาระบุชื่อผู้ขอซื้อ'),
  requester_user_id: z.string(),
  cost_center_id: z.string().min(1, 'กรุณาเลือกศูนย์ต้นทุน'),
  project_id: z.string().optional(),
  purpose: z.string().trim().min(1, 'กรุณาระบุวัตถุประสงค์ในการขอซื้อ'),
  pr_base_currency_code: z.string(),
  pr_quote_currency_code: z.string().optional(),
  is_multicurrency: z.boolean(),
  pr_exchange_rate: z.number(),
  pr_exchange_rate_date: z.string().optional(),
  preferred_vendor_id: z.string().optional(),
  vendor_name: z.string().optional(),
  delivery_date: z.string().optional(),
  credit_days: z.number().optional(),
  payment_term_days: z.number().optional(),
  vendor_quote_no: z.string().optional(),
  shipping_method: z.string().trim().min(1, 'กรุณาเลือกวิธีการจัดส่ง'),
  remark: z.string().optional(),
  // 🔧 FIX #4: Lines validated as array — empty row filtering done in onSubmit handler
  lines: z.array(PRLineSchema),
  is_on_hold: z.union([z.boolean(), z.string()]).transform(v => typeof v === 'boolean' ? (v ? 'Y' : 'N') : v),
  cancelflag: z.enum(['Y', 'N']).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']).optional(),
  total_amount: z.number(),
  pr_discount_raw: z.string().optional(),
  pr_tax_code_id: z.string().optional(),
  pr_tax_rate: z.number().optional(),
  branch_id: z.string().optional(),
  warehouse_id: z.string().optional(),
}).superRefine((data, ctx) => {
  // Removed manual cost_center_id validation as it's now handled by .refine in the schema

  // Validate at least 1 active product line (filter out empty rows)
  const activeLines = data.lines.filter(
    (line) => line.item_id !== '' && line.item_id !== undefined && line.item_id !== null
  );
  if (activeLines.length === 0) {
    ctx.addIssue({
      path: ['lines'],
      message: 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ',
      code: z.ZodIssueCode.custom,
    });
  }
});

export type PRFormSchemaType = z.infer<typeof PRFormSchema>;
export type PRLineSchemaType = z.infer<typeof PRLineSchema>;
