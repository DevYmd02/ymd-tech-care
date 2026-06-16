/**
 * @file transfer-in.types.ts
 * @description TypeScript types สำหรับ Transfer In (ใบโอนย้ายสินค้าเข้า)
 * @schemas D15: transfer_in_header, D16: transfer_in_line
 */

// ====================================================================================
// D15 - HEADER TYPES
// ====================================================================================

export interface TransferInHeader {
    transfer_in_id?: string;       // uuid (PK - backend generate)
    transfer_in_no?: string;       // varchar(25) - เลขที่เอกสาร
    docu_date?: string;            // date - วันที่เอกสาร (ตาม D15)
    transfer_in_date?: string;     // datetime - วันที่เอกสาร (ตาม Postman)
    transfer_date?: string;        // date - วันที่โอนออก (อ้างอิง)
    appv_transfer_id?: string | number; // ID เอกสารอนุมัติอ้างอิง (ตาม Postman)
    transfer_out_id?: string | number;  // ID เอกสารโอนย้ายออก (ตาม D15)
    emp_dept_id: string | number;  // ID แผนก
    job_id?: string;               // ID Job
    remark?: string;               // varchar(255)
    remarks?: string;              // varchar(255) (ตาม Postman)
    branch_id: string | number;    // ID สาขา
    appv_emp_id?: string;          // ID ผู้อนุมัติ
    rece_emp_id?: string;          // ID ผู้รับสินค้า
    stock_effect_ic?: number | null; // อ้างอิงผลต่อคลัง
    
    // Postman Extra Fields
    doc_link_ic_id?: number | string;
    project_id?: number | string;
    created_by_emp_id?: number | string;
    status?: string;
    doc_type_no?: number | string;
}

// ====================================================================================
// D16 - LINE TYPES
// ====================================================================================

export interface TransferInLine {
    transfer_in_line_id?: string;  // PK
    transfer_in_id?: string;       // FK -> Header
    appv_transfer_line_id?: number | string; // FK -> Approved Req Line (Postman)
    listno?: number;               // ลำดับรายการ
    item_id: string | number;      // รหัสสินค้า
    item_name?: string;            // ชื่อสินค้า
    uom_id: string | number;       // รหัสหน่วย
    
    // D16 field mapping to Postman
    income_inve_id?: string | number; // รหัสคลัง ID (ต้นทาง)
    from_warehouse_id?: string | number; // Postman (ต้นทาง)
    
    income_loca_id?: string | number | null; // รหัสที่เก็บ ID (ต้นทาง)
    from_location_id?: string | number | null; // Postman (ต้นทาง)
    
    out_inve_id?: string | number; // รหัสคลัง ID (ปลายทาง)
    to_warehouse_id?: string | number; // Postman (ปลายทาง)
    
    out_loca_id?: string | number | null; // รหัสที่เก็บ ID (ปลายทาง)
    to_location_id?: string | number | null; // Postman (ปลายทาง)
    
    appv_stock_qty?: number;       // D16
    qty?: number;                  // Postman
    qty_approved?: number;         // Postman
    
    lot_id?: string | number | null;
    lot_balance_id?: string | number | null; // Postman
    
    stock_flag?: number;           // มีผลต่อ Stock
    remarks?: string;              // หมายเหตุรายการ
}

// ====================================================================================
// PAYLOAD TYPES (For POST/PUT)
// ====================================================================================

export interface TransferInPayload {
    transfer_in_date: string;
    doc_link_ic_id?: number | string;
    appv_transfer_id?: number | string;
    emp_dept_id: number | string;
    project_id?: number | string;
    remarks?: string;
    branch_id: number | string;
    created_by_emp_id?: number | string;
    status?: string;
    stock_effect_ic?: number | null;
    doc_type_no?: number | string;
    lines: TransferInLinePayload[];
}

export interface TransferInLinePayload {
    appv_transfer_line_id?: number | string;
    item_id: number | string;
    qty: number;
    qty_approved?: number;
    uom_id: number | string;
    from_warehouse_id: number | string;
    from_location_id?: number | string | null;
    to_warehouse_id: number | string;
    to_location_id?: number | string | null;
    lot_id?: number | string | null;
    lot_balance_id?: number | string | null;
    remarks?: string;
}

// ====================================================================================
// LIST PAGE TYPES
// ====================================================================================

export interface TransferInListItem {
    transfer_in_id: string;
    transfer_in_no: string;
    docu_date: string;
    branch_name?: string;
    emp_dept_name?: string;
    status?: string;
}

export interface TransferInListParams {
    transfer_in_no?: string;
    date_start?: string;
    date_end?: string;
    status?: string;
    page?: number;
    limit?: number;
}

// ====================================================================================
// PENDING PAGE TYPES
// ====================================================================================

export interface PendingTransferInLine {
    appv_transfer_line_id: number;
    appv_transfer_id: number;
    transfer_req_line_id: number;
    item_id: number;
    qty: string | number;
    qty_approved: string | number;
    uom_id: number;
    from_warehouse_id: number;
    from_location_id: number;
    to_warehouse_id: number;
    to_location_id: number;
    lot_id?: number | null;
    lot_balance_id?: number | null;
    remarks?: string | null;
}

export interface PendingTransferInItem {
    appv_transfer_id: number;
    appv_transfer_no?: string;
    appv_transfer_date?: string;
    transfer_req_id: number;
    remarks?: string | null;
    branch_id: number;
    status: string;
    doc_link_ic_id: number;
    stock_effect_ic: number;
    doc_type_no: number;
    doc_type_name: string;
    approval_emp_id: number;
    cancel_date?: string | null;
    cancel_flag: string;
    cancel_remark?: string | null;
    cancel_emp_id?: number | null;
    appvTransferLines: PendingTransferInLine[];
}
