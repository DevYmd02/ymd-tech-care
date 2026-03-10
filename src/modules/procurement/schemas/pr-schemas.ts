import { z } from 'zod';

// ====================================================================================
// STATUS ENUM (Canonical — Single Source of Truth)
// ====================================================================================

/** PR Status Enum — exported for use in mock data, badges, and filter dropdowns */
export const PRStatusEnum = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']);
export type PRStatus = z.infer<typeof PRStatusEnum>;

// ====================================================================================
// SCHEMAS (Single Source of Truth)
// ====================================================================================

export const PRLineSchema = z.object({
  item_id: z.coerce.number().optional(),
  item_code: z.string(),
  item_name: z.string(),
  description: z.string().optional(),
  qty: z.coerce.number().optional(),
  uom: z.string().optional(),
  uom_id: z.coerce.number().optional(),
  est_unit_price: z.coerce.number().optional(),
  est_amount: z.coerce.number().optional(),
  needed_date: z.string().optional(),
  preferred_vendor_id: z.coerce.number().optional(),
  remark: z.string().optional(),
  discount: z.coerce.number().optional(),
  line_discount_raw: z.string().optional(),
  warehouse_id: z.coerce.number().optional(),
  warehouse_code: z.string().optional(),
  location: z.string().optional(),
  _standard_cost: z.number().optional(),
  _item_vendor_id: z.coerce.number().optional(),
  required_receipt_type: z.string().optional(),
});

/** Canonical type for a single PR line item */
export type PRLineFormData = z.infer<typeof PRLineSchema>;

const baseFormSchema = z.object({
  preparer_name: z.string(),
  pr_no: z.string().trim(),
  pr_date: z.string().trim(),
  need_by_date: z.string().trim().min(1, 'กรุณาระบุวันที่ต้องการใช้'),
  requester_name: z.string().trim().min(1, 'กรุณาระบุชื่อผู้ขอซื้อ'),
  requester_user_id: z.coerce.number(),

  // ═══════════════════════════════════════════════════════════════════════
  // UI-ONLY FIELDS — kept for form display but NEVER sent to backend.
  // Backend DTO rejects cost_center_id, purpose, department_id with 400.
  // Made optional so they don't block form submission.
  // ═══════════════════════════════════════════════════════════════════════
  cost_center_id: z.coerce.number().optional(),
  purpose: z.string().trim().optional(),

  project_id: z.coerce.number().optional(),
  pr_base_currency_code: z.string(),
  pr_quote_currency_code: z.string().optional(),
  isMulticurrency: z.boolean(),
  pr_exchange_rate: z.coerce.number(),
  pr_exchange_rate_date: z.string().optional(),
  preferred_vendor_id: z.coerce.number().optional(),
  vendor_name: z.string().optional(),
  delivery_date: z.string().optional(),
  credit_days: z.coerce.number().optional(),
  payment_term_days: z.coerce.number().optional(),
  vendor_quote_no: z.string().optional(),
  shipping_method: z.string().trim(),
  remark: z.string().optional(),
  lines: z.array(PRLineSchema),
  is_on_hold: z.union([z.string(), z.boolean()]),
  cancelflag: z.enum(['Y', 'N']).optional(),
  status: PRStatusEnum.optional(),
  total_amount: z.coerce.number(),
  pr_discount_raw: z.string().optional(),
  pr_tax_code_id: z.coerce.number().optional(),
  pr_tax_rate: z.coerce.number().optional(),
  branch_id: z.coerce.number().optional(),
  warehouse_id: z.coerce.number().optional(),
  pr_sub_total: z.number().optional(),
  pr_discount_amount: z.number().optional(),
  pr_tax_amount: z.number().optional(),
});

export const getInitialLines = () => Array(5).fill(null).map(() => createEmptyPRLine());

