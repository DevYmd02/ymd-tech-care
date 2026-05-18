// ==========================================
// DOC LINK IC TYPES (Master)
// ==========================================

export interface DocLinkIC {
    docu_type_id: string;           // uuid PK
    docu_type_code: string;         // varchar(10) เช่น 102, 103
    docu_name_th: string | null;    // ชื่อประเภทเอกสาร TH
    docu_name_en: string;           // ชื่อประเภทเอกสาร EN (required)
    docu_desc: string;              // คำอธิบาย (required)
    remark: string;                 // หมายเหตุ (required)
    stock_effect_ic: 0 | 1 | 2;     // ผลต่อคลังเริ่มต้น
    is_active: boolean | null;
    system_document_id?: number | null; // Linked System Document
    doc_type_no?: number | null;        // Sequence number (parent is 0 or null)
    doc_type_name?: string | null;      // Name of sub-item (null for parent)
    doc_link_ic_id?: number | null;     // Real DB Primary Key id
}

export interface DocLinkICCreatePayload {
    system_document_id: number;
    docu_desc: string;
    remark: string;
    stock_effect_ic: 0 | 1 | 2;
    is_active: boolean;
}

export interface DocLinkICUpdatePayload {
    system_document_id?: number;
    docu_desc?: string;
    remark?: string;
    stock_effect_ic?: 0 | 1 | 2;
    is_active?: boolean;
}

// ==========================================
// DOC LINK IC ITEM TYPES (Detail)
// ==========================================

export interface DocLinkICItem {
    docu_item_id: string;           // uuid PK
    docu_type_id: string;           // FK (DocLinkIC)
    docu_item_no: number;           // ลำดับรายการ
    doc_type_no?: number;           // ลำดับรายการ (real API)
    docu_item_name: string;         // ชื่อรายการย่อย (เช่น ขอเบิกใช้, ขอเบิกผลิต)
    doc_type_name?: string;         // ชื่อรายการย่อย (real API)
    stock_effect_ic: 0 | 1 | 2;      // ผลต่อคลังของรายการนี้
    is_active: boolean;             // สถานะการใช้งาน
    docu_desc?: string | null;      // คำอธิบาย
    remark?: string | null;         // หมายเหตุ
}

export interface DocLinkICBackendResponse {
    doc_link_ic_id?: number;
    system_document_id?: number;
    docu_desc?: string | null;
    doc_type_no?: number;
    doc_type_name?: string | null;
    remark?: string | null;
    stock_effect_ic?: 0 | 1 | 2 | null;
    is_active?: boolean | null;
    // mock / legacy fields
    docu_item_id?: string;
    docu_type_id?: string;
    docu_item_no?: number;
    docu_item_name?: string;
}

// ==========================================
// DROPDOWN OPTIONS
// ==========================================

export const STOCK_EFFECT_OPTIONS = [
    { value: 0,     label: 'ไม่มีผลต่อคลัง' },
    { value: 1,     label: 'เพิ่มคลัง' },
    { value: 2,     label: 'ลดคลัง' },
] as const;

export const IS_ACTIVE_OPTIONS = [
    { value: true,  label: 'ใช้งาน' },
    { value: false, label: 'ไม่ใช้งาน' },
] as const;

// ==========================================
// INLINE ROW STATE
// ==========================================

/** shape for a new (unsaved) inline row */
export interface NewDocLinkICRow {
    _isNew: true;
    docu_type_code: string;
    docu_name_th: string;
    docu_name_en: string;
    docu_desc: string;
    remark: string;
    stock_effect_ic: 0 | 1 | 2;
    is_active: boolean | null;
    initial_sub_items?: Array<{ name: string; stock_effect_ic: 0 | 1 | 2; remark?: string; docu_desc?: string }>;
}
