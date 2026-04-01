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
import { extractArrayFromResponse, applyClientFilters } from '@/shared/utils/clientFilterUtils';
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
            (item.approval_emp_name && !['-','undefined'].includes(item.approval_emp_name)) ? item.approval_emp_name :
            (employeeMap && item.created_by && employeeMap[String(item.created_by).toLowerCase()]) ? employeeMap[String(item.created_by).toLowerCase()] :
            (employeeMap && poHeader.created_by && employeeMap[String(poHeader.created_by).toLowerCase()]) ? employeeMap[String(poHeader.created_by).toLowerCase()] :
            (employeeMap && item.create_by && employeeMap[String(item.create_by).toLowerCase()]) ? employeeMap[String(item.create_by).toLowerCase()] :
            (employeeMap && poHeader.create_by && employeeMap[String(poHeader.create_by).toLowerCase()]) ? employeeMap[String(poHeader.create_by).toLowerCase()] :
            (employeeMap && item.created_by_id && employeeMap[String(item.created_by_id).toLowerCase()]) ? employeeMap[String(item.created_by_id).toLowerCase()] :
            (item.created_by_name && !['-','undefined'].includes(item.created_by_name)) ? item.created_by_name : 
            (poHeader.created_by_name && !['-','undefined'].includes(poHeader.created_by_name)) ? poHeader.created_by_name : 
            (item.preparer_name && !['-','undefined'].includes(item.preparer_name)) ? item.preparer_name :
            (poHeader.preparer_name && !['-','undefined'].includes(poHeader.preparer_name)) ? poHeader.preparer_name :
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
        // Identify PO ID securely - support string keys for deduplication
        po_id: item.approval_id || item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0,
        po_header_id: Number(item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0),
        po_no: String(poHeader.po_no || item.po_no || '-'),
        poa_no: String(item.approval_no || item.poa_no || '-'),
        po_date: String(item.approval_date || poHeader.po_date || item.po_date || item.created_at || ''),
        status: (() => {
            const currentStatus = String(item.status || status || 'PENDING_APPROVAL').toUpperCase();
            const poaNo = String(item.approval_no || item.poa_no || '-');
            
            // 🎯 Normalization: If backend says PENDING, map to our canonical PENDING_APPROVAL
            let normalized = currentStatus === 'PENDING' ? 'PENDING_APPROVAL' : currentStatus;
            
            // 🎯 Logic: If it has a POA number, it is definitely APPROVED (even if original record says PENDING)
            if (normalized === 'PENDING_APPROVAL' && poaNo && poaNo !== '-') {
                normalized = 'APPROVED';
            }
            
            return normalized as any;
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

        // 1. Parallel Fetching — fetch ALL statuses to ensure mapping works correctly
        const [approvalRes, poRes, poRejectedRes, empRes, branchRes, taxRes, uomRes] = await Promise.allSettled([
            api.get<Record<string, unknown>>(ENDPOINTS.list, { params: { limit: 1000, page: 1 } }),
            POService.getList({ limit: 1000, page: 1 }), // Fetch all raw POs to avoid status mismatch; normalization happens below
            POService.getList({ status: 'REJECTED', limit: 1000, page: 1 }),
            EmployeeService.getAll(),
            BranchService.getList({ limit: 1000 }),
            TaxCodeService.getTaxCodes(),
            UnitService.getAll({ limit: 1000 })
        ]);

        const rawApprovalItems = (approvalRes.status === 'fulfilled') ? extractArrayFromResponse<Record<string, unknown>>(approvalRes.value) : [];
        const rawPendingPOs    = (poRes.status === 'fulfilled') ? extractArrayFromResponse<POListItem>(poRes.value) : [];
        const rawRejectedPOs   = (poRejectedRes.status === 'fulfilled') ? extractArrayFromResponse<POListItem>(poRejectedRes.value) : [];

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
        // Approval items come from the raw /po-approval endpoint, so they need full mapping.
        const approvalItems: POListItem[] = rawApprovalItems.map(item => mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap));
        
        // Pending/Rejected POs come from POService.getList() which ALREADY hydrates and maps them.
        // We only need to ensure their status is canonical.
        const pendingPOItems: POListItem[] = rawPendingPOs
            .filter(item => {
                const s = String(item.status || '').toUpperCase();
                // 🎯 Filter Rule: From the raw source, only include items that actually NEED approval action.
                // Documents that are already APPROVED or COMPLETED should only appear via the POA history.
                return s === 'PENDING' || s === 'WAITING' || s === 'PENDING_APPROVAL' || s.startsWith('WAITING') || s === 'PARTIAL';
            })
            .map(item => {
                const mapped = mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap);
                const s = String(item.status || mapped.status || '').toUpperCase();
                // 🎯 Status normalization for actionable rows
                const isActionable = s === 'PENDING' || s === 'WAITING' || s === 'PENDING_APPROVAL' || s.startsWith('WAITING') || s === 'PARTIAL';
                
                return {
                    ...mapped,
                    poa_no: '-', // Raw POs from /po don't have a POA number yet
                    status: (isActionable ? 'PENDING_APPROVAL' : mapped.status) as any
                };
            });
        
        const rejectedPOItems: POListItem[] = rawRejectedPOs.map(item => {
            const mapped = mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap);
            return {
                ...mapped,
                status: 'REJECTED',
                total_amount: 0 // Business rule: Rejected shows 0 in list to avoid confusion
            };
        });

        // ---------------------------------------------------------------------------
        // 4. Deduplicate & Combine (Strict Logic — NO DUPLICATES ALLOWED)
        // ---------------------------------------------------------------------------
        const listMap = new Map<string, POListItem>();
        const seenPoIds = new Set<number>();

        // 4.1 Process Official Approval Records first (Primary Source of truth for status)
        approvalItems.forEach((item: POListItem) => {
            const poaNo = String(item.poa_no || '').trim();
            const poNo = String(item.po_no || '').trim();
            const poId = item.po_id ? Number(item.po_id) : undefined;

            // Use Trimmed POA Number as primary map key, or fallback to trimmed PO Number
            const uniqueKey = (poaNo && poaNo !== '-') ? poaNo : poNo;
            if (uniqueKey) {
                listMap.set(uniqueKey, item);
                if (poId) seenPoIds.add(poId);
            }
        });

        // 4.2 Merge Pending/Rejected POs (Deduplicate only against identical sources)
        [...pendingPOItems, ...rejectedPOItems].forEach((item: POListItem) => {
            const poNo = String(item.po_no || '').trim();
            const poaNo = String(item.poa_no || '').trim();
            const status = String(item.status || '').toUpperCase();

            // 🎯 NEW: Skip DRAFT items
            if (status === 'DRAFT') return;

            // 🎯 AV-Style Key: If it's a "Waiting" round, key by PO. If it's history, key by POA.
            // This allows PO-001 (Waiting) and POA-001 (Partial History) to coexist.
            const isActionRow = !poaNo || poaNo === '-';
            const uniqueKey = isActionRow ? `ACTION-${poNo}` : poaNo;
            
            // 🎯 Filtering Rule: If it's an Action row, check if it should be hidden due to "Full Rejection".
            // Rule: Hide if has REJECTED history but NO PARTIAL/APPROVED history.
            if (isActionRow) {
                const history = approvalItems.filter(h => String(h.po_no || '').trim() === poNo);
                const hasRejected = history.some(h => h.status === 'REJECTED');
                const hasPositive  = history.some(h => h.status === 'PARTIAL' || h.status === 'APPROVED');
                
                if (hasRejected && !hasPositive) {
                    console.log(`[POAService] Hiding Action row for fully rejected PO: ${poNo}`);
                    return;
                }
            }
            
            if (!listMap.has(uniqueKey)) {
                // Ensure unique po_id for React rendering
                const realId = item.po_header_id || item.po_id || 0;
                item.po_id = (poaNo && poaNo !== '-') ? `HIST-${poaNo}-${realId}` : `ACTION-${poNo}-${realId}`;
                
                listMap.set(uniqueKey, item);
            } else {
                console.log(`[POAService] Skipping already-added row for key: ${uniqueKey}`);
            }
        });

        const combinedItems = Array.from(listMap.values());
        
        // 🔍 MEGA DIAGNOSTIC LOG (Finding the 0-item bug)
        console.log(`[POAService] FINAL COMBINED PRE-FILTER: ${combinedItems.length} items`);
        combinedItems.forEach((item, idx) => {
            if (idx < 10) {
                console.log(`[POAService] Item[${idx}] PO: ${item.po_no}, Status: "${item.status}", Type: ${typeof item.status}`);
            }
        });

        // ---------------------------------------------------------------------------
        // 5. Client-Side Filtering & Pagination (Hybrid Fallback)
        // ---------------------------------------------------------------------------
        const filterParams = { ...params };
        if (filterParams.status === 'ALL') delete filterParams.status;

        // Ensure status is compared correctly (trimmed and uppercase)
        if (filterParams.status) {
            filterParams.status = String(filterParams.status).trim().toUpperCase() as any;
        }

        console.log(`[POAService] Applying filter with params:`, JSON.stringify(filterParams));

        const result = applyClientFilters<POListItem>(combinedItems, filterParams as any, {
            searchableFields: ['po_no', 'poa_no', 'vendor_name', 'pr_no', 'qc_no'],
            dateField: 'po_date',
            exactMatchFields: ['status']
        });

        console.log(`[POAService] CLIENT FILTER RESULT: total=${result.total}, data.length=${result.data.length}`);
        if (result.data.length > 0) {
            console.log(`[POAService] Result[0] Status: "${result.data[0].status}"`);
        }

        return result;
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
        
        // 🎯 Support parsing numeric ID from composite strings (ID-xxxxx-REALID)
        let poHeaderId = Number(approvalRes.po_header_id || approvalRes.po_id || (approvalRes.poHeader as any)?.po_header_id || id);
        if (isNaN(poHeaderId)) {
            const idStr = String(id || '');
            if (idStr.includes('-')) {
                const parts = idStr.split('-');
                const lastPart = parts[parts.length - 1];
                if (lastPart && !isNaN(Number(lastPart))) {
                    poHeaderId = Number(lastPart);
                }
            }
        }

        // 1. Fetch Base PO and ALL Approval History for this PO
        let poRes: any = {};
        let allApprovalHistory: any[] = [];
        
        try {
            poRes = await POService.getById(poHeaderId);
            
            // 🎯 Fetch all past approvals for this PO to calculate remaining balances
            const poNo = poRes.po_no || (approvalRes.poHeader as any)?.po_no || approvalRes.po_no;
            if (poNo) {
                const historyRes = await api.get<Record<string, unknown>>(ENDPOINTS.list, { params: { po_no: poNo, limit: 1000 } });
                allApprovalHistory = extractArrayFromResponse(historyRes);
            }
        } catch (error) {
            logger.error(`[POAService] Could not fetch base PO or History for ${poHeaderId}`, error);
        }

        // 2. Calculate Cumulative Approved Quantities per Line
        // Key is po_line_id, value is sum of approved_qty from ALL rounds
        const approvedSumMap: Record<number, number> = {};
        allApprovalHistory.forEach((h: any) => {
            const poaNo = String(h.approval_no || h.poa_no || '');
            // 🎯 CRITICAL: Only count rounds that have a valid POA Number (Officially Approved rounds)
            // If poaNo is '-' or empty, it's either the current pending session or a rejected record from POService mismatch
            if (!poaNo || poaNo === '-') return;

            const hLines = h.po_lines || h.lines || [];
            hLines.forEach((l: any) => {
                const lid = l.po_line_id || l.id;
                if (lid) {
                    approvedSumMap[lid] = (approvedSumMap[lid] || 0) + Number(l.approved_qty || 0);
                }
            });
        });

        // 3. Merge and Enrich Lines
        const parentLines = poRes.po_lines || poRes.poLines || [];
        const poaLinesRaw = approvalRes.po_lines || approvalRes.lines || [];
        const poaLines = (Array.isArray(poaLinesRaw) && poaLinesRaw.length > 0) ? poaLinesRaw : [];
        
        // Use parent lines as base if creating new POV, otherwise use existing POA lines
        const sourceLines = (poaLines.length > 0) ? poaLines : parentLines;

        const finalLines = sourceLines.map((l: any, idx: number) => {
            // Find parent PO line for the official "Ordered Qty"
            const parentLine = (l.po_line_id) 
                ? parentLines.find((pl: any) => pl.id === l.po_line_id || pl.po_line_id === l.po_line_id) 
                : parentLines[idx];
            
            const lid = l.po_line_id || l.id || (parentLine?.id);
            const originalQty = Number(parentLine?.qty ?? parentLine?.qty_ordered ?? l.qty ?? l.qty_ordered ?? 0);
            const prevApproved = Number(approvedSumMap[lid] || 0);
            const remaining = Math.max(0, originalQty - prevApproved);

            return { 
                ...(parentLine || {}), 
                ...l,
                previously_approved_qty: prevApproved,
                remaining_qty: remaining,
                qty: originalQty // Ensure full original qty is available for reference
            };
        });

        const merged: Record<string, any> = {
            ...poRes,
            ...approvalRes,
            po_lines: finalLines,
            poHeader: poRes.poHeader || poRes.po_header || poRes || {},
        };

        const result = mapPOAResponseToListItem(merged, employeeMap, branchMap, taxCodeMap, uomMap);
        
        logger.info(`[POAService] Final Hydrated Result for ${id}:`, {
            po_no: result.po_no,
            remaining_check: result.po_lines?.[0], // Debug first line
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
