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
    stock_effect_ic: 0 | 1 | -1 | null; // ผลต่อคลังเริ่มต้น
    is_active: boolean | null;
}

export type DocLinkICCreatePayload = Omit<DocLinkIC, 'docu_type_id'>;
export type DocLinkICUpdatePayload = Partial<Omit<DocLinkIC, 'docu_type_id'>>;

// ==========================================
// DOC LINK IC ITEM TYPES (Detail)
// ==========================================

export interface DocLinkICItem {
    docu_item_id: string;           // uuid PK
    docu_type_id: string;           // FK (DocLinkIC)
    docu_item_no: number;           // ลำดับรายการ
    docu_item_name: string;         // ชื่อรายการย่อย (เช่น ขอเบิกใช้, ขอเบิกผลิต)
    stock_effect_ic: 0 | 1 | -1;    // ผลต่อคลังของรายการนี้
    is_active: boolean;             // สถานะการใช้งาน
}

// ==========================================
// DROPDOWN OPTIONS
// ==========================================

export const STOCK_EFFECT_OPTIONS = [
    { value: null,  label: 'ไม่กำหนด' },
    { value: 0,     label: 'ไม่มีผลต่อคลัง' },
    { value: 1,     label: 'เพิ่มคลัง' },
    { value: -1,    label: 'ลดคลัง' },
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
    stock_effect_ic: 0 | 1 | -1 | null;
    is_active: boolean | null;
}
