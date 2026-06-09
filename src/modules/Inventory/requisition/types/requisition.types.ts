/**
 * @file requisition.types.ts
 * @description TypeScript types สำหรับ Issue Requisition (ใบขอเบิก)
 * @schemas D1: issue_requisition_header, D2: issue_requisition_line
 */

// ====================================================================================
// D1 - HEADER TYPES
// ====================================================================================

/** ข้อมูล Header ของใบขอเบิก (จาก Backend) */
export interface IssueRequisitionHeader {
    docu_item_id: string;          // uuid (PK - backend generate)
    docu_item_no: string;          // uuid (FK → doc_link_ic)
    issue_req_no: string;          // varchar(25) - Unique
    docu_date: string;             // date
    emp_dept_id: string;           // uuid (FK → แผนก)
    job_id: string;                // uuid (FK → job)
    branch_id: string;             // uuid (FK → สาขา)
    created_by_emp_id: string;     // uuid (FK → emp ผู้บันทึก)
    request_by_emp_id: string;     // uuid (FK → emp ผู้ขอเบิก)
    qty_total: number;             // numeric(18,3) - คำนวณอัตโนมัติจาก line
    stock_effect_ic: number;       // smallint (0, 1, -1)
    remark?: string;               // varchar(255)
    cancel_flag: string;           // char(1) default 'N'
    cancel_date?: string | null;   // date - null = ยังไม่ยกเลิก
    cancel_remark?: string;        // varchar(255)
}

/** ข้อมูล Line ของใบขอเบิก (จาก Backend) */
export interface IssueRequisitionLine {
    docu_item_line_id?: number;    // bigint (PK - backend generate)
    docu_item_id?: string;         // uuid (FK → D1)
    listno: number;                // smallint (auto increment ตาม row)
    item_id: string;               // uuid (FK → dropdown สินค้า)
    item_code?: string;            // varchar(25) - auto-fill หรือจาก backend
    item_name?: string;            // varchar(255) - auto-fill จาก item_id
    uom_id: string;                // uuid (FK → dropdown หน่วย)
    warehouse_id: string;          // uuid (FK → dropdown คลัง)
    warehouse_name?: string;       // varchar(255) - auto-fill หรือจาก backend
    location_id?: string;          // uuid (FK → dropdown ที่เก็บ)
    location_name?: string;        // varchar(255) - auto-fill หรือจาก backend
    lot_id?: string;               // uuid (FK → dropdown lot)
    lot_no?: string;               // varchar(255) - auto-fill หรือจาก backend
    qty_ic: number;                // numeric(18,3) - must > 0
    stock_flag: number;            // smallint (0=ไม่กระทบ, -1=ลด, 1=เพิ่ม)
    remark?: string;               // varchar(255)
}

// RequisitionLineFormData and RequisitionFormData are now inferred from Zod schemas in requisition.schemas.ts

// ====================================================================================
// LIST PAGE TYPES
// ====================================================================================

/** ข้อมูลสำหรับแสดงในตาราง List */
export interface RequisitionListItem {
    docu_item_id: string;
    issue_req_no: string;
    docu_item_no: string;
    docu_date: string;
    dept_name?: string;
    save_emp_name?: string;
    cancel_flag: string;
    qty_total: number;
}

/** Query params สำหรับ List API */
export interface RequisitionListParams {
    issue_req_no?: string;
    date_start?: string;
    date_end?: string;
    cancel_flag?: string;
    page?: number;
    limit?: number;
}

// ====================================================================================
// DROPDOWN OPTION TYPES
// ====================================================================================

export interface DocLinkOption {
    docu_type_id: string;
    docu_type_code: string;
    docu_name_th?: string;
    docu_name_en: string;
    docu_item_no?: number;
}

export const STOCK_FLAG_OPTIONS = [
    { value: 0, label: 'ไม่กระทบ Stock' },
    { value: -1, label: 'ลด Stock' },
    { value: 1, label: 'เพิ่ม Stock' },
] as const;

export const CANCEL_FLAG_OPTIONS = [
    { value: 'N', label: 'ไม่ยกเลิก' },
    { value: 'Y', label: 'ยกเลิก' },
] as const;
