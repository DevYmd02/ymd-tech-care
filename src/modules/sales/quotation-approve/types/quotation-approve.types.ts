/**
 * @file quotation-approve.types.ts
 * @description Type definitions for Sales Quotation Approval module (SQ → AQ)
 * @pattern Mirrors PR → AV approval pattern but for Sales domain
 */

// ─────────────────────────────────────────────────────────────────────────────
// AQ Header — sale_quotation_approval_header
// ─────────────────────────────────────────────────────────────────────────────

export interface AQHeader {
  aq_id: number;
  aq_no: string;
  aq_date: string;
  sq_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  remarks?: string;
  created_at?: string;
  updated_at?: string;

  // Approval Metadata
  approval_emp_id: number;
  approval_emp_name?: string;

  // Multicurrency (from DB schema)
  base_currency_code?: string;
  base_currency_id?: number;
  quote_currency_code?: string;
  quote_currency_id?: number;
  exchange_rate?: number;
  exchange_rate_date?: string;

  // Amounts (dual currency)
  base_total_amount: number;
  quote_total_amount: number;

  // Tax
  tax_code_id?: number;
  tax_rate?: number;
  base_tax_amount?: number;
  quote_tax_amount?: number;

  // Discount
  discount_expression?: string;
  discount_rate?: number;
  base_discount_amount?: number;
  quote_discount_amount?: number;

  // Joined SQ data (snapshot or joined)
  sq?: {
    sq_no: string;
    sq_date: string;
    customer_name?: string;
    customer_code?: string;
    status?: string;
    sale_area_id?: number;
    emp_sale_id?: number;
  };

  // Flattened convenience fields
  sq_no?: string;
  sq_date?: string;
  customer_name?: string;
  customer_code?: string;
  sale_area_id?: number;
  sale_area_name?: string;
  emp_sale_id?: number;
  emp_sale_name?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AQ Line — sale_quotation_approval_line
// ─────────────────────────────────────────────────────────────────────────────

export interface AQLine {
  aq_line_id: number;
  aq_id: number;
  sq_line_id: number;
  approved_qty: number;
  qty: number;             // Clone of original SQ qty
  uom_id: number;
  unit_price: number;
  discount_expression?: string;
  discount_amount: number;
  discount_rate?: number;
  net_amount: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SQ data cloned into AQ form
// ─────────────────────────────────────────────────────────────────────────────

export interface SQForApproval {
  sq_id: number;
  sq_no: string;
  sq_date: string;
  customer_id: number;
  customer_name?: string;
  customer_code?: string;
  status: string;

  // Currency snapshot
  base_currency_code?: string;
  base_currency_id?: number;
  quote_currency_code?: string;
  quote_currency_id?: number;
  exchange_rate?: number;
  exchange_rate_date?: string;

  // Amounts
  sub_total?: number;
  total_amount?: number;
  base_total_amount?: number;
  quote_total_amount?: number;
  vat_amount?: number;
  base_tax_amount?: number;
  quote_tax_amount?: number;
  tax_code_id?: number;
  tax_rate?: number;
  discount_expression?: string;
  discount_amount?: number;
  base_discount_amount?: number;
  quote_discount_amount?: number;

  // Other
  remarks?: string;
  valid_until?: string;
  payment_term_days?: number;
  sale_area_id?: number;
  emp_area_id?: number; // Legacy support
  emp_sale_id?: number;

  lines: SQLineForApproval[];
  saleQuotationLines?: SQLineForApproval[];

  [key: string]: unknown;
}

export interface SQLineForApproval {
  sq_line_id: number | string;
  item_id: number;
  item_code?: string;
  item_name?: string;
  qty: number;
  uom_id: number;
  uom_name?: string;
  unit_price: number;
  discount_expression?: string;
  discount_amount?: number;
  line_discount?: number;
  net_amount?: number;
  line_total?: number;
  note?: string;
  remarks?: string;
  tax_code_id?: number | null;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// AQ Form Line (used in form state)
// ─────────────────────────────────────────────────────────────────────────────

export interface AQLineFormData {
  sq_line_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom_id: number;
  uom_name: string;
  unit_price: number;
  discount_expression?: string;
  discount_amount: number;
  net_amount: number;
  is_approved: boolean;
  approved_qty: number;
  approved_net_amount: number;
  remarks?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Payload for POST /sq-approval
// ─────────────────────────────────────────────────────────────────────────────

export interface ApproveQuotationPayload {
  sq_id: number;
  branch_id?: number;
  aq_date: string;
  status: 'APPROVED' | 'REJECTED';
  remarks: string;
  approval_emp_id: number;
  approval_emp_name: string;

  base_currency_code: string;
  quote_currency_code: string;
  exchange_rate: number;
  exchange_rate_date: string;

  tax_code_id?: number;
  discount_expression?: string;

  aq_lines: ApproveQuotationLine[];
  sale_area_id?: number;
  emp_sale_id?: number;
}

export interface ApproveQuotationLine {
  sq_line_id: number;
  item_id?: number;
  qty?: number;
  uom_id?: number;
  approved_qty: number;
  remarks?: string;
  unit_price?: number;
  discount_expression?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// AQ List Item (merged display in list page)
// ─────────────────────────────────────────────────────────────────────────────

export interface AQListItem {
  aq_id?: number;
  aq_no?: string;
  aq_date?: string;
  status: string;
  approval_emp_name?: string;
  base_total_amount?: number;
  quote_total_amount?: number;
  sq_id?: number;
  sq_no?: string;
  sq_date?: string;
  customer_name?: string;
  customer_code?: string;
  row_key?: string;
  [key: string]: unknown;
}
