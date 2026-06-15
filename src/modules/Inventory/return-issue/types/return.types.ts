/**
 * @file return.types.ts
 * @description TypeScript types สำหรับ Return Issue Stock (รับคืนจากการเบิก)
 * @schemas D7: return_issue_stock_header, D8: return_issue_stock_line
 */

// ====================================================================================
// D7 - HEADER TYPES
// ====================================================================================

/** ข้อมูล Header ของใบรับคืนจากการเบิก (จาก Backend) */
export interface ReturnIssueHeader {
    docu_item_id: string;          // uuid (PK - backend generate)
    docu_item_no?: string | null;  // uuid (FK → doc_link_ic)
    issue_stock_id?: number;       // ID ของเอกสารใบเบิกต้นทาง
    issue_stk_no: string;          // varchar(25) - เลขที่เอกสารใบเบิก (อ้างอิง)
    reissue_stk_no: string;        // varchar(25) - เลขที่เอกสารรับคืนจากการเบิก
    docu_date: string;             // date
    emp_dept_id: string;           // uuid (FK → แผนก)
    job_id: string;                // uuid (FK → job)
    branch_id: string;             // uuid (FK → สาขา)
    save_emp_id: string;           // uuid (PK/FK → emp ผู้บันทึก)
    rece_emp_id: string;           // uuid (PK/FK → emp ผู้รับสินค้าคืน)
    stock_effect_ic: number;       // smallint (0=ไม่มีผล, 1=เพิ่มคลัง, -1=ลดคลัง)
    amnt_total: number;            // numeric(18,4)
    remark?: string;               // varchar(255)
    cancel_flag: string;           // char(1) default 'N'
    cancel_date?: string | null;   // date
    cancel_remark?: string;        // varchar(255)
}

/** ข้อมูล Line ของใบรับคืนจากการเบิก (จาก Backend) */
export interface ReturnIssueLine {
    docu_item_id?: string;         // uuid (FK → D7)
    issue_stock_line_id?: number;  // ID ของรายการใบเบิกต้นทาง
    listno: number;                // smallint
    item_id: string;               // uuid (FK → dropdown สินค้า)
    item_code?: string;            // varchar(25) - auto-fill
    item_name?: string;            // varchar(255) - auto-fill
    uom_id: string;                // uuid (FK → dropdown หน่วย)
    warehouse_id: string;          // uuid (FK → dropdown คลัง)
    warehouse_name?: string;       // varchar(255) - auto-fill
    location_id?: string;          // uuid (FK → dropdown ที่เก็บ)
    location_name?: string;        // varchar(255) - auto-fill
    qty_ic: number;                // numeric(18,3) - จำนวนเบิก
    qty_return_ic: number;         // numeric(18,3) - จำนวนที่คืน
    lot_id?: string;               // uuid (FK → dropdown lot)
    lot_no?: string;               // varchar(255) - auto-fill
    unit_cost: number;             // money
    good_amnt: number;             // money
    standard_buy_price?: number;   // money
    standard_cost?: number;        // money
    stock_flag: number;            // smallint (0=ไม่มีผล, 1=เพิ่มคลัง, -1=ลดคลัง)
    remark?: string;               // varchar(255)
}

// ====================================================================================
// LIST PAGE TYPES
// ====================================================================================

/** ข้อมูลสำหรับแสดงในตาราง List */
export interface ReturnIssueListItem {
    docu_item_id: string;
    reissue_stk_no: string;
    issue_stk_no: string;
    docu_date: string;
    dept_name?: string;
    doc_type_name?: string;
    rece_emp_name?: string;
    amnt_total: number;
    cancel_flag: string;
}

/** Query params สำหรับ List API */
export interface ReturnIssueListParams {
    reissue_stk_no?: string;
    issue_stk_no?: string;
    date_start?: string;
    date_end?: string;
    cancel_flag?: string;
    page?: number;
    limit?: number;
}

// ====================================================================================
// PENDING RETURN ISSUE (ใบเบิกที่ Confirmed แล้ว รอสร้างใบรับคืน)
// ====================================================================================

/** Line ของใบเบิกที่ Confirmed (จาก /return-stock/pending) */
export interface PendingReturnIssueLine {
    issue_stock_line_id: number;
    appvissue_req_line_id: number;
    issue_stock_id: number;
    item_id: number;
    qty: string;
    uom_id: number;
    warehouse_id: number;
    location_id: number;
    lot_id: number;
    lot_balance_id: number;
    unit_cost_price: string;
    goods_amount: string;
    standard_buy_price: string;
    standard_cost_price: string;
    created_at: string;
    updated_at: string;
}

/** ใบเบิกที่ Confirmed แล้ว (จาก /return-stock/pending) */
export interface PendingReturnIssue {
    issue_stock_id: number;
    issue_stock_no: string;
    issue_stock_date: string;
    branch_id: number;
    appv_issue_req_id: number;
    created_by_emp_id: number;
    received_by_emp_id: number;
    doc_link_ic_id: number;
    emp_dept_id: number;
    project_id: number;
    remarks: string;
    doc_type_no: number;
    doc_type_name: string;
    status: string;
    created_at: string;
    updated_at: string;
    issueStockLines: PendingReturnIssueLine[];
}

/** Paginated response จาก /return-stock/pending */
export interface PendingReturnIssueResponse {
    data: PendingReturnIssue[];
    meta: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    };
}

/** Query params สำหรับ Pending Return API */
export interface PendingReturnIssueParams {
    page?: number;
    limit?: number;
    issue_stock_no?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
