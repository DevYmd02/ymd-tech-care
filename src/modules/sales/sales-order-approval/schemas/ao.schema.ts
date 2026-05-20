/**
 * @file ao.schema.ts
 * @description Zod schema for Sales Order Approval form (AO)
 */

import { z } from 'zod';
import { zIdSchema } from '../../shared/utils/zod-shared';

// ─────────────────────────────────────────────────────────────────────────────
// Line Schema
// ─────────────────────────────────────────────────────────────────────────────

export const AOLineSchema = z.object({
  so_line_id: zIdSchema,
  item_id: zIdSchema.default(''),
  item_code: z.string().default(''),
  item_name: z.string().default(''),

  // Original SO values (readonly display)
  qty_ordered: z.coerce.number().default(0),
  uom_id: zIdSchema.default(''),
  uom_name: z.string().default(''),
  unit_price: z.coerce.number().default(0),
  discount_expression: z.string().optional().default('0'),
  discount_amount: z.coerce.number().default(0),
  net_amount: z.coerce.number().default(0),
  price_source: z.coerce.number().optional().nullable(),
  price_source_name: z.string().optional().nullable(),
  price_level_priority: z.coerce.number().optional().nullable(),

  // Inventory info (Read-only reference)
  warehouse_id: zIdSchema.optional().default(''),
  warehouse_name: z.string().optional().default(''),
  location_id: zIdSchema.optional().default(''),
  location_name: z.string().optional().default(''),
  lot_id: zIdSchema.optional().default(''),
  lot_no: z.string().optional().default(''),

  // Approval interaction
  is_approved: z.boolean().default(false),
  approved_qty: z.coerce.number().min(0).default(0),
  approved_net_amount: z.coerce.number().default(0),
  remarks: z.string().optional().default(''),
});

// ─────────────────────────────────────────────────────────────────────────────
// Header Schema
// ─────────────────────────────────────────────────────────────────────────────

export const AOFormSchema = z.object({
  ao_id: zIdSchema.optional(),
  ao_no: z.string().optional().default(''),
  ao_date: z.string().optional().default(''),

  // SO Reference (readonly)
  so_id: zIdSchema,
  so_no: z.string().default(''),
  so_date: z.string().default(''),

  // Customer (readonly display)
  customer_id: zIdSchema.optional().default(''),
  customer_name: z.string().default(''),
  customer_code: z.string().default(''),

  // Status & Reject
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).default('PENDING'),
  reject_reason: z.string().optional().default(''),

  // Approval identity
  approval_emp_id: zIdSchema.optional(),
  approval_emp_name: z.string().optional().default(''),

  // Currency (readonly clone from SO)
  isMulticurrency: z.boolean().default(false),
  base_currency_code: z.string().default('THB'),
  base_currency_id: z.coerce.number().default(1),
  quote_currency_code: z.string().default('THB'),
  quote_currency_id: z.coerce.number().default(1),
  exchange_rate: z.coerce.number().default(1),
  exchange_rate_date: z.string().default(''),

  // Amounts (readonly clone from SO)
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

  // Other SO readonly fields
  branch_id: zIdSchema.optional().default(''),
  branch_name: z.string().optional().default(''),
  emp_sale_id: zIdSchema.optional().default(''),
  emp_sale_name: z.string().optional().default(''),

  payment_term_days: z.coerce.number().default(0),
  remarks: z.string().optional().default(''),

  reservation_id: zIdSchema.optional().default(''),
  reservation_no: z.string().optional().default(''),
  ship_days: z.coerce.number().optional().default(0),
  ship_date: z.string().optional().default(''),
  emp_dept_id: zIdSchema.optional().default(''),
  emp_dept_name: z.string().optional().default(''),
  emp_area_id: zIdSchema.optional().default(''),
  emp_area_name: z.string().optional().default(''),
  job_id: zIdSchema.optional().default(''),
  job_name: z.string().optional().default(''),
  onhold: z.enum(['Y', 'N']).default('N'),

  lines: z.array(AOLineSchema).default([]),
});

export type AOFormData = z.infer<typeof AOFormSchema>;
export type AOLineFormData = z.infer<typeof AOLineSchema>;
