/**
 * @file poa.service.ts
 * @description Service for Purchase Order Approval (POA) module
 */
import api from '@/core/api/api';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import type { POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import type { POStatus } from '@/modules/procurement/schemas/po-schemas';


// ---------------------------------------------------------------------------
// Helper: Status Normalization
// ---------------------------------------------------------------------------
const normalizePOStatus = (status?: string): POStatus => {
    if (!status) return 'DRAFT';
    const s = status.toUpperCase().trim();

    // Direct mapping — trust what the backend sends
    if (s === 'APPROVED')              return 'APPROVED';
    if (s === 'PARTIAL')               return 'PARTIAL';
    if (s === 'REJECTED' || s === 'CANCEL' || s === 'CANCELLED') return 'REJECTED';
    if (s === 'ISSUED')                return 'ISSUED';
    if (s === 'COMPLETED')             return 'COMPLETED';
    if (s === 'DRAFT')                 return 'DRAFT';

    // Map all PENDING/WAITING variants → PENDING_APPROVAL
    if (s === 'PENDING' || s === 'PENDING_APPROVAL' ||
        s === 'WAITING' || s === 'WAITING_APPROVAL' ||
        s === 'WAITING_FOR_APPROVE' || s === 'WAITING_FOR_APPROVAL') {
        return 'PENDING_APPROVAL';
    }

    // Fallback: return as-is (let UI handle unknown values)
    return (status as POStatus) || 'DRAFT';
};


/**
 * Standardizes the response from both List and Detail endpoints.
 * Backend often returns nested poHeader or inconsistent field names.
 */
const mapPOAResponseToListItem = (item: Record<string, any>): POListItem => {
    // 🚩 In case the API returns the object nested under poHeader or quotation
    const poHeader = (item.poHeader as any) || (item.po_header as any) || {};
    const lines = item.poLines || item.po_lines || poHeader.po_lines || poHeader.poLines || item.lines || [];

    const mapped = {
        ...poHeader,
        ...item,
        // Identify PO ID securely from multiple possible field names
        po_id: Number(item.approval_id || item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0),
        po_header_id: Number(item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0),
        po_no: String(poHeader.po_no || item.po_no || '-'),
        poa_no: String(item.approval_no || item.poa_no || '-'),
        po_date: String(item.approval_date || poHeader.po_date || item.po_date || item.created_at || ''),
        status: normalizePOStatus(item.status as string),
        
        // Currency & Finance
        // ⚠️ Convention: quote_currency_code = PO/vendor currency (e.g. USD)
        //                base_currency_code  = domestic/payment currency (e.g. THB)
        // "รหัสสกุลเงิน" = the currency the PO is quoted in (quote)
        // "ไปที่สกุลเงิน" = the currency to convert to / pay in (base)
        currency_code: String(item.quote_currency_code || item.currency_code || poHeader.currency_code || 'THB'),
        target_currency: String(item.base_currency_code || item.target_currency || poHeader.target_currency || 'THB'),
        exchange_rate: Number(item.exchange_rate || poHeader.exchange_rate || 1),
        exchange_rate_date: String(item.exchange_rate_date || item.approval_date || poHeader.po_date || ''),
        
        total_amount: Number(item.base_total_amount || poHeader.total_amount || item.total_amount || 0),
        
        // Vendor & Branch
        vendor_id: Number(poHeader.vendor_id || item.vendor_id || 0),
        vendor_name: String(poHeader.vendor_name || item.vendor_name || '-'),
        branch_id: Number(poHeader.branch_id || item.branch_id || 0),
        branch_name: String(poHeader.branch_name || item.branch_name || '-'),
        
        // References
        pr_id: Number(poHeader.pr_id || item.pr_id || 0),
        pr_no: String(poHeader.pr_no || item.pr_no || '-'),
        qc_id: Number(poHeader.qc_id || item.qc_id || 0),
        qc_no: String(poHeader.qc_no || item.qc_no || '-'),
        
        // Additional Info
        payment_term_days: Number(poHeader.payment_term_days || item.payment_term_days || 0),
        delivery_date: String(poHeader.delivery_date || item.delivery_date || ''),
        tax_name: String(item.tax_name || poHeader.tax_name || poHeader.tax_code?.tax_name || '-'),
        created_by_name: String(item.approval_emp_name || item.created_by_name || poHeader.created_by_name || '-'),
        
        approval_emp_name: item.approval_emp_name as string | undefined,
        po_lines: lines.map((l: any, idx: number) => ({
            ...l,
            id: l.id || l.po_line_id || idx + 1,
            po_line_id: l.po_line_id || l.id,
            qty_ordered: Number(l.qty_ordered || l.qty || 0),
            unit_price: Number(l.unit_price || 0),
            is_approved: l.is_approved !== undefined ? !!l.is_approved : true
        }))
    } as unknown as POListItem;

    return mapped;
};

const ENDPOINTS = {
    list: '/po-approval', // Updated to approval list endpoint
    detail: (id: number) => `/po-approval/${id}`, // Update if needed, but for now focusing on list
    update: (id: number) => `/po/${id}`,
    approve: (id: number) => `/po/${id}/approve`,
    reject: (id: number) => `/po/${id}/reject`,
    submit: '/po-approval', // Unified approval endpoint
    bulkApprove: '/po/bulk-approve', // If exists, otherwise we'll map over array
};
 
export interface POAApprovalPayload {
    po_header_id: number;
    status: 'APPROVED' | 'PARTIAL' | 'REJECTED';
    remarks?: string;
    approval_date: string;
    need_by_date: string;
    approval_emp_id: number;
    approval_emp_name: string;
    base_currency_code: string;
    quote_currency_code: string;
    exchange_rate: number;
    tax_code_id: number;
    discount_expression: string;
    lines: Array<{
        po_line_id: number;
        approved_qty: number;
        remarks?: string;
        approval_date: string;
        is_approved?: boolean;
    }>;
}
 
export const POAService = {

    /**
     * Main list — single source: /po-approval
     * Status correction: if backend returns PENDING but record has a POA number → APPROVED.
     * This is the user-confirmed business rule: "มีเลข POA = อนุมัติแล้ว"
     */
    getList: async (params?: POListParams): Promise<POListResponse> => {
        logger.info('[POAService] getList:', params);

        const selectedStatus = (params?.status as string) || 'PENDING_APPROVAL';

        // Fetch all approval records (no status filter → get everything)
        const response = await api.get<Record<string, unknown>>(ENDPOINTS.list, {
            params: { limit: 1000, page: 1 }
        });

        const rawItems = extractArrayFromResponse<Record<string, unknown>>(response);

        // Map and correct status
        // Business rule: has poa_no + backend says PENDING → APPROVED (backend inconsistency)
        const correctedItems: POListItem[] = rawItems.map(item => {
            const mapped = mapPOAResponseToListItem(item);
            if (mapped.status === 'PENDING_APPROVAL' && mapped.poa_no && mapped.poa_no !== '-') {
                return { ...mapped, status: 'APPROVED' as const };
            }
            return mapped;
        });

        // Status filter
        let filtered: POListItem[];
        if (selectedStatus === 'ALL') {
            filtered = correctedItems;
        } else {
            filtered = correctedItems.filter(item => item.status === selectedStatus);
        }

        // Text search
        filtered = filtered.filter(item => {
            const r = item as unknown as Record<string, unknown>;
            if (params?.po_no      && !String(r.po_no      || '').toLowerCase().includes(params.po_no.toLowerCase()))      return false;
            if (params?.poa_no     && !String(r.poa_no     || '').toLowerCase().includes(params.poa_no.toLowerCase()))     return false;
            if (params?.vendor_name && !String(r.vendor_name || '').toLowerCase().includes(params.vendor_name.toLowerCase())) return false;
            if (params?.pr_no      && !String(r.pr_no      || '').toLowerCase().includes(params.pr_no.toLowerCase()))      return false;
            if (params?.q) {
                const q = params.q.toLowerCase();
                const fields = ['po_no', 'poa_no', 'vendor_name', 'pr_no', 'qc_no'];
                if (!fields.some(f => String(r[f] || '').toLowerCase().includes(q))) return false;
            }
            return true;
        });

        // Paginate
        const page  = params?.page  || 1;
        const limit = params?.limit || 20;
        const paginatedData = filtered.slice((page - 1) * limit, page * limit);

        return { data: paginatedData, total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) };
    },


    getById: async (id: number): Promise<POListItem> => {
        logger.info(`[POAService] Fetching POA Detail: ${id}`);

        // 1. Fetch the approval record (has approval_no, status, approval_emp_name, currencies)
        const approvalRes = await api.get<Record<string, any>>(ENDPOINTS.detail(id));
        
        // 2. Determine the actual PO header ID to fetch full PO data (including lines)
        const poHeaderId = Number(
            approvalRes.po_header_id ||
            approvalRes.po_id ||
            (approvalRes.poHeader as any)?.po_header_id ||
            id
        );

        // 3. Fetch full PO data from /po/:id to get po_lines (approval endpoint may not return them)
        let poRes: Record<string, any> = {};
        try {
            poRes = await api.get<Record<string, any>>(`/po/${poHeaderId}`);
            logger.info(`[POAService] Fetched full PO detail for lines: /po/${poHeaderId}`);
        } catch (e) {
            logger.warn(`[POAService] Could not fetch /po/${poHeaderId} for lines, using approval data only`, e);
        }

        // 4. Merge: approval-specific fields take priority for status/approval info,
        //    PO data supplies the full line items
        const merged: Record<string, any> = {
            ...poRes,           // base: full PO data (vendor, branch, lines, etc.)
            ...approvalRes,     // override: approval-specific data wins (status, poa_no, currencies)
            // Lines: prefer PO endpoint (more complete) over approval endpoint
            poLines: poRes.poLines || poRes.po_lines || approvalRes.poLines || undefined,
            po_lines: poRes.po_lines || poRes.poLines || approvalRes.po_lines || undefined,
            // Preserve nested poHeader from whichever source has it
            poHeader: approvalRes.poHeader || poRes.poHeader || approvalRes.po_header || poRes.po_header || {},
        };

        return mapPOAResponseToListItem(merged);
    },

    /** Update PO details (quantity, remark) before approval */
    update: async (id: number, data: Partial<POAFormData>): Promise<SuccessResponse> => {
        logger.info(`[POAService] Updating PO before approval: ${id}`);
        return await api.put<SuccessResponse>(ENDPOINTS.update(id), data);
    },

    /** Approve PO */
    approve: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POAService] Approving PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), {});
    },

    /** Reject/Cancel PO */
    reject: async (id: number, reject_reason?: string): Promise<SuccessResponse> => {
        logger.info(`[POAService] Rejecting PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { reject_reason });
    },

    /** 
     * Unified approval submission (matching the new backend /po-approval)
     * Matches the structure of the Postman test
     */
    submitApproval: async (data: POAApprovalPayload): Promise<SuccessResponse> => {
        logger.info(`[POAService] Submitting POA Approval/Rejection:`, data);
        if (!data.status) {
            logger.error('[POAService] Status is missing from approval payload');
        }
        return await api.post<SuccessResponse>(ENDPOINTS.submit, data);
    },
    
    /** Bulk Approve POs (if API supports, otherwise loop) */
    bulkApprove: async (ids: number[]): Promise<SuccessResponse[]> => {
        logger.info(`[POAService] Bulk Approving POs:`, ids);
        // Implementing sequentially to ensure compatibility if bulk endpoint isn't ready
        const results = [];
        for (const id of ids) {
            results.push(await POAService.approve(id));
        }
        return results;
    }
};
