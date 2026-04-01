/**
 * @file poa.service.ts
 * @description Service for Purchase Order Approval (POA) module
 */
import api from '@/core/api/api';
import { POService } from './po.service';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import type { POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import type { POStatus } from '@/modules/procurement/schemas/po-schemas';
import { EmployeeService } from '@/modules/master-data/employee/services/employee.service';
import { BranchService } from '@/modules/master-data/company/services/branch.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';


// ---------------------------------------------------------------------------
// Helper: Status Normalization
// ---------------------------------------------------------------------------
const normalizePOStatus = (status?: string): POStatus => {
    if (!status) return 'DRAFT';
    const s = status.toUpperCase().trim();

    // 1. Terminal/Explicit Statuses
    if (s === 'APPROVED' || s === 'SUCCESS') return 'APPROVED';
    if (s === 'REJECTED' || s === 'CANCEL' || s === 'CANCELLED') return 'REJECTED';
    if (s === 'ISSUED')   return 'ISSUED';
    if (s === 'COMPLETED') return 'COMPLETED';
    if (s === 'PARTIAL' || s === 'PARTIALLY_APPROVED') return 'PARTIAL';
    if (s === 'DRAFT')     return 'DRAFT';

    // 2. Pending/Waiting variants → PENDING_APPROVAL
    const pendingVariants = [
        'PENDING', 'PENDING_APPROVAL', 'WAITING', 
        'WAITING_APPROVAL', 'WAITING_FOR_APPROVE', 'WAITING_FOR_APPROVAL'
    ];
    if (pendingVariants.includes(s)) {
        return 'PENDING_APPROVAL';
    }

    // 3. Fallback
    return (status as POStatus) || 'DRAFT';
};


/**
 * Standardizes the response from both List and Detail endpoints.
 * Backend often returns nested poHeader or inconsistent field names.
 */
const mapPOAResponseToListItem = (
    item: any, 
    employeeMap?: Record<string, string>, 
    branchMap?: Record<string, string>, 
    taxCodeMap?: Record<string, any>,
    uomMap?: Record<string, string>
): POListItem => {
    // 🚩 In case the API returns the object nested under poHeader or quotation
    const poHeader = (item.poHeader as any) || (item.po_header as any) || item || {};
    const lines = item.poLines || item.po_lines || poHeader.po_lines || poHeader.poLines || item.lines || [];

    // Status Normalization
    const status = normalizePOStatus(item.status || poHeader.status);

    // Metadata Recovery with Multi-Source Fallbacks
    const recovered = {
        tax_name: String(
            (item.tax_name && !['-','undefined'].includes(item.tax_name)) ? item.tax_name : 
            (taxCodeMap && (poHeader.tax_code_id || item.tax_code_id) && taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]) ? 
                (taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]?.tax_code || taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]?.tax_name) : 
            (poHeader.tax_name && !['-','undefined'].includes(poHeader.tax_name)) ? poHeader.tax_name :
            '-'
        ),
        created_by_name: String(
            (employeeMap && item.created_by && employeeMap[String(item.created_by).toLowerCase()]) ? employeeMap[String(item.created_by).toLowerCase()] :
            (employeeMap && poHeader.created_by && employeeMap[String(poHeader.created_by).toLowerCase()]) ? employeeMap[String(poHeader.created_by).toLowerCase()] :
            (item.created_by_name && !['-','undefined'].includes(item.created_by_name)) ? item.created_by_name : 
            (poHeader.created_by_name && !['-','undefined'].includes(poHeader.created_by_name)) ? poHeader.created_by_name : 
            '-'
        ),
        branch_name: String(
            (branchMap && item.branch_id && branchMap[String(item.branch_id).toLowerCase()]) ? branchMap[String(item.branch_id).toLowerCase()] :
            (item.branch_name && !['-','undefined'].includes(item.branch_name)) ? item.branch_name :
            (poHeader.branch_name && !['-','undefined'].includes(poHeader.branch_name)) ? poHeader.branch_name :
            '-'
        ),
        payment_term_days: Number(item.payment_term_days || poHeader.payment_term_days || 0),
        tax_rate: (() => {
            const rawRate = Number(
                (item.tax_rate !== undefined && item.tax_rate !== null) ? item.tax_rate : 
                (taxCodeMap && (poHeader.tax_code_id || item.tax_code_id) && taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]) ? 
                    taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]?.tax_rate : 
                (poHeader.tax_rate !== undefined && poHeader.tax_rate !== null) ? poHeader.tax_rate :
                7
            );
            // Normalization Layer: If rate is like 0.07, treat it as 7%
            return (rawRate > 0 && rawRate < 1) ? rawRate * 100 : rawRate;
        })(),
        exchange_rate: Number(
            poHeader.exchange_rate || poHeader.exchangeRate || poHeader.quote_currency_rate || poHeader.rate ||
            item.exchange_rate || item.exchangeRate || item.quote_currency_rate || item.rate || 1
        ),
        quote_currency_code: String(
            poHeader.quote_currency_code || poHeader.currency_code || poHeader.quoteCurrencyCode || poHeader.currencyCode ||
            item.quote_currency_code || item.currency_code || item.quoteCurrencyCode || item.currencyCode || 'THB'
        ),
        base_currency_code: String(
            poHeader.base_currency_code || poHeader.target_currency || poHeader.baseCurrencyCode || poHeader.targetCurrency ||
            item.base_currency_code || item.target_currency || item.baseCurrencyCode || item.targetCurrency || 'THB'
        ),
    };

    const mappedLines = lines.map((l: any, idx: number) => {
        // Priority: Recorded Approval (History) > Balance (New) > Action Qty > Original Full Qty
        // Add robust aliases: approved_qty, qty_approved, quantity, item_qty
        const qty_ordered = Number(l.approved_qty ?? l.qty_approved ?? l.remaining_qty ?? l.qty_ordered ?? l.quantity ?? l.item_qty ?? l.qty ?? 0);
        const unit_price = Number(l.unit_price ?? (poHeader.po_lines?.[idx] as any)?.unit_price ?? 0);
        const disc_amt = Number(l.discount_amount ?? l.discount_amt ?? 0);

        // DIAGNOSTIC LOG (Temporary)
        if (qty_ordered === 0 && (l.approved_qty !== undefined || l.remaining_qty !== undefined)) {
            console.log(`[POA Mapper] Line ${idx} has 0 qty. Keys:`, Object.keys(l), 'Values:', JSON.stringify(l));
        }

        return {
            ...l,
            id: l.id || l.po_line_id || idx + 1,
            po_line_id: l.po_line_id || l.id,
            qty_ordered,
            unit_price,
            discount_amount: disc_amt,
            net_amount: Number((qty_ordered * unit_price) - disc_amt),
            uom_name: String(
                (l.uom_name && !['-','undefined'].includes(l.uom_name)) ? l.uom_name :
                (uomMap && l.uom_id && uomMap[String(l.uom_id).toLowerCase()]) ? uomMap[String(l.uom_id).toLowerCase()] :
                (l.unit_name && !['-','undefined'].includes(l.unit_name)) ? l.unit_name :
                (poHeader.po_lines?.[idx] as any)?.uom_name || '-'
            ),
            is_approved: l.is_approved !== undefined ? !!l.is_approved : true,
        };
    });

    return {
        ...item,
        // Identify PO ID securely
        po_id: Number(item.approval_id || item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0),
        po_header_id: Number(item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0),
        po_no: String(poHeader.po_no || item.po_no || '-'),
        poa_no: String(item.approval_no || item.poa_no || '-'),
        po_date: String(item.approval_date || poHeader.po_date || item.po_date || item.created_at || ''),
        status: (() => {
            const poaNo = String(item.approval_no || item.poa_no || '-');
            if (status === 'PENDING_APPROVAL' && poaNo && poaNo !== '-') return 'APPROVED';
            return status;
        })(),
        
        ...recovered,
        
        po_lines: mappedLines,
        // Header-level financial totals with fallback calculation from lines
        total_amount: (() => {
            // 🛡️ REJECTED status = 0 ALWAYS (approved_qty=0 causes negative math from discounts)
            if (status === 'REJECTED') return 0;

            // Broad aliases for header-level total (History/List records often use 'net_amt' or 'amount')
            const rawTotal = Number(
                item.total_amount ?? 
                item.grand_total ?? 
                item.net_amount ?? 
                item.net_amt ?? 
                item.amount ?? 
                item.total ?? 
                item.total_price ?? 
                item.sum_total ??
                item.price ??
                item.approval_amount ?? 
                0
            );
            if (rawTotal > 0) return rawTotal;
            
            // Fallback: Sum up mapped lines (Only works if lines are included in list)
            if (mappedLines.length > 0) {
                // IMPORTANT: Only sum lines that were actually approved (qty > 0) in this specific round
                const subTotal = mappedLines.reduce((sum: number, l: any) => {
                    if (Number(l.qty_ordered || 0) <= 0) return sum;
                    return sum + Number(l.net_amount || 0);
                }, 0);
                
                if (subTotal === 0) return 0;

                const taxRate = Number(recovered.tax_rate ?? 7);
                return subTotal + (subTotal * taxRate / 100);
            }

            return 0;
        })(),
    } as unknown as POListItem;
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

        // 1. Parallel Fetching — fetch ALL statuses from PO to include REJECTED
        const [approvalRes, poRes, poRejectedRes, empRes, branchRes, taxRes, uomRes] = await Promise.allSettled([
            api.get<Record<string, unknown>>(ENDPOINTS.list, { params: { limit: 1000, page: 1 } }),
            POService.getList({ status: 'PENDING_APPROVAL', limit: 1000, page: 1 }),
            POService.getList({ status: 'REJECTED', limit: 1000, page: 1 }),
            EmployeeService.getAll(),
            BranchService.getList({ limit: 1000 }),
            TaxCodeService.getTaxCodes(),
            UnitService.getAll({ limit: 1000 })
        ]);

        const rawApprovalItems = approvalRes.status === 'fulfilled' ? extractArrayFromResponse<Record<string, unknown>>(approvalRes.value) : [];
        const rawPendingPOs    = poRes.status === 'fulfilled'         ? poRes.value.data         : [];
        const rawRejectedPOs   = poRejectedRes.status === 'fulfilled' ? poRejectedRes.value.data : [];

        // DIAGNOSTIC LOG (Temporary)
        if (rawApprovalItems && rawApprovalItems.length > 0) {
            console.log('[POA List Raw Data] First item keys:', Object.keys(rawApprovalItems[0]));
            console.log('[POA List Raw Data] Item 0 values:', JSON.stringify(rawApprovalItems[0]));
        }
        
        // 2. Build Robust Lookup Maps
        const employeeMap: Record<string, string> = {};
        if (empRes.status === 'fulfilled') {
            (empRes.value as any[] || []).forEach((emp: any) => {
                const id = String(emp.employee_pk || emp.employee_id || emp.id || '').toLowerCase();
                if (id) employeeMap[id] = emp.employee_fullname || emp.fullname || emp.name || '';
            });
        }

        const branchMap: Record<string, string> = {};
        if (branchRes.status === 'fulfilled') {
            const bItems = (branchRes.value as any)?.items || branchRes.value || [];
            if (Array.isArray(bItems)) {
                bItems.forEach((b: any) => {
                    const id = String(b.branch_pk || b.branch_id || b.id || '').toLowerCase();
                    if (id) branchMap[id] = b.branch_name;
                });
            }
        }

        const taxCodeMap: Record<string, any> = {};
        if (taxRes.status === 'fulfilled') {
            (taxRes.value as any[] || []).forEach((t: any) => {
                const id = String(t.tax_id || t.tax_code_id || t.id || '').toLowerCase();
                if (id) taxCodeMap[id] = t;
            });
        }
        
        const uomMap: Record<string, string> = {};
        if (uomRes.status === 'fulfilled') {
            const uItems = (uomRes.value as any)?.items || uomRes.value || [];
            if (Array.isArray(uItems)) {
                uItems.forEach((u: any) => {
                    const id = String(u.uom_id || u.unit_id || u.id || '').toLowerCase();
                    if (id) uomMap[id] = u.uom_name || u.unit_name || u.name || '';
                });
            }
        }

        // 3. Normalize and Combine
        const approvalItems: POListItem[]    = rawApprovalItems.map(item => mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap));
        const pendingPOItems: POListItem[]   = rawPendingPOs.map(item   => mapPOAResponseToListItem(item as any, employeeMap, branchMap, taxCodeMap, uomMap));
        const rejectedPOItems: POListItem[]  = rawRejectedPOs.map(item  => mapPOAResponseToListItem(item as any, employeeMap, branchMap, taxCodeMap, uomMap));

        // ---------------------------------------------------------------------------
        // 4. Deduplicate & Combine
        // ---------------------------------------------------------------------------
        const listMap = new Map<string, POListItem>();
        
        // Official approval records take priority. 
        // Use 'poa_no' as unique key for history records, falling back to 'po_no' for pending placeholders.
        approvalItems.forEach(item => {
            const uniqueKey = (item.poa_no && item.poa_no !== '-') ? item.poa_no : (item.po_no || '');
            if (uniqueKey) listMap.set(uniqueKey, item);
        });

        // Add pending POs only if they are not already represented by an approval record.
        pendingPOItems.forEach(item => {
            const poNo = item.po_no || '';
            // For pending POs, we check if ANY approval record already covers this PO No
            const alreadyInList = Array.from(listMap.values()).some(existing => existing.po_no === poNo);
            if (poNo && !alreadyInList) {
                listMap.set(poNo, item);
            }
        });

        // 🛡️ Add REJECTED POs — these come from the PO endpoint and may not appear in /po-approval
        // The approval record (with status REJECTED) takes priority if it already exists.
        rejectedPOItems.forEach(item => {
            const poNo = item.po_no || '';
            const alreadyInList = Array.from(listMap.values()).some(existing => existing.po_no === poNo);
            if (poNo && !alreadyInList) {
                // Force status to REJECTED + zero amount
                listMap.set(poNo, { ...item, status: 'REJECTED', total_amount: 0 });
            }
        });

        const combinedItems = Array.from(listMap.values());

        // 3. Status Filtering (Strict)
        let filtered: POListItem[];
        if (selectedStatus === 'ALL') {
            filtered = combinedItems;
        } else {
            // Strict match for other statuses (APPROVED, PARTIAL, REJECTED, etc.)
            // We ensure both sides are normalized for safety, although they should be already.
            filtered = combinedItems.filter(item => {
                const itemStatus = String(item.status || '').toUpperCase().trim();
                const targetStatus = String(selectedStatus).toUpperCase().trim();
                return itemStatus === targetStatus;
            });
        }

        // DIAGNOSTIC LOG (Temporary - identifies filtering leaks)
        logger.info(`[POAService] Status Filter applied: ${selectedStatus}. Before: ${combinedItems.length}, After: ${filtered.length}`);

        // Manual Filter by ALL params
        filtered = filtered.filter(item => {
            const r = item as unknown as Record<string, unknown>;
            
            // Text Search (po_no, poa_no, vendor_name, pr_no)
            if (params?.po_no && !String(r.po_no || '').toLowerCase().includes(params.po_no.toLowerCase())) return false;
            if (params?.poa_no && !String(r.poa_no || '').toLowerCase().includes(params.poa_no.toLowerCase())) return false;
            if (params?.vendor_name && !String(r.vendor_name || '').toLowerCase().includes(params.vendor_name.toLowerCase())) return false;
            if (params?.pr_no && !String(r.pr_no || '').toLowerCase().includes(params.pr_no.toLowerCase())) return false;
            
            // Unified Search (q)
            if (params?.q) {
                const q = params.q.toLowerCase();
                const fields = ['po_no', 'poa_no', 'vendor_name', 'pr_no', 'qc_no'];
                if (!fields.some(f => String(r[f] || '').toLowerCase().includes(q))) return false;
            }

            // Date Range
            if (params?.date_from) {
                const poDate = new Date(String(r.po_date || '0')).getTime();
                const fromDate = new Date(params.date_from).getTime();
                if (poDate < fromDate) return false;
            }
            if (params?.date_to) {
                const poDate = new Date(String(r.po_date || '0')).getTime();
                const toDate = new Date(params.date_to).getTime();
                if (poDate > toDate) return false;
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

        // 1. Parallel fetch for registries and detail
        const [res, emps, branches, taxes, uoms] = await Promise.allSettled([
            api.get<Record<string, unknown>>(ENDPOINTS.detail(id)),
            EmployeeService.getAll(),
            BranchService.getList({ limit: 1000 }),
            TaxCodeService.getTaxCodes(),
            UnitService.getAll({ limit: 1000 })
        ]);

        const employeeMap: Record<string, string> = {};
        if (emps.status === 'fulfilled') {
            (emps.value as any[] || []).forEach((emp: any) => {
                const eid = String(emp.employee_pk || emp.employee_id || emp.id || '').toLowerCase();
                if (eid) employeeMap[eid] = emp.employee_fullname || emp.fullname || emp.name || '';
            });
        }

        const branchMap: Record<string, string> = {};
        if (branches.status === 'fulfilled') {
            const bItems = (branches.value as any)?.items || branches.value || [];
            if (Array.isArray(bItems)) {
                bItems.forEach((b: any) => {
                    const bid = String(b.branch_pk || b.branch_id || b.id || '').toLowerCase();
                    if (bid) branchMap[bid] = b.branch_name;
                });
            }
        }

        const taxCodeMap: Record<string, any> = {};
        if (taxes.status === 'fulfilled') {
            (taxes.value as any[] || []).forEach((t: any) => {
                const tid = String(t.tax_id || t.tax_code_id || t.id || '').toLowerCase();
                if (tid) taxCodeMap[tid] = t;
            });
        }
        
        const uomMap: Record<string, string> = {};
        if (uoms.status === 'fulfilled') {
            const uItems = (uoms.value as any)?.items || uoms.value || [];
            if (Array.isArray(uItems)) {
                uItems.forEach((u: any) => {
                    const uid = String(u.uom_id || u.unit_id || u.id || '').toLowerCase();
                    if (uid) uomMap[uid] = u.uom_name || u.unit_name || u.name || '';
                });
            }
        }

        const approvalRes = res.status === 'fulfilled' ? res.value : {};
        const poHeaderId = Number(approvalRes.po_header_id || approvalRes.po_id || (approvalRes.poHeader as any)?.po_header_id || id);

        let poRes: any = {};
        try {
            poRes = await POService.getById(poHeaderId);
        } catch (error) {
            logger.error(`[POAService] Could not fetch base PO ${poHeaderId}`, error);
        }

        // Merge logic: If we have an existing POA record, its lines should take precedence.
        // Backend POA detail might use 'lines' instead of 'po_lines'.
        const parentLines = poRes.po_lines || poRes.poLines || [];
        const poaLinesRaw = approvalRes.po_lines || approvalRes.lines || [];
        const poaLines = (Array.isArray(poaLinesRaw) && poaLinesRaw.length > 0) ? poaLinesRaw : [];
        
        let finalLines = poaLines;
        if (poaLines.length > 0) {
            // Enrich POA lines with parent PO data (qty, item_name, unit_price, po_line_id)
            finalLines = poaLines.map((l: any, idx: number) => {
                // Try to find matching line by po_line_id first, then fallback to index
                const parentLine = (l.po_line_id) 
                    ? parentLines.find((pl: any) => pl.id === l.po_line_id || pl.po_line_id === l.po_line_id) 
                    : parentLines[idx];
                
                return { 
                    ...(parentLine || {}), 
                    ...l 
                };
            });
        } else {
            finalLines = parentLines;
        }

        const merged: Record<string, any> = {
            ...poRes,
            ...approvalRes,
            po_lines: finalLines,
            poHeader: poRes.poHeader || poRes.po_header || poRes || {},
        };

        const result = mapPOAResponseToListItem(merged, employeeMap, branchMap, taxCodeMap, uomMap);
        
        logger.info(`[POAService] Final Hydrated Result for ${id}:`, {
            po_no: result.po_no,
            branch: result.branch_name,
            preparer: result.created_by_name,
            tax: result.tax_name,
            term: result.payment_term_days
        });

        return result;
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
