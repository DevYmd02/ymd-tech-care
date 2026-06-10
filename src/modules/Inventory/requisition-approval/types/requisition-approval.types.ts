export interface RequisitionApprovalListItem {
    row_key: string;
    approval_id?: number;
    docu_item_id: string; // matches backend requisition PK
    issue_req_no: string;
    docu_item_no?: string;
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
    appv_issue_req_date: string;
    doc_link_ic_id: number;
    issue_req_id: number;
    emp_dept_id: number;
    project_id: number | null;
    remarks: string;
    branch_id: number;
    approval_emp_id: number;
    status: 'APPROVED' | 'REJECTED';
    stock_effect_ic: number;
    reject_reason?: string;
    lines: {
        item_id: number;
        qty: number;
        approved_qty: number;
        uom_id: number;
        warehouse_id: number;
        location_id: number | null;
        lot_id: number | null;
        lot_balance_id: number | null;
    }[];
}
