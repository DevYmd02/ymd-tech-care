/**
 * @file sales-order.types.ts
 * @description Type definitions for Sales Order module
 * @tables sale_order_header (D9), sale_order_line (D10)
 */

// ============================================================
// sale_order_line (D10)
// ============================================================
export interface SalesOrderLineData {
    so_line_id?: string;                              // PK (uuid)
    so_id?: string;                                   // FK→sale_order_header
    item_id: string;                                  // FK→item_master
    item_code: string;                                // display only
    item_name: string;                                // display only
    qty_ordered: number;                              // numeric(18,3)
    uom_id: string;                                   // FK→uom
    warehouse_id: string;                             // FK→warehouse
    location_id: string;                              // (new PK field)
    unit_price: number;                               // numeric(18,2)
    line_discount: number;                            // numeric(18,2) ส่วนลดบรรทัด
    line_discount_input?: string;                     // UI helper (e.g. "10%")
    tax_code_id?: string;                             // FK→tax_code (nullable)
    line_total: number;                               // numeric(18,2)
    lot_id?: string;                                  // FK→item_lot (nullable) [NEW]
    lot_no?: string;                                  // display/input helper
    note?: string;                                    // text (nullable)
}

// ============================================================
// sale_order_header (D9)
// ============================================================
export interface SalesOrderFormData {
    so_id?: string;                                   // PK (uuid)
    so_no: string;                                    // UNIQUE varchar(30)
    so_date: string;                                  // date
    customer_id: string;                              // FK→customer
    branch_id: string;                                // FK→org_branch
    reservation_id?: string;                          // FK→sale_reservation_header (nullable)
    currency_code: string;                            // FK→currency default 'THB'
    payment_term_days: number;                        // int default 0
    onhold: 'Y' | 'N';                               // char(1) default 'N'
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED';
    sub_total: number;                                // numeric(18,2)
    discount_amount: number;                          // numeric(18,2)
    discount_input?: string;                          // UI helper
    vat_amount: number;                               // numeric(18,2)
    total_amount: number;                             // numeric(18,2)
    remarks?: string;                                 // text (nullable)
    ship_days?: number;                               // smallint(2) ส่งของภายใน (วัน)
    tax_group_id?: string;                            // FK→tax_group (nullable)
    item_id?: string;                                 // FK→item (nullable)
    emp_area_id?: string;                             // ID เขตการขาย (nullable)
    emp_dept_id?: string;                             // ID แผนก
    job_id?: string;                                  // ID Job
    status_remark?: string;                           // เหตุผลการ cancel
    ship_date?: string;                               // datetime(8) วันที่กำหนดส่ง
    cust_po_no?: string;                              // varchar(25) เลขที่ PO ของลูกค้า
    cust_po_date?: string;                            // datetime(8) วันที่ PO ลูกค้า
    // Multicurrency (UI helper fields)
    isMulticurrency?: boolean;
    base_currency_code?: string;
    quote_currency_code?: string;
    exchange_rate?: number;
    exchange_rate_date?: string;
    lines: SalesOrderLineData[];
}
