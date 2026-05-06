/**
 * @file sales-order-approval.types.ts
 * @description Type definitions for Sales Order Approval module (SO → AO)
 * @pattern Mirrors SQ → AQ approval pattern but for Sales Order domain
 */

// ─────────────────────────────────────────────────────────────────────────────
// AO Header — sale_order_approval_header
// ─────────────────────────────────────────────────────────────────────────────

export interface AOHeader {
  ao_id: number;
  ao_no: string;
  ao_date: string;
  so_id: string | number; // SO might use UUID or number depending on backend schema, we'll allow both for now
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  remarks?: string;
  created_at?: string;
  updated_at?: string;

  // Approval Metadata
  approval_emp_id: number | string;
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
  tax_code_id?: number | string;
  tax_rate?: number;
  base_tax_amount?: number;
  quote_tax_amount?: number;

  // Discount
  discount_expression?: string;
  discount_rate?: number;
  base_discount_amount?: number;
  quote_discount_amount?: number;

  // Joined SO data
  so?: {
    so_no: string;
    so_date: string;
    customer_name?: string;
    customer_code?: string;
    status?: string;
    emp_sale_id?: string | number;
  };

  // Flattened convenience fields
  so_no?: string;
  so_date?: string;
  customer_name?: string;
  customer_code?: string;
  emp_sale_id?: string | number;
  emp_sale_name?: string;

  // Lines
  ao_lines?: AOLine[];
  lines?: AOLine[];
}

export interface AODetail extends AOHeader {
  ao_lines: AOLine[];
}

// ─────────────────────────────────────────────────────────────────────────────
// AO Line — sale_order_approval_line
// ─────────────────────────────────────────────────────────────────────────────

export interface AOLine {
  ao_line_id: number;
  ao_id: number;
  so_line_id: string | number;
  approved_qty: number;
  qty_ordered: number;             // Clone of original SO qty_ordered
  uom_id: string | number;
  unit_price: number;
  discount_expression?: string;
  discount_amount: number;
  discount_rate?: number;
  net_amount: number;
  warehouse_id?: string | number;
  warehouse_name?: string;
  location_id?: string | number;
  location_name?: string;
  lot_id?: string | number;
  lot_no?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SO data cloned into AO form
// ─────────────────────────────────────────────────────────────────────────────

export interface SOForApproval {
  so_id: string | number;
  so_no: string;
  so_date: string;
  customer_id: string | number;
  customer_name?: string;
  customer_code?: string;
  status: string;
  branch_id?: string | number;

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
  tax_code_id?: number | string;
  tax_rate?: number;
  discount_amount?: number;
  base_discount_amount?: number;
  quote_discount_amount?: number;
  discount_input?: string;

  // Other
  remarks?: string;
  payment_term_days?: number;
  emp_sale_id?: string | number;
  emp_sale_name?: string;
  cust_po_no?: string;
  reservation_no?: string;
  ship_days?: number;
  ship_date?: string;
  emp_dept_id?: string | number;
  emp_dept_name?: string;
  emp_area_id?: string | number;
  job_id?: string | number;
  onhold?: 'Y' | 'N';

  lines: SOLineForApproval[];
  saleOrderLines?: SOLineForApproval[];

  [key: string]: unknown;
}

export interface SOLineForApproval {
  so_line_id: string | number;
  item_id: string | number;
  item_code?: string;
  item_name?: string;
  qty_ordered: number;
  uom_id: string | number;
  uom_name?: string;
  unit_price: number;
  line_discount_input?: string;
  line_discount?: number;
  line_total?: number;
  net_amount?: number;
  note?: string;
  remarks?: string;
  tax_code_id?: number | string | null;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// AO Form Line (used in form state)
// ─────────────────────────────────────────────────────────────────────────────

export interface AOLineFormData {
  so_line_id: string | number;
  item_id: string | number;
  item_code: string;
  item_name: string;
  qty_ordered: number;
  uom_id: string | number;
  uom_name: string;
  unit_price: number;
  discount_expression?: string;
  discount_amount: number;
  net_amount: number;
  is_approved: boolean;
  approved_qty: number;
  approved_net_amount: number;
  warehouse_id?: string | number;
  warehouse_name?: string;
  location_id?: string | number;
  location_name?: string;
  lot_id?: string | number;
  lot_no?: string;
  remarks?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Payload for POST /so-approval
// ─────────────────────────────────────────────────────────────────────────────

export interface ApproveSalesOrderPayload {
  so_id: number;
  customer_id: number;
  branch_id?: number;
  status: 'APPROVED' | 'REJECTED';
  status_remark: string;
  remarks: string;
  onhold: string;
  sale_area_id: number;
  emp_dept_id: number;
  project_id: number;
  approval_emp_id: number;
  approval_emp_name: string;

  base_currency_code?: string;
  quote_currency_code?: string;
  exchange_rate?: number;
  exchange_rate_date?: string;

  tax_code_id?: number;
  discount_expression?: string;

  CreateSaleOrderApprovalLineDtos: ApproveSalesOrderLine[];
  emp_sale_id?: number;
}

export interface ApproveSalesOrderLine {
  so_line_id: number;
  item_id?: number;
  qty?: number;
  uom_id?: number;
  approved_qty: number;
  remarks?: string;
  unit_price?: number;
  discount_expression?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// AO List Item (merged display in list page)
// ─────────────────────────────────────────────────────────────────────────────

export interface AOListItem {
  ao_id?: number;
  ao_no?: string;
  ao_date?: string;
  status: string;
  approval_emp_name?: string;
  base_total_amount?: number;
  quote_total_amount?: number;
  total_amount?: number;
  so_id?: string | number;
  so_no?: string;
  so_date?: string;
  customer_name?: string;
  customer_code?: string;
  row_key?: string;
  [key: string]: unknown;
}
