/**
 * @file quotation.types.ts
 * @description Type definitions for Sales Quotation module based on DB Schema D1 & D2
 */

export interface QuotationLineData {
    sq_line_id?: string; // UUID (PK)
    sq_id?: string;      // UUID (FK)
    item_id: string;     // UUID (FK)
    item_code?: string;  // Display only (from item_master)
    item_name?: string;  // Display only (from item_master)
    qty: number;         // Numeric(18,3)
    uom_id: string | number; // UUID or Int (FK)
    unit_price: number;  // Numeric(18,2)
    line_discount_input?: string; // Raw input (e.g. "5%" or "100")
    line_discount: number; // Numeric(18,2)
    tax_code_id?: string; // UUID (FK)
    line_total: number;   // Numeric(18,2)
    note?: string;        // Text
}

export interface QuotationFormData {
    sq_id?: string;       // UUID (PK)
    sq_no: string;        // Varchar(30)
    sq_date: string;      // Date
    lead_id?: string;     // UUID (FK)
    customer_id: string;  // UUID (FK)
    branch_id?: string;   // UUID (FK)
    currency_code: string; // Varchar(3)
    isMulticurrency?: boolean;
    base_currency_code?: string;
    quote_currency_code?: string;
    exchange_rate?: number;
    exchange_rate_date?: string;
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'; // Varchar(20)
    valid_until?: string; // Date
    sub_total: number;    // Numeric(18,2)
    discount_input?: string; // Raw input (e.g. "5%" or "100")
    discount_amount: number; // Numeric(18,2)
    vat_amount: number;     // Numeric(18,2)
    total_amount: number;   // Numeric(18,2)
    remarks?: string;       // Text
    payment_term_days: number; // Int
    onhold: 'Y' | 'N';      // Char(1)
    tax_group_id?: string;  // UUID (FK)
    item_id?: string;       // UUID (FK) - Item/Service Class
    emp_area_id?: string;   // UUID (FK) - Salesperson
    emp_dept_id?: string;   // UUID (FK) - Department
    job_id?: string;        // UUID (FK) - Job
    sq_status?: string;     // Varchar(255)
    status_remark?: string; // Varchar(255)
    ship_date?: string;     // Datetime(8)
    lines: QuotationLineData[];
}

export interface QuotationHeader {
    id: number;
    sq_no: string;
    date: string;
    customer_name: string;
    customer_code: string;
    total_amount: number;
    currency: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
    expiry_date: string;
    workflow_status: string;
}