/** Refined schema for runtime validation — zero-assertion natural inference */
export const PRFormSchema = baseFormSchema.superRefine((data, ctx) => {
  const isDraft = data.is_on_hold === 'Y';
  
  const activeLines = (data.lines || []).filter((line: PRLineFormData) => {
    const isItemIdEmpty = !line.item_id || line.item_id === 0;
    const isItemCodeEmpty = !line.item_code || line.item_code === '';
    const isQtyZero = !line.qty || Number(line.qty) === 0;
    const isPriceZero = !line.est_unit_price || Number(line.est_unit_price) === 0;
    const isDescriptionEmpty = !line.description || line.description?.trim() === '';
    
    return !(isItemIdEmpty && isItemCodeEmpty && isQtyZero && isPriceZero && isDescriptionEmpty);
  });

  if (activeLines.length === 0) {
    ctx.addIssue({
      path: ['lines'],
      message: 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ',
      code: z.ZodIssueCode.custom,
    });
  }

  activeLines.forEach((line: PRLineFormData, index: number) => {
    if (!line.item_id || line.item_id === 0) {
      ctx.addIssue({
        path: ['lines', index, 'item_id'],
        message: 'กรุณาเลือกสินค้า',
        code: z.ZodIssueCode.custom,
      });
    }
  });

  const validationTotal = activeLines.reduce((sum: number, line: PRLineFormData) => {
    const qty = Number(line.qty) || 0;
    const price = Number(line.est_unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  if (!isDraft && validationTotal <= 0) {
    ctx.addIssue({
      path: ['total_amount'],
      message: 'มูลค่ารวมต้องมากกว่า 0 บาท เพื่อส่งอนุมัติ',
      code: z.ZodIssueCode.custom,
    });
  }

  // Field validation for Cost Center and Purpose (skip if Draft)
  if (!isDraft) {
    if (!data.cost_center_id || String(data.cost_center_id).trim() === '') {
      ctx.addIssue({
        path: ['cost_center_id'],
        message: 'กรุณาเลือกศูนย์ต้นทุน',
        code: z.ZodIssueCode.custom,
      });
    }
    if (!data.purpose || data.purpose.trim() === '') {
      ctx.addIssue({
        path: ['purpose'],
        message: 'กรุณาระบุวัตถุประสงค์ในการขอซื้อ',
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

/** Canonical type for the entire PR form — inferred from refined schema for 100% sync */
export type PRFormData = z.infer<typeof PRFormSchema>;

// ====================================================================================
// DEFAULT VALUES (Strictly Aligned with PRFormData)
// ====================================================================================

export const createEmptyPRLine = (): PRLineFormData => ({
  item_id: undefined,
  item_code: '',
  item_name: '',
  description: '',
  qty: 0,
  uom: '',
  uom_id: undefined,
  est_unit_price: 0,
  est_amount: 0,
  needed_date: new Date().toISOString().split('T')[0],
  preferred_vendor_id: undefined,
  remark: '',
  discount: 0,
  line_discount_raw: '',
  warehouse_id: undefined,
  warehouse_code: '',
  location: '',
});

export const getPRDefaultFormValues = (user?: { id?: string | number; username?: string; employee?: { employee_fullname?: string } } | null): PRFormData => {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  return {
    preparer_name: user?.employee?.employee_fullname || user?.username || '',
    requester_name: user?.employee?.employee_fullname || user?.username || '',
    pr_no: '',
    pr_date: today,
    need_by_date: '',
    requester_user_id: user?.id ? Number(user.id) : 1,
    cost_center_id: undefined,
    project_id: undefined,
    purpose: '',
    pr_base_currency_code: 'THB',
    pr_quote_currency_code: 'THB',
    isMulticurrency: false,
    pr_exchange_rate: 1,
    pr_exchange_rate_date: today,
    preferred_vendor_id: undefined,
    vendor_name: '',
    delivery_date: nextWeekStr,
    credit_days: 30,
    payment_term_days: 0,
    vendor_quote_no: '',
    shipping_method: '',
    remark: '',
    lines: Array(5).fill(null).map(() => createEmptyPRLine()),
    is_on_hold: 'N',
    cancelflag: 'N',
    status: 'DRAFT',
    total_amount: 0,
    pr_discount_raw: '',
    pr_tax_code_id: undefined,
    pr_tax_rate: 7,
    branch_id: undefined,
    warehouse_id: undefined,
    pr_sub_total: 0,
    pr_discount_amount: 0,
    pr_tax_amount: 0,
  };
};
