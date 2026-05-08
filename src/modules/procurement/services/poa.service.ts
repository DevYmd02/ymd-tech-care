/**
 * @file poa.service.ts
 * @description Service for Purchase Order Approval (POA) module
 */
import api from '@/core/api/api';
import { POService } from './po.service';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import type { POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import { logger } from '@/shared/utils';
import type { SuccessResponse } from '@/shared/types/api.types';
import { extractArrayFromResponse, applyClientFilters } from '@/shared/utils/clientFilterUtils';
import type { FilterValue } from '@/shared/utils/clientFilterUtils';
import type { POStatus } from '@/modules/procurement/schemas/po-schemas';
import { EmployeeService } from '@/modules/master-data/employee/services/employee.service';
import { BranchService } from '@/modules/master-data/company/services/org-branch.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';


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


interface POALineResponse {
    id?: number;
    po_line_id?: number;
    item_id?: number;
    item_code?: string;
    item_name?: string;
    description?: string;
    qty?: number | string;
    qty_ordered?: number | string;
    qty_approved?: number | string;
    approved_qty?: number | string;
    remaining_qty?: number | string;
    quantity?: number | string;
    item_qty?: number | string;
    unit_price?: number | string;
    discount_amount?: number | string;
    discount_amt?: number | string;
    discount_expression?: string;
    uom_id?: number | string;
    uom_name?: string;
    unit_name?: string;
    receipt_type?: string;
    is_approved?: boolean;
    remarks?: string;
    line_remark?: string;
}

interface POHeaderResponse {
    id?: number;
    po_header_id?: number;
    po_id?: number;
    po_no?: string;
    approval_no?: string;
    approval_id?: number;
    poa_no?: string;
    status?: string;
    po_date?: string;
    approval_date?: string;
    vendor_id?: number;
    vendor_name?: string;
    currency_code?: string;
    currencyCode?: string;
    quote_currency_code?: string;
    quoteCurrencyCode?: string;
    quote_currency_rate?: number;
    tax_code_id?: number;
    tax_name?: string;
    tax_rate?: number;
    payment_term_days?: number;
    delivery_date?: string;
    exchange_rate?: number;
    exchangeRate?: number;
    rate?: number;
    created_by?: number | string;
    create_by?: number | string;
    created_by_name?: string;
    preparer_name?: string;
    branch_id?: number | string;
    branch_name?: string;
    po_lines?: POALineResponse[];
    lines?: POALineResponse[];
    poLines?: POALineResponse[];
    base_currency_code?: string;
    target_currency?: string;
    baseCurrencyCode?: string;
    targetCurrency?: string;
    // Nested support for different API versions
    poHeader?: POHeaderResponse;
    po_header?: POHeaderResponse;
    // Additional fields seen in raw responses
    approval_emp_name?: string;
    created_by_id?: number | string;
    created_at?: string;
    total_amount?: number;
    base_total_amount?: number;
    grand_total?: number;
    net_amount?: number;
    net_amt?: number;
    amount?: number;
    total?: number;
}

// ---------------------------------------------------------------------------
// Standard Types for Mapping
// ---------------------------------------------------------------------------
type EmployeeLookupMap = Record<string, string>;
type BranchLookupMap = Record<string, string>;
type TaxCodeLookupMap = Record<string, { tax_code?: string; tax_name: string; tax_rate: number }>;
type UOMLookupMap = Record<string, string>;

/**
 * Standardizes the response from both List and Detail endpoints.
 * Backend often returns nested poHeader or inconsistent field names.
 */
const mapPOAResponseToListItem = (
    item: Record<string, unknown> | POHeaderResponse, 
    employeeMap?: EmployeeLookupMap, 
    branchMap?: BranchLookupMap, 
    taxCodeMap?: TaxCodeLookupMap,
    uomMap?: UOMLookupMap
): POListItem => {
    const poHeader = (item as POHeaderResponse).poHeader || (item as POHeaderResponse).po_header || (item as POHeaderResponse);
    
    // 🎯 PRIORITY: Prefer snake_case (our enriched version) over camelCase (raw backend version)
    const lines = (item.po_lines || item.poLines || poHeader.po_lines || poHeader.poLines || item.lines || []) as POALineResponse[];

    const status = normalizePOStatus(String(item.status || poHeader.status || ''));
    const poaNoValue = String(item.approval_no || item.poa_no || (poHeader as POHeaderResponse).poa_no || (poHeader as POHeaderResponse).approval_no || '-');
    const isHistorical = poaNoValue && poaNoValue !== '-';

    const recovered = {
        tax_name: String(
            (item.tax_name && !['-','undefined'].includes(String(item.tax_name))) ? item.tax_name : 
            (taxCodeMap && (poHeader.tax_code_id || item.tax_code_id) && taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]) ? 
                (taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]?.tax_code || taxCodeMap[String(poHeader.tax_code_id || item.tax_code_id).toLowerCase()]?.tax_name) : 
            (poHeader.tax_name && !['-','undefined'].includes(String(poHeader.tax_name))) ? poHeader.tax_name :
            '-'
        ),
        created_by_name: String(
            (item.approval_emp_name && !['-','undefined'].includes(String(item.approval_emp_name))) ? item.approval_emp_name :
            (employeeMap && item.created_by && employeeMap[String(item.created_by).toLowerCase()]) ? employeeMap[String(item.created_by).toLowerCase()] :
            (employeeMap && poHeader.created_by && employeeMap[String(poHeader.created_by).toLowerCase()]) ? employeeMap[String(poHeader.created_by).toLowerCase()] :
            (employeeMap && item.create_by && employeeMap[String(item.create_by).toLowerCase()]) ? employeeMap[String(item.create_by).toLowerCase()] :
            (employeeMap && poHeader.create_by && employeeMap[String(poHeader.create_by).toLowerCase()]) ? employeeMap[String(poHeader.create_by).toLowerCase()] :
            (employeeMap && item.created_by_id && employeeMap[String(item.created_by_id).toLowerCase()]) ? employeeMap[String(item.created_by_id).toLowerCase()] :
            (item.created_by_name && !['-','undefined'].includes(String(item.created_by_name))) ? item.created_by_name : 
            (poHeader.created_by_name && !['-','undefined'].includes(String(poHeader.created_by_name))) ? poHeader.created_by_name : 
            (item.preparer_name && !['-','undefined'].includes(String(item.preparer_name))) ? item.preparer_name :
            (poHeader.preparer_name && !['-','undefined'].includes(String(poHeader.preparer_name))) ? poHeader.preparer_name :
            '-'
        ),
        branch_name: String(
            (branchMap && item.branch_id && branchMap[String(item.branch_id).toLowerCase()]) ? branchMap[String(item.branch_id).toLowerCase()] :
            (item.branch_name && !['-','undefined'].includes(String(item.branch_name))) ? item.branch_name :
            (poHeader.branch_name && !['-','undefined'].includes(String(poHeader.branch_name))) ? poHeader.branch_name :
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

    const mappedLines = lines.map((l: POALineResponse, idx: number) => {
        const hasApprovalQty = l.approved_qty !== undefined || l.qty_approved !== undefined;
        
        const qty_ordered = isHistorical
            ? Number(l.approved_qty ?? l.qty_approved ?? (hasApprovalQty ? 0 : (l.qty ?? l.qty_ordered ?? 0)))
            : Number(l.approved_qty ?? l.qty_approved ?? l.remaining_qty ?? l.qty_ordered ?? l.qty ?? 0);
        
        const unit_price = Number(l.unit_price ?? (poHeader.po_lines?.[idx] as POALineResponse)?.unit_price ?? 0);
        
        // 🎯 DEEP SCAN FIX: Use parseDiscountAmount to handle percentage strings (e.g. "2%")
        const lineGross = qty_ordered * unit_price;
        const discount_expr = String(l.discount_expression || l.discount_amount || l.discount_amt || '0');
        const disc_amt = parseDiscountAmount(discount_expr, lineGross);

        return {
            ...l,
            id: l.id || l.po_line_id || idx + 1,
            po_line_id: l.po_line_id || l.id,
            qty: Number(l.qty ?? l.qty_ordered ?? 0), 
            qty_ordered,
            unit_price,
            discount_amount: disc_amt,
            discount_expression: discount_expr,
            net_amount: Number(lineGross - disc_amt),
            uom_name: String(
                (l.uom_name && !['-','undefined'].includes(String(l.uom_name))) ? l.uom_name :
                (uomMap && l.uom_id && uomMap[String(l.uom_id).toLowerCase()]) ? uomMap[String(l.uom_id).toLowerCase()] :
                (l.unit_name && !['-','undefined'].includes(String(l.unit_name))) ? l.unit_name :
                (poHeader.po_lines?.[idx] as POALineResponse)?.uom_name || '-'
            ),
            // 🎯 AV PATTERN: Do NOT force is_approved to true if not explicitly set.
            // This allows the form hook to properly filter out non-actionable rows.
            is_approved: l.is_approved !== undefined ? !!l.is_approved : undefined,
            remaining_qty: Number(l.remaining_qty ?? 0)
        };
    });

    const mappedResult: POListItem = {
        ...item,
        po_id: item.approval_id || item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0,
        po_header_id: Number(item.po_header_id || item.po_id || poHeader.po_header_id || poHeader.po_id || 0),
        po_no: String(poHeader.po_no || item.po_no || '-'),
        poa_no: poaNoValue,
        po_date: String(item.approval_date || poHeader.po_date || item.po_date || item.created_at || ''),
        status: (() => {
            const currentStatus = String(item.status || status || 'PENDING_APPROVAL').toUpperCase();
            let normalized = currentStatus === 'PENDING' ? 'PENDING_APPROVAL' : currentStatus;
            if (normalized === 'PENDING_APPROVAL' && poaNoValue && poaNoValue !== '-') {
                normalized = 'APPROVED';
            }
            return normalized as POStatus;
        })(),
        ...recovered,
        po_lines: mappedLines as unknown as import('@/modules/procurement/types').POLine[],
        total_amount: (() => {
            if (status === 'REJECTED') return 0;

            const rate = Number(recovered.exchange_rate || 1);
            
            // 🎯 Line-level calculation (Original Currency)
            const subTotalOriginal = (mappedLines || []).reduce((sum: number, l) => {
                return sum + Number(l.net_amount || 0);
            }, 0);
            const taxRate = Number(recovered.tax_rate ?? 7);
            const totalWithTaxOriginal = subTotalOriginal + (subTotalOriginal * taxRate / 100);
            
            // 🎯 Convert to Base Currency (Baht)
            const calculatedTotalBase = Number((totalWithTaxOriginal * rate).toFixed(2));

            const rawTotalBase = Number(
                item.total_amount ?? 
                item.base_total_amount ?? 
                item.grand_total ?? 
                item.net_amount ?? 
                item.net_amt ?? 
                item.amount ?? 
                item.total ?? 
                0
            );

            // 🎯 FOR HISTORY: Always trust the calculation from lines IF lines exist, 
            // because historical lines in the database are the source of truth for partial rounds.
            // But we MUST use the converted Baht value for the "Baht" column.
            if (isHistorical) {
                 if (calculatedTotalBase > 0) return calculatedTotalBase;
                 
                 // Fallback if lines are missing (list API)
                 const likelyRoundNetOriginal = Number(item.amount || item.net_amount || item.net_amt || 0);
                 if (likelyRoundNetOriginal > 0 && likelyRoundNetOriginal < (rawTotalBase / rate)) {
                     const withTaxBase = (likelyRoundNetOriginal * rate) + (likelyRoundNetOriginal * rate * taxRate / 100);
                     return Number(withTaxBase.toFixed(2));
                 }
            }

            return (rawTotalBase > 0) ? rawTotalBase : (calculatedTotalBase > 0 ? calculatedTotalBase : 0);
        })(),
        base_total_amount: 0, 
    } as unknown as POListItem;
    
    // 🎯 Final Fixup: Sync base_total_amount for UI compatibility
    if (!mappedResult.base_total_amount || mappedResult.base_total_amount === 0) {
        mappedResult.base_total_amount = mappedResult.total_amount;
    }
    
    return mappedResult;
};

const ENDPOINTS = {
    list: '/po-approval',
    detail: (id: number) => `/po-approval/${id}`, // ✅ Dedicated: specific history record
    poDetail: (id: number) => `/po/${id}`, // ✅ FIXED: Standard PO endpoint
    update: (id: number) => `/po/${id}`,
    approve: (id: number) => `/po/${id}/approve`,
    reject: (id: number) => `/po/${id}/reject`,
    submit: '/po-approval',
    bulkApprove: '/po/bulk-approve',
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

        // 2. Build Robust Lookup Maps
        const employeeMap: Record<string, string> = {};
        if (empRes.status === 'fulfilled') {
            const empItems = empRes.value as unknown as Record<string, unknown>[] || [];
            empItems.forEach((emp) => {
                const id = String(emp.employee_pk || emp.employee_id || emp.id || '').toLowerCase();
                if (id) employeeMap[id] = String(emp.employee_fullname || emp.fullname || emp.name || '');
            });
        }

        const branchMap: Record<string, string> = {};
        if (branchRes.status === 'fulfilled') {
            const bValue = branchRes.value as unknown as { items?: Record<string, unknown>[] } | Record<string, unknown>[];
            const bItems = Array.isArray(bValue) ? bValue : (bValue?.items || []);
            bItems.forEach((b) => {
                const id = String(b.branch_pk || b.branch_id || b.id || '').toLowerCase();
                if (id) branchMap[id] = String(b.branch_name || '');
            });
        }

        const taxCodeMap: TaxCodeLookupMap = {};
        if (taxRes.status === 'fulfilled') {
            const taxItems = taxRes.value as unknown as Record<string, unknown>[] || [];
            taxItems.forEach((t) => {
                const id = String(t.tax_id || t.tax_code_id || t.id || '').toLowerCase();
                if (id) taxCodeMap[id] = {
                    tax_code: String(t.tax_code || t.code || ''),
                    tax_name: String(t.tax_name || t.name || ''),
                    tax_rate: Number(t.tax_rate ?? 0)
                };
            });
        }
        
        const uomMap: Record<string, string> = {};
        if (uomRes.status === 'fulfilled') {
            const uValue = uomRes.value as unknown as { items?: Record<string, unknown>[] } | Record<string, unknown>[];
            const uItems = Array.isArray(uValue) ? uValue : (uValue?.items || []);
            uItems.forEach((u) => {
                const id = String(u.uom_id || u.unit_id || u.id || '').toLowerCase();
                if (id) uomMap[id] = String(u.uom_name || u.unit_name || u.name || '');
            });
        }

         // 3. Normalize and Combine
        const approvalItems: POListItem[] = rawApprovalItems.map(item => {
            const mapped = mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap);
            const rawId = Number(item.approval_id || item.id || 0);
            return {
                ...mapped,
                row_key: `approved-${rawId}`,
                po_id: Number(item.po_id || mapped.po_id || 0),
                approval_id: rawId,
            };
        });
        
        const approvedHistoryTotalMap = new Map<string, number>();
        approvalItems.forEach(h => {
            const sum = Number(approvedHistoryTotalMap.get(h.po_no) || 0);
            approvedHistoryTotalMap.set(h.po_no, sum + Number(h.total_amount || 0));
        });

        const pendingPOItems: POListItem[] = rawPendingPOs
            .filter(item => {
                const s = String(item.status || '').toUpperCase();
                return s === 'PENDING' || s === 'WAITING' || s === 'PENDING_APPROVAL' || s.startsWith('WAITING') || s === 'PARTIAL';
            })
            .map(item => {
                const mapped = mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap);
                const rawId = Number(item.po_id || mapped.po_id || 0);
                const poNo = String(mapped.po_no || '');
                
                const historicalSum = approvedHistoryTotalMap.get(poNo) || 0;
                const originalTotal = Number(mapped.total_amount || 0);
                const remTotal      = Math.max(0, originalTotal - historicalSum);

                return {
                    ...mapped,
                    row_key: `pending-${rawId}`,
                    po_id: rawId,
                    poa_no: '-', 
                    status: 'PENDING_APPROVAL' as POStatus,
                    total_amount: remTotal,
                    base_total_amount: remTotal
                };
            });
        
        const rejectedPOItems: POListItem[] = rawRejectedPOs.map(item => {
            const mapped = mapPOAResponseToListItem(item, employeeMap, branchMap, taxCodeMap, uomMap);
            return {
                ...mapped,
                status: 'REJECTED',
                total_amount: 0
            };
        });

        const listMap = new Map<string, POListItem>();
        approvalItems.forEach((item: POListItem) => {
            const poaNo = String(item.poa_no || '').trim();
            const poNo = String(item.po_no || '').trim();
            const uniqueKey = (poaNo && poaNo !== '-') ? poaNo : poNo;
            if (uniqueKey) {
                listMap.set(uniqueKey, item);
            }
        });

        [...pendingPOItems, ...rejectedPOItems].forEach((item: POListItem) => {
            const poNo = String(item.po_no || '').trim();
            const poaNo = String(item.poa_no || '').trim();
            const status = String(item.status || '').toUpperCase();

            if (status === 'DRAFT') return;

            const isActionRow = !poaNo || poaNo === '-';
            const uniqueKey = isActionRow ? `ACTION-${poNo}` : poaNo;
            
            if (isActionRow) {
                const history = approvalItems.filter(h => String(h.po_no || '').trim() === poNo);
                const hasRejected = history.some(h => h.status === 'REJECTED');
                const hasPositive  = history.some(h => h.status === 'PARTIAL' || h.status === 'APPROVED');
                
                if (hasRejected && !hasPositive) {
                    return;
                }
            }
            
            if (!listMap.has(uniqueKey)) {
                listMap.set(uniqueKey, item);
            }
        });

        const combinedItems = Array.from(listMap.values());
        const filterParams = { ...params };
        if (filterParams.status === 'ALL') delete filterParams.status;
        if (filterParams.status) {
            filterParams.status = String(filterParams.status).trim().toUpperCase() as POStatus;
        }
        
        const result = applyClientFilters<POListItem>(combinedItems, filterParams as unknown as Record<string, FilterValue>, {
            searchableFields: ['po_no', 'poa_no', 'vendor_name', 'pr_no', 'qc_no'],
            dateField: 'po_date',
            exactMatchFields: ['status']
        });

        return result;
    },


    getById: async (id: number | string, context?: 'PO' | 'POA'): Promise<POListItem> => {
        logger.info(`[POAService] Fetching POA Detail: ${id}, Context: ${context}`);

        const numericId = Number(id);
        const isHistory = context === 'POA' || (typeof id === 'string' && id.startsWith('approved'));
        const actualId = typeof id === 'string' ? Number(id.replace(/^(approved|pending)-/, '')) : numericId;

        const [res, emps, branches, taxes, uoms] = await Promise.allSettled([
            api.get<Record<string, unknown>>(isHistory ? ENDPOINTS.detail(actualId) : ENDPOINTS.poDetail(actualId)),
            EmployeeService.getAll(),
            BranchService.getList({ limit: 1000 }),
            TaxCodeService.getTaxCodes(),
            UnitService.getAll({ limit: 1000 })
        ]);

        const employeeMap: Record<string, string> = {};
        if (emps.status === 'fulfilled') {
            const empItems = emps.value as unknown as Record<string, unknown>[] || [];
            empItems.forEach((emp) => {
                const eid = String(emp.employee_pk || emp.employee_id || emp.id || '').toLowerCase();
                if (eid) employeeMap[eid] = String(emp.employee_fullname || emp.fullname || emp.name || '');
            });
        }

        const branchMap: Record<string, string> = {};
        if (branches.status === 'fulfilled') {
            const bValue = branches.value as unknown as { items?: Record<string, unknown>[] } | Record<string, unknown>[];
            const bItems = Array.isArray(bValue) ? bValue : (bValue?.items || []);
            bItems.forEach((b) => {
                const bid = String(b.branch_pk || b.branch_id || b.id || '').toLowerCase();
                if (bid) branchMap[bid] = String(b.branch_name || '');
            });
        }

        const taxCodeMap: TaxCodeLookupMap = {};
        if (taxes.status === 'fulfilled') {
            const taxItems = taxes.value as unknown as Record<string, unknown>[] || [];
            taxItems.forEach((t) => {
                const tid = String(t.tax_id || t.tax_code_id || t.id || '').toLowerCase();
                if (tid) taxCodeMap[tid] = {
                    tax_code: String(t.tax_code || t.code || ''),
                    tax_name: String(t.tax_name || t.name || ''),
                    tax_rate: Number(t.tax_rate ?? 0)
                };
            });
        }
        
        const uomMap: Record<string, string> = {};
        if (uoms.status === 'fulfilled') {
            const uValue = uoms.value as unknown as { items?: Record<string, unknown>[] } | Record<string, unknown>[];
            const uItems = Array.isArray(uValue) ? uValue : (uValue?.items || []);
            uItems.forEach((u) => {
                const uid = String(u.uom_id || u.unit_id || u.id || '').toLowerCase();
                if (uid) uomMap[uid] = String(u.uom_name || u.unit_name || u.name || '');
            });
        }

        const approvalRes = (res.status === 'fulfilled' ? res.value : {}) as POHeaderResponse;
        let poHeaderId = Number(approvalRes.po_header_id || approvalRes.po_id || (approvalRes.poHeader as POHeaderResponse)?.po_header_id || actualId);
        if (!isHistory && poHeaderId === 0) poHeaderId = actualId;

        let poRes: POListItem = {} as POListItem;
        let allApprovalHistory: Record<string, unknown>[] = [];
        
        try {
            poRes = await POService.getById(poHeaderId);
            const poNo = poRes.po_no || (approvalRes.poHeader as POHeaderResponse)?.po_no || approvalRes.po_no;
            if (poNo && poNo !== '-') {
                const historyRes = await api.get<Record<string, unknown>>(ENDPOINTS.list, { params: { po_no: poNo, limit: 1000 } });
                const rawHistory = extractArrayFromResponse<Record<string, unknown>>(historyRes);
                
                allApprovalHistory = rawHistory.filter((h) => 
                    String((h as POHeaderResponse).poHeader?.po_no || (h as POHeaderResponse).po_no || '').trim() === String(poNo || '').trim()
                ) as Record<string, unknown>[];
            }
        } catch (error) {
            logger.error(`[POAService] Could not fetch base PO or History for ${poHeaderId}`, error);
        }

        const currentRoundId = Number(id || approvalRes.id || 0);
        const currentPoaNo   = String(approvalRes.approval_no || approvalRes.poa_no || '').trim();
        
        const approvedSumMap: Record<string, number> = {};
        const seenHistoryIds = new Set<number>();

        const poHeaderDetail = (approvalRes.poHeader as POHeaderResponse) || (approvalRes.po_header as POHeaderResponse) || approvalRes || {};
        const parentLines = poRes.po_lines || [];
        const poaLinesRaw = approvalRes.po_lines || poHeaderDetail.po_lines || approvalRes.lines || [];
        const poaLines = Array.isArray(poaLinesRaw) ? poaLinesRaw : [];

        const parentIdMap = new Map<string, Record<string, unknown>>();
        const parentCodeMap = new Map<string, Record<string, unknown>>();
        parentLines.forEach((p) => {
            const pid = String(p.po_line_id || p.id || '');
            if (pid) parentIdMap.set(pid, p as unknown as Record<string, unknown>);
            if (p.item_code) parentCodeMap.set(String(p.item_code), p as unknown as Record<string, unknown>);
        });

        allApprovalHistory.forEach((h) => {
            const hId   = Number(h.id || 0);
            const poaNo = String(h.approval_no || h.poa_no || '').trim();

            if (hId > 0 && hId === currentRoundId) return;
            if (poaNo && poaNo !== '-' && poaNo === currentPoaNo) return;
            if (hId > 0 && seenHistoryIds.has(hId)) return;
            if (hId > 0) seenHistoryIds.add(hId);

            if (!poaNo || poaNo === '-') return;

            const hLines = (h.po_lines || h.lines || []) as Record<string, unknown>[];
            hLines.forEach((l) => {
                let lid = String(l.po_line_id || l.id || '');
                
                if (!parentIdMap.has(lid) && l.item_code) {
                    const matchByCode = parentCodeMap.get(String(l.item_code));
                    if (matchByCode) lid = String(matchByCode.po_line_id || matchByCode.id || '');
                }
                
                if (lid && parentIdMap.has(lid)) {
                    approvedSumMap[lid] = (approvedSumMap[lid] || 0) + Number(l.approved_qty || l.qty_approved || 0);
                }
            });
        });
        
        const sourceLines = (poaLines.length > 0) ? poaLines : parentLines;

        const finalLines = (sourceLines as Record<string, unknown>[]).map((l: Record<string, unknown>, idx: number) => {
            const lid = String(l.po_line_id || l.id || '');
            
            let parentLine = parentIdMap.get(lid);
            if (!parentLine && l.item_code) parentLine = parentCodeMap.get(String(l.item_code));
            if (!parentLine) parentLine = parentLines[idx] as unknown as Record<string, unknown>;
            
            const originalQty = Number(parentLine?.qty ?? parentLine?.qty_ordered ?? l.qty ?? l.qty_ordered ?? 0);
            
            const enriched = {
                ...l,
                item_code: l.item_code || parentLine?.item_code || '-',
                product_code: l.item_code || parentLine?.item_code || '-',
                item_name: l.item_name || parentLine?.item_name || l.description || parentLine?.description || '-',
                uom_name: l.uom_name || parentLine?.uom_name || '-',
                qty: originalQty,
            };

            if (isHistory) {
                const poaQty = Number(l.approved_qty ?? l.qty_approved ?? 0);
                return {
                    ...enriched,
                    qty_ordered: poaQty,
                    is_processed: true,
                    remaining_qty: 0,
                    is_approved: true
                };
            }

            const actualLid = lid || (parentLine ? String(parentLine.po_line_id || parentLine.id || '') : '');
            const approvedSoFar = actualLid ? (approvedSumMap[actualLid] || 0) : 0;
            const remQty = Math.max(0, originalQty - approvedSoFar);
            
            const existingQty = Number(l.approved_qty || l.qty_approved || l.qty_ordered || 0);
            const defaultQty  = (existingQty > 0) ? existingQty : Math.max(0, remQty);

            return {
                ...enriched,
                remaining_qty: remQty,
                qty_ordered: defaultQty,
                is_processed: remQty <= 0
            };
        });

        const sanitizedPoRes = isHistory ? {
            ...poRes,
            total_amount: undefined,
            base_total_amount: undefined,
            grand_total: undefined,
            net_amount: undefined,
            net_amt: undefined,
            amount: undefined,
            total: undefined,
        } : poRes;

        const finalApprovalRes = { ...approvalRes };
        const finalPoRes       = { ...sanitizedPoRes };
        
        delete (finalApprovalRes as Record<string, unknown>).po_lines;
        delete (finalApprovalRes as Record<string, unknown>).lines;
        delete (finalPoRes as Record<string, unknown>).po_lines;
        delete (finalPoRes as Record<string, unknown>).lines;

        const merged: Record<string, unknown> = {
            ...finalPoRes,
            ...finalApprovalRes,
            po_lines: finalLines,
            poHeader: (sanitizedPoRes as POHeaderResponse).poHeader || (sanitizedPoRes as POHeaderResponse).po_header || sanitizedPoRes || {},
        };

        const result = mapPOAResponseToListItem(merged, employeeMap, branchMap, taxCodeMap, uomMap);
        return result;
    },

    update: async (id: number, data: Partial<POAFormData>): Promise<SuccessResponse> => {
        return await api.put<SuccessResponse>(ENDPOINTS.update(id), data);
    },

    approve: async (id: number): Promise<SuccessResponse> => {
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), {});
    },

    reject: async (id: number, reject_reason?: string): Promise<SuccessResponse> => {
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { reject_reason });
    },

    submitApproval: async (data: POAApprovalPayload): Promise<SuccessResponse> => {
        return await api.post<SuccessResponse>(ENDPOINTS.submit, data);
    },
    
    bulkApprove: async (ids: number[]): Promise<SuccessResponse[]> => {
        const results = [];
        for (const id of ids) {
            results.push(await POAService.approve(id));
        }
        return results;
    }
};
