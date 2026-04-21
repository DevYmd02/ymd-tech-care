/**
 * @file quotation.types.ts
 * @description Type definitions for Sales Quotation module
 */

export interface QuotationLineData {
    sq_line_id?: string | number;
    sq_id?: string | number;
    item_id: string | number;
    item_code?: string;
    item_name?: string;
    qty: number;
    uom_id: string | number;
    unit_price: number;
    line_discount_input?: string;
    discount_expression?: string; // Some APIs use this name
    line_discount: number;
    tax_code_id?: number | string | null;
    line_total: number;
    note?: string;
    // Data from Pricing Engine
    price_source?: number;
    price_source_name?: string;
}

export interface RawQuotationLine {
    sq_line_id?: string | number;
    sq_id?: string | number;
    item_id?: string | number;
    item_code?: string;
    item_name?: string;
    qty?: number | string;
    uom_id?: string | number;
    unit_price?: number | string;
    line_discount?: number | string;
    line_discount_input?: string;
    discount_expression?: string;
    line_total?: number | string;
    note?: string;
    tax_code_id?: number | string | null;
    // Price sources variants from backend
    source?: number | string;
    sourceName?: string;
    source_name?: string;
    price_source?: number | string;
    price_source_name?: string;
}

export interface RawQuotationData {
    sq_id?: string | number;
    sq_no?: string;
    sq_date?: string;
    customer_id?: string | number;
    currency_code?: string;
    status?: string;
    sub_total?: number | string;
    discount_amount?: number | string;
    vat_amount?: number | string;
    total_amount?: number | string;
    payment_term_days?: number | string;
    onhold?: string;
    remarks?: string;
    tax_code_id?: number | string | null;
    item_id?: string | number | null;
    sale_area_id?: string | number | null;
    emp_sale_id?: string | number | null;
    emp_dept_id?: string | number | null;
    project_id?: string | number | null;
    sq_status?: string;
    status_remark?: string;
    valid_until?: string;
    workflow_status?: string;
    lines?: RawQuotationLine[];
    saleQuotationLines?: RawQuotationLine[];
}

export interface QuotationFormData {
    sq_id?: string | number;
    sq_no: string;
    sq_date: string;
    lead_id?: string | number | null;
    customer_id: string | number;
    branch_id?: string | number | null;
    currency_code: string;
    isMulticurrency?: boolean;
    base_currency_code?: string;
    quote_currency_code?: string;
    exchange_rate?: number;
    exchange_rate_date?: string;
    status: string;
    valid_until?: string;
    sub_total: number;
    discount_input?: string;
    discount_expression?: string; // Header discount input
    discount_amount: number;
    vat_amount: number;
    total_amount: number;
    remarks?: string;
    payment_term_days: number;
    onhold: 'Y' | 'N' | string;
    tax_code_id?: number | string | null;
    item_id?: string | number | null;
    sale_area_id?: string | number | null;
    emp_sale_id?: string | number | null;
    emp_dept_id?: string | number | null;
    project_id?: string | number | null;
    job_id?: string | number | null;
    sq_status?: string;
    status_remark?: string;
    lines: QuotationLineData[];
    saleQuotationLines?: QuotationLineData[];
}

export interface QuotationHeader {
    id: number | string;
    sq_id: number | string;
    sq_no: string;
    date: string;
    customer_id: number | string;
    customer_name: string;
    customer_code: string;
    total_amount: number;
    currency: string;
    status: string;
    expiry_date: string;
    workflow_status: string;
    sq_status?: string;
    branch_id?: number | null;
    lead_id?: number | string | null;
    sale_area_id?: number | null;
    emp_sale_id?: number | null;
    emp_dept_id?: number | null;
    project_id?: number | null;
    // Data-Reuse property
    lines?: QuotationLineData[];
    rawData?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface QuotationListItem {
    sq_id: number | string;
    sq_no: string;
    sq_date: string;
    customer_id: number | string;
    customer_name?: string;
    customer_name_th?: string;
    customer_code?: string;
    quote_total_amount: string | number;
    quote_currency_code?: string;
    status: string;
    valid_until?: string;
    sq_status?: string;
    branch_id?: number | string | null;
    lead_id?: number | string | null;
    [key: string]: unknown;
}
