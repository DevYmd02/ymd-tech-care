/**
 * @file transfer-approval.types.ts
 * @description TypeScript types สำหรับ อนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval)
 * @schemas D11: appv_transfer_header, D12: appv_transfer_line
 */

// ====================================================================================
// D11 - HEADER TYPES
// ====================================================================================

export interface TransferApprovalHeader {
    transfer_req_id: string;        // uuid - ID เอกสารอ้างอิงใบขอโอนย้าย
    transfer_req_no?: string;       // varchar(25) - เลขที่เอกสารอ้างอิงใบขอโอนย้าย
    transfer_req_date?: string;
    docu_date?: string;
    transfer_docu_item_name?: string;
    transfer_emp_id?: string;
    transfer_emp_name?: string;
    appv_transfer_id: string;       // uuid (PK) - ID เอกสารอนุมัติขอโอนย้าย
    appv_transfer_no: string;       // varchar(25) (PK) - เลขที่เอกสารอนุมัติ
    appv_date: string;              // date - วันที่อนุมัติ
    emp_dept_id: string;            // uuid - ID แผนก
    job_id?: string | null;         // uuid - ID Job
    remark?: string;                // varchar(255) - หมายเหตุ
    branch_id: string;              // uuid - ID สาขา
    appv_flag: string;              // char(1) - Y: ทั้งใบ, P: บางส่วน, N: ไม่อนุมัติ
    cancel_date?: string | null;    // date
    cancel_flag: string;            // char(1) default 'N'
    cancel_remark?: string;         // varchar(255)
    save_emp_id?: string | null;    // uuid (PK) - ID ผู้บันทึก (emp_id)
    appv_emp_id?: string | null;    // uuid (PK) - ID ผู้อนุมัติ (emp_id)
    stock_effect_ic?: number | null;// number - อ้างอิงผลต่อคลัง
}

// ====================================================================================
// D12 - LINE TYPES
// ====================================================================================

export interface TransferApprovalLine {
    appv_transfer_id?: string;     // uuid (FK) - ID เอกสารอนุมัติขอโอนย้าย
    listno: number;                // smallint
    item_id: string;               // uuid (FK) - รหัสสินค้า
    item_code?: string;            // varchar(25) - auto-fill
    item_name: string;             // varchar(255)
    uom_id: string;                // uuid (FK) - รหัสหน่วย
    uom_name?: string;             // varchar(255) - auto-fill
    income_inve_id: string;        // uuid - รหัสคลัง ID (ต้นทาง)
    income_inve_name?: string;     // varchar(255) - auto-fill
    income_loca_id?: string | null;// uuid - รหัสที่เก็บ ID (ต้นทาง)
    income_loca_name?: string;     // varchar(255) - auto-fill
    out_inve_id: string;           // uuid - รหัสคลัง ID (ปลายทาง)
    out_inve_name?: string;        // varchar(255) - auto-fill
    out_loca_id?: string | null;   // uuid - รหัสที่เก็บ ID (ปลายทาง)
    out_loca_name?: string;        // varchar(255) - auto-fill
    qty_ic: number;                // numeric(18,3) - จำนวนขอโอนย้าย
    appv_stock_qty: number;        // numeric(18,3) - จำนวนอนุมัติ
    lot_id?: string | null;        // uuid - หมายเลข LOT
    lot_no?: string;               // varchar(255) - auto-fill
    stock_flag: number;            // smallint - มีผลต่อ Stock (0, -1, 1)
    remark?: string;               // varchar(255)
}

// ====================================================================================
// LIST PAGE TYPES
// ====================================================================================

export interface TransferApprovalListItem {
    appv_transfer_id: string;
    appv_transfer_no: string;
    transfer_req_id: string;
    transfer_req_no?: string;
    appv_date: string;
    appv_transfer_date?: string;
    branch_name?: string;
    save_emp_name?: string;
    transfer_emp_name?: string;
    appv_emp_name?: string;
    approval_emp_id?: string | number;
    appv_flag: string;
    status?: string;
    cancel_flag: string;
}

export interface TransferApprovalListParams {
    appv_transfer_no?: string;
    transfer_req_no?: string;
    date_start?: string;
    date_end?: string;
    appv_flag?: string;
    cancel_flag?: string;
    page?: number;
    limit?: number;
}
