export interface RequisitionApprovalListItem {
    row_key: string;
    approval_id?: number;
    docu_item_id: string; // matches backend requisition PK
    issue_req_no: string;
    docu_date: string;
    dept_name?: string;
    save_emp_name?: string;
    qty_total: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approval_emp_name?: string;
    approved_date?: string;
    raw?: Record<string, unknown>;
}

export interface RequisitionApprovalListParams {
    issue_req_no?: string;
    date_start?: string;
    date_end?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';
    page?: number;
    limit?: number;
}

export interface ApproveRequisitionPayload {
    docu_item_id: string;
    status: 'APPROVED' | 'REJECTED';
    approval_emp_id: number | string;
    reject_reason?: string;
}
