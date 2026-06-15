/**
 * @file transfer.types.ts
 * @description TypeScript types สำหรับ Transfer Requisition (ใบขอโอนย้ายสินค้า)
 * @schemas D9: Transfer_Requisition_header, D10: Transfer_Requisition_line
 */

// ====================================================================================
// D9 - HEADER TYPES
// ====================================================================================

/** ข้อมูล Header ของใบขอโอนย้ายสินค้า (จาก Backend) */
export interface TransferRequisitionHeader {
    transfer__req_id: string;      // uuid (PK - backend generate)
    transfer__req_no: string;      // varchar(25) - เลขที่เอกสารขอโอนย้าย
    docu_date: string;             // date
    remark?: string;               // varchar(255)
    branch_id: string;             // uuid
    save_emp_id: string;           // uuid (PK/FK → emp ผู้บันทึก)
    transfer_emp_id: string;       // uuid (PK/FK → emp ผู้ขอโอน)
    transfer_emp_name?: string;    // added for UI display
    stock_effect_ic?: number | null; // number
    cancelflag: string;            // char(1) default 'N'
    cancle_remark?: string;        // varchar(255)
    status?: string;               // varchar(20) DRAFT, PENDING, etc
    docu_item_no?: string;
    doc_link_ic_id?: number | string;
    doc_type_no?: number;
}

/** ข้อมูล Line ของใบขอโอนย้ายสินค้า (จาก Backend) */
export interface TransferRequisitionLine {
    transfer__req_id?: string;     // uuid (FK → D9)
    listno: number;                // smallint
    item_id: string;               // uuid (FK → dropdown สินค้า)
    item_code?: string;            // varchar(25) - auto-fill
    item_name?: string;            // varchar(255) - auto-fill
    uom_id: string;                // uuid (FK → dropdown หน่วย)
    from_warehouse_id: string;        // uuid - รหัสคลัง ID (ต้นทาง)
    from_warehouse_name?: string;     // varchar(255) - auto-fill
    from_location_id?: string | null;// uuid - รหัสที่เก็บ ID (ต้นทาง)
    from_location_name?: string;     // varchar(255) - auto-fill
    to_warehouse_id: string;           // uuid - รหัสคลัง ID (ปลายทาง)
    to_warehouse_name?: string;        // varchar(255) - auto-fill
    to_location_id?: string | null;   // uuid - รหัสที่เก็บ ID (ปลายทาง)
    to_location_name?: string;        // varchar(255) - auto-fill
    qty_ic: number;                // numeric(18,3)
    lot_id?: string | null;        // uuid
    lot_balance_id?: string | null; // uuid
    lot_no?: string;               // varchar(255) - auto-fill
    stock_flag: number;            // smallint
    remark?: string;               // varchar(255)
}

// ====================================================================================
// LIST PAGE TYPES
// ====================================================================================

/** ข้อมูลสำหรับแสดงในตาราง List */
export interface TransferRequisitionListItem {
    transfer__req_id: string;
    transfer__req_no: string;
    docu_date: string;
    branch_name?: string;
    save_emp_name?: string;
    transfer_emp_name?: string;
    from_warehouse_name?: string;
    from_location_name?: string;
    to_warehouse_name?: string;
    to_location_name?: string;
    cancelflag: string;
    status?: string;
}

/** Query params สำหรับ List API */
export interface TransferRequisitionListParams {
    transfer__req_no?: string;
    date_start?: string;
    date_end?: string;
    cancelflag?: string;
    page?: number;
    limit?: number;
}
