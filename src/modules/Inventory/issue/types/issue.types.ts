/**
 * @file issue.types.ts
 * @description TypeScript types สำหรับ Stock Issue (ใบเบิก)
 * @schemas D5: issue_stock_header, D6: issue_stock_line
 */

// ====================================================================================
// D5 - HEADER TYPES
// ====================================================================================

/** ข้อมูล Header ของใบเบิก (จาก Backend) */
export interface IssueStockHeader {
    docu_item_id: string;          // uuid (PK - backend generate)
    docu_item_no?: string | null;  // uuid (FK → doc_link_ic)
    appvissue_req_no: string;      // varchar(25) - เลขที่เอกสารอนุมัติ (อ้างอิง)
    issue_stk_no: string;          // varchar(25) - เลขที่เอกสารใบเบิก
    docu_date: string;             // date
    emp_dept_id: string;           // uuid (FK → แผนก)
    job_id: string;                // uuid (FK → job)
    branch_id: string;             // uuid (FK → สาขา)
    save_emp_id: string;           // uuid (PK/FK → emp ผู้บันทึก)
    rece_emp_id: string;           // uuid (PK/FK → emp ผู้รับสินค้า)
    stock_effect_ic: number;       // smallint (-1=ลด, 0=ไม่มีผล, 1=เพิ่ม)
    amnt_total: number;            // numeric(18,4)
    remark?: string;               // varchar(255)
    cancel_flag: string;           // char(1) default 'N'
    cancel_date?: string | null;   // date
    cancel_remark?: string;        // varchar(255)
}

/** ข้อมูล Line ของใบเบิก (จาก Backend) */
export interface IssueStockLine {
    docu_item_id?: string;         // uuid (FK → D5)
    listno: number;                // smallint
    item_id: string;               // uuid (FK → dropdown สินค้า)
    item_code?: string;            // varchar(25) - auto-fill
    item_name?: string;            // varchar(255) - auto-fill
    uom_id: string;                // uuid (FK → dropdown หน่วย)
    warehouse_id: string;          // uuid (FK → dropdown คลัง)
    warehouse_name?: string;       // varchar(255) - auto-fill
    location_id?: string;          // uuid (FK → dropdown ที่เก็บ)
    location_name?: string;        // varchar(255) - auto-fill
    lot_id?: string;               // uuid (FK → dropdown lot)
    lot_no?: string;               // varchar(255) - auto-fill
    qty_ic: number;                // numeric(18,3)
    unit_cost: number;             // money
    good_amnt: number;             // money
    standard_buy_price?: number;   // money
    standard_cost?: number;        // money
    stock_flag: number;            // smallint (-1=ลด, 0=ไม่มีผล, 1=เพิ่ม)
    remark?: string;               // varchar(255)
}

// ====================================================================================
// LIST PAGE TYPES
// ====================================================================================

/** ข้อมูลสำหรับแสดงในตาราง List */
export interface IssueStockListItem {
    docu_item_id: string;
    issue_stk_no: string;
    appvissue_req_no: string;
    docu_date: string;
    dept_name?: string;
    save_emp_name?: string;
    rece_emp_name?: string;
    amnt_total: number;
    cancel_flag: string;
}

/** Query params สำหรับ List API */
export interface IssueStockListParams {
    issue_stk_no?: string;
    appvissue_req_no?: string;
    date_start?: string;
    date_end?: string;
    cancel_flag?: string;
    page?: number;
    limit?: number;
}
