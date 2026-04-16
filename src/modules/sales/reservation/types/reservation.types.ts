/**
 * @file reservation.types.ts
 * @description Type definitions for Sales Reservation module
 */

export interface ReservationLineData {
    id?: string;
    reservation_id?: string;
    item_id: string;
    item_code: string;
    item_name: string;
    qty_reserved: number;
    qty?: number; // Alias for consistency if needed
    warehouse_id: string;
    location_id: string;
    unit_price: number;
    uom_id: string;
    lot_id?: string;
    lot_no?: string;
    reserve_policy: 'AUTO' | 'MANUAL';
    line_discount: number;
    line_discount_input?: string;
    tax_code_id?: string;
    line_total: number;
    note?: string;
}

export interface ReservationFormData {
    reservation_id?: string;
    reservation_no: string;
    reservation_date: string;
    lead_id?: string;
    customer_id: string;
    branch_id: string;
    sq_id?: string; // Reference to Sales Quotation
    currency_code: string;
    isMulticurrency?: boolean;
    base_currency_code?: string;
    quote_currency_code?: string;
    exchange_rate?: number;
    exchange_rate_date?: string;
    ship_days: number;
    status: 'DRAFT' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
    remarks?: string;
    payment_term_days: number;
    sub_total: number;
    discount_amount: number;
    discount_input?: string;
    vat_amount: number;
    total_amount: number;
    onhold: 'Y' | 'N';
    tax_group_id?: string;
    item_id?: string; // Optional header item reference
    emp_area_id?: string;
    emp_dept_id: string;
    job_id: string;
    status_remark?: string;
    ship_date: string;
    lines: ReservationLineData[];
}
