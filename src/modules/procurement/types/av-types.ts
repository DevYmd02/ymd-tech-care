export interface ApprovalHeader {
  approval_id: number | string;
  approval_no: string;
  approval_date: string;
  need_by_date?: string;
  status: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  approval_emp_id: number;
  approval_emp_name: string;
  pr_id: number;
  base_currency_code?: string;
  quote_currency_code?: string;
  exchange_rate?: string | number;
  exchange_rate_date?: string;
  base_total_amount?: string | number;
  quote_total_amount?: string | number;
  tax_code_id?: number;
  tax_rate?: string | number;
  base_tax_amount?: string | number;
  quote_tax_amount?: string | number;
  discount_expression?: string;
  base_discount_amount?: string | number;
  quote_discount_amount?: string | number;
  pr?: {
    pr_no: string;
  };
  pr_no?: string; // Flattened PR No
  id?: number;    // Alias for approval_id
}

export interface ApprovalLine {
  id: number;
  approval_id: number;
  pr_line_id: number;
  approved_qty: string | number;
  remarks?: string;
  approval_date: string;
}

export interface ApprovalDetail extends ApprovalHeader {
  pr_approval_lines?: ApprovalLine[];
  prApprovalLines?: ApprovalLine[];
}

export interface ApprovalListResponse {
  data: ApprovalHeader[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApproveExpensePayload {
  pr_id: number;
  status: 'APPROVED' | 'PARTIAL' | 'REJECTED';
  base_currency_code?: string;
  quote_currency_code?: string;
  exchange_rate?: number;
  exchange_rate_date?: string;
  tax_code_id?: number;
  discount_expression?: string;
  remarks?: string;
  approval_emp_id: number;
  approval_emp_name: string;
  approval_date: string;
  need_by_date?: string;
  base_currency_id?: number;
  quote_currency_id?: number;
  pr_approval_lines: Array<{
    pr_line_id: number;
    approved_qty: number;
    remarks: string;
    approval_date: string;
  }>;
}
