/**
 * @file approval-types.ts
 * @description Approval workflow types
 */

// ====================================================================================
// APPROVAL WORKFLOW - กำหนด Flow การอนุมัติ
// ====================================================================================

/** ApprovalDocType - ประเภทเอกสารที่ต้องอนุมัติ */
export type ApprovalDocType = 'PR' | 'PO' | 'GRN' | 'INVOICE';

/** ApprovalFlow - ตารางกำหนดเงื่อนไขการอนุมัติ */
export interface ApprovalFlow {
    flow_id: string;
    doc_type: ApprovalDocType;
    min_amount: number;
    max_amount: number;
    approval_flow_steps?: ApprovalFlowStep[];
}

/** ApprovalFlowStep - ขั้นตอนการอนุมัติ */
export interface ApprovalFlowStep {
    step_id: string;
    flow_id: string;
    approver_user_id: string;
    sequence_no: number;
}
