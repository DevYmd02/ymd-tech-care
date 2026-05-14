/**
 * @file ic-document-link.types.ts
 * @description Types for IC Document Link master data
 */



// ====================================================================================
// IC DOCUMENT LINK
// ====================================================================================

/** BackendICDocumentLink - โครงสร้างดิบจาก API */
export interface BackendICDocumentLink {
    docu_type_id: string; // uuid
    docu_type_code: string; // varchar(10)
    docu_name_th?: string; // varchar(200)
    docu_name_en: string; // varchar(200)
    docu_item_no?: number; // int
    docu_item_name?: string; // varchar(200)
    docu_desc: string; // varchar(200)
    remark: string; // varchar(200)
    stock_effect_ic: number; // smallint (0, 1, -1)
    is_active: boolean; // default true
}

/** ICDocumentLinkMaster - ข้อมูลหลัก (Extended for UI) */
export interface ICDocumentLinkMaster extends BackendICDocumentLink {
    id: string; // Mapping: docu_type_id
}

/** ICDocumentLinkListItem - สำหรับแสดงในตาราง */
export interface ICDocumentLinkListItem extends BackendICDocumentLink {
    id: string;
}

/** ICDocumentLinkFormData */
export interface ICDocumentLinkFormData {
    docu_type_code: string;
    docu_name_th?: string;
    docu_name_en: string;
    docu_item_no?: number;
    docu_item_name?: string;
    docu_desc: string;
    remark: string;
    stock_effect_ic: number;
    is_active: boolean;
}

export const initialICDocumentLinkFormData: ICDocumentLinkFormData = {
    docu_type_code: '',
    docu_name_th: '',
    docu_name_en: '',
    docu_item_no: undefined,
    docu_item_name: '',
    docu_desc: '',
    remark: '',
    stock_effect_ic: 0,
    is_active: true,
};
