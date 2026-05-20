/**
 * @file aq.schema.ts
 * @description Zod schema for Sales Quotation Approval form (AQ)
 */

import { z } from 'zod';
import { zIdSchema } from '../../shared/utils/zod-shared';

// ─────────────────────────────────────────────────────────────────────────────
// Line Schema
// ─────────────────────────────────────────────────────────────────────────────

export const AQLineSchema = z.object({
  sq_line_id: zIdSchema,
  item_id: zIdSchema.default(0),
  item_code: z.string().default(''),
  item_name: z.string().default(''),

  // Original SQ values (readonly display)
  qty: z.coerce.number().default(0),
  uom_id: zIdSchema.default(0),
  uom_name: z.string().default(''),
  unit_price: z.coerce.number().default(0),
  discount_expression: z.string().optional().default('0'),
  discount_amount: z.coerce.number().default(0),
  net_amount: z.coerce.number().default(0),
  price_source: z.coerce.number().optional(),
  price_source_name: z.string().optional().default(''),
  price_level_priority: z.coerce.number().optional(),

  // Approval interaction
  is_approved: z.boolean().default(false),
  approved_qty: z.coerce.number().min(0).default(0),
  approved_net_amount: z.coerce.number().default(0),
  remarks: z.string().optional().default(''),
});

// ─────────────────────────────────────────────────────────────────────────────
// Header Schema
// ─────────────────────────────────────────────────────────────────────────────

export const AQFormSchema = z.object({
  aq_id: zIdSchema.optional(),
  aq_no: z.string().optional().default(''),
  aq_date: z.string().optional().default(''),

  // SQ Reference (readonly)
  sq_id: zIdSchema,
  sq_no: z.string().default(''),
  sq_date: z.string().default(''),

  // Customer (readonly display)
  customer_id: zIdSchema.optional().default(0),
  customer_name: z.string().default(''),
  customer_code: z.string().default(''),

  // Status & Reject
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).default('PENDING'),
  reject_reason: z.string().optional().default(''),

  // Approval identity
  approval_emp_id: zIdSchema.optional(),
  approval_emp_name: z.string().optional().default(''),

  // Currency (readonly clone from SQ)
  isMulticurrency: z.boolean().default(false),
  base_currency_code: z.string().default('THB'),
  base_currency_id: z.coerce.number().default(1),
  quote_currency_code: z.string().default('THB'),
  quote_currency_id: z.coerce.number().default(1),
  exchange_rate: z.coerce.number().default(1),
  exchange_rate_date: z.string().default(''),

  // Amounts (readonly clone from SQ)
  sub_total: z.coerce.number().default(0),
  base_total_amount: z.coerce.number().default(0),
  quote_total_amount: z.coerce.number().default(0),
  tax_code_id: zIdSchema.nullable().optional(),
  tax_code: z.string().optional().default(''), // For display
  tax_rate: z.coerce.number().default(0),
  base_tax_amount: z.coerce.number().default(0),
  quote_tax_amount: z.coerce.number().default(0),
  discount_expression: z.string().optional().default('0'),
  discount_rate: z.coerce.number().default(0),
  base_discount_amount: z.coerce.number().default(0),
  quote_discount_amount: z.coerce.number().default(0),

  // Other SQ readonly fields
  branch_id: zIdSchema.optional().default(0),
  branch_name: z.string().optional().default(''),
  lead_id: z.string().optional().default(''),
  emp_dept_id: zIdSchema.optional().default(0),
  emp_dept_name: z.string().optional().default(''),
  project_id: zIdSchema.optional().default(0),
  project_name: z.string().optional().default(''),
  sale_area_id: zIdSchema.optional().default(0),
  sale_area_name: z.string().optional().default(''),
  emp_sale_id: zIdSchema.optional().default(0),
  emp_sale_name: z.string().optional().default(''),

  valid_until: z.string().optional().default(''),
  payment_term_days: z.coerce.number().default(0),
  onhold: z.string().optional().default('N'),
  remarks: z.string().optional().default(''),

  lines: z.array(AQLineSchema).default([]),
});

export type AQFormData = z.infer<typeof AQFormSchema>;
export type AQLineFormData = z.infer<typeof AQLineSchema>;
