import api from '@core/api/api';
import { logger } from '@utils';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';
import type { ReservationFormData } from '../types/reservation.types';

export interface ReservationListParams {
    reservation_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

interface RawDetail extends Record<string, unknown> {
    sq_no?: string;
    aq_no?: string;
    sq_id?: string | number;
    aq_id?: string | number;
    customer_id?: string | number;
    branch_id?: string | number;
    project_id?: string | number;
    reservation_date?: string;
    exchange_rate_date?: string;
    quote_currency_code?: string;
    currency_code?: string;
    base_currency_code?: string;
    is_multicurrency?: string | boolean;
    sub_total?: number | string;
    base_sub_total?: number | string;
    discount_amount?: number | string;
    base_discount_amount?: number | string;
    vat_amount?: number | string;
    base_vat_amount?: number | string;
    total_amount?: number | string;
    base_total_amount?: number | string;
    emp_dept_id?: string | number;
    emp_sale_id?: string | number;
    sale_area_id?: string | number;
    tax_code_id?: string | number;
    sq?: { sq_no?: string };
    aq?: { aq_no?: string };
    saleReservationLines?: Record<string, unknown>[];
    lines?: Record<string, unknown>[];
}

/**
 * Interface representing the header data for a Reservation in list views
 */
export interface ReservationHeader {
    id?: string | number;
    reservation_id: string | number;
    reservation_no: string;
    reservation_date: string;
    customer_id: number | string;
    customer_name?: string;
    customer_code?: string;
    base_total_amount?: number;
    quote_total_amount?: number;
    base_currency_code?: string;
    quote_currency_code?: string;
    currency?: string;
    exchange_rate?: number;
    status: 'DRAFT' | 'CONFIRMED' | 'POSTED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
    branch_name?: string;
    rawData?: Record<string, unknown>;
}

export interface AvailableApproval {
    aq_id: number;
    aq_no: string;
    aq_date: string;
    aq_status?: string;
    status?: string;
    sq_id: number;
    sq_no?: string;   // May be missing if API does not JOIN sq table
    sq_date?: string; // May be missing if API does not JOIN sq table
    sq_status?: string;
    // Nested sq object (some APIs return sq data nested)
    sq?: {
        sq_no?: string;
        sq_date?: string;
        sq_id?: number;
        status?: string;
        customer_name?: string;
        customer_id?: number;
    };
    // Common fields found in the API response
    currency_code?: string;
    base_currency_code?: string;
    quote_currency_code?: string;
    exchange_rate?: number;
    exchange_rate_date?: string;
    aq_lines?: unknown[];
    lines?: unknown[];
    [key: string]: unknown; // Capture extra fields from API
}

const cleanRefNo = (val: unknown): string => {
    if (val === undefined || val === null) return '';
    const s = String(val).trim();
    if (s === 'null' || s === 'undefined' || s === '' || s === '-') return '';
    return s;
};

const toISODateString = (dateVal: unknown): string | null => {
    if (!dateVal) return null;
    const s = String(dateVal).trim();
    if (!s || s === 'null' || s === 'undefined' || s === '-') return null;
    
    if (s.includes('T')) return new Date(s).toISOString();
    
    const parts = s.split('-');
    if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month, day).toISOString();
        }
    }
    return new Date(s).toISOString();
};

const safeNumber = (val: unknown): number => {
    if (val === undefined || val === null || val === '') return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const safeNumberOrNull = (val: unknown): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
};

interface DocRefConfig {
    noFields: string[];
    idFields: string[];
    nestedKeys: string[];
}

const SQ_CONFIG: DocRefConfig = {
    noFields: [
        'sq_no', 'sale_quotation_no', 'quotation_no',
        'ref_sq_no', 'sqNo'
    ],
    idFields: [
        'sq_id', 'sale_quotation_id',
        'quotation_id', 'sqNoId'
    ],
    nestedKeys: [
        'sq_header', 'sq', 'sale_quotation',
        'quotation', 'sale_quotation_header',
        'aq', 'sale_quotation_approval',
        'approval', 'aq_header'
    ]
};

const AQ_CONFIG: DocRefConfig = {
    noFields: [
        'aq_no', 'sale_quotation_approval_no',
        'quotation_approval_no', 'ref_aq_no', 'aqNo'
    ],
    idFields: [
        'aq_id', 'sale_quotation_approval_id',
        'approval_id', 'aqNoId'
    ],
    nestedKeys: [
        'aq', 'sale_quotation_approval',
        'approval', 'aq_header'
    ]
};

const findDocRef = (
    obj: unknown,
    config: DocRefConfig
): { no?: string; id?: string } => {
    if (!obj || typeof obj !== 'object') return {};
    const record = obj as Record<string, unknown>;

    const no = cleanRefNo(
        config.noFields
            .map(f => record[f])
            .find(v => v !== undefined && v !== null && v !== '')
    );

    const id = config.idFields
        .map(f => record[f])
        .find(v => v !== undefined && v !== null);

    if (no) {
        return { no, id: id ? String(id) : undefined };
    }

    for (const key of config.nestedKeys) {
        if (record[key] && typeof record[key] === 'object') {
            const res = findDocRef(record[key], config);
            if (res.no) {
                return {
                    no: res.no,
                    id: id ? String(id) : res.id
                };
            }
        }
    }

    return {};
};

const handleMutationError = (
    action: string,
    error: unknown,
    payload?: unknown
): never => {
    const err = error as {
        response?: { data?: unknown; status?: number };
        message: string;
    };
    logger.error(`Failed to ${action}:`, {
        message: err.message,
        details: err.response?.data,
        status: err.response?.status,
        ...(payload ? { payload } : {})
    });
    throw error;
};

export const ReservationService = {
    getList: async (params: ReservationListParams = {}) => {
        logger.debug('Fetching reservations with params:', params);
        try {
            const response = await api.get<{ data: ReservationHeader[], total: number } | ReservationHeader[]>('/sale-reservation', { params });
            if (Array.isArray(response)) {
                return { data: response, total: response.length };
            }
            return {
                data: response.data || [],
                total: response.total || 0
            };
        } catch (error) {
            logger.error('Failed to fetch reservations:', error);
            return { data: [], total: 0 };
        }
    },

    /**
     * ดึงข้อมูล Reservation รายใบ
     */
    getById: async (id: string): Promise<ReservationFormData | null> => {
        logger.debug('Fetching reservation by id:', id);
        try {
            const response = await api.get<RawDetail>(`/sale-reservation/${id}`);
            
            if (response) {
                // 🕵️ Structured Discovery: Find Reference Numbers
                let rRaw = response as Record<string, unknown>;
                if (rRaw['data'] && typeof rRaw['data'] === 'object' && !Array.isArray(rRaw['data'])) {
                    rRaw = rRaw['data'] as Record<string, unknown>;
                }
                const r = (rRaw['sale_reservation'] || rRaw['reservation_header'] || rRaw['reservation'] || rRaw['header'] || rRaw) as Record<string, unknown>;

                // Discover nested SQ and AQ info recursively
                // Discover nested SQ, AQ, and SO info recursively
                const sqDiscovered = findDocRef(r, SQ_CONFIG) || findDocRef(rRaw, SQ_CONFIG);
                const aqDiscovered = findDocRef(r, AQ_CONFIG) || findDocRef(rRaw, AQ_CONFIG);

                if (sqDiscovered.no) r.sq_no = sqDiscovered.no;
                if (sqDiscovered.id && !r.sq_id) r.sq_id = sqDiscovered.id;
                if (aqDiscovered.no) r.aq_no = aqDiscovered.no;
                if (aqDiscovered.id && !r.aq_id) r.aq_id = aqDiscovered.id;

                // Discover linked SO (Sales Order)
                const SO_CONFIG = {
                    noFields: ['so_no', 'sale_order_no', 'order_no', 'ref_so_no'],
                    idFields: ['so_id', 'sale_order_id', 'order_id'],
                    nestedKeys: ['so', 'sale_order', 'order']
                };
                const soDiscovered = findDocRef(r, SO_CONFIG) || findDocRef(rRaw, SO_CONFIG);
                if (soDiscovered.no) r.so_no = soDiscovered.no;
                if (soDiscovered.id && !r.so_id) r.so_id = soDiscovered.id;

                // Clean existing SQ/AQ/SO reference numbers first to handle parsed "null" or "undefined" strings
                r.sq_no = cleanRefNo(r.sq_no || rRaw.sq_no);
                r.aq_no = cleanRefNo(r.aq_no || rRaw.aq_no);
                r.so_no = cleanRefNo(r.so_no || rRaw.so_no);
                rRaw.sq_no = r.sq_no;
                rRaw.aq_no = r.aq_no;
                rRaw.so_no = r.so_no;

                const sqId = (r.sq_id || r.sale_quotation_id || r.quotation_id || r.sq_header_id || rRaw.sq_id) as string | number | undefined;
                
                // If SQ ID exists but number is missing, fetch it
                if (!r.sq_no && sqId) {
                    try {
                        const sqRes = await api.get<unknown>(`/sale-quotation/${sqId}`);
                        if (sqRes) {
                            const d = ((sqRes as Record<string, unknown>)?.data || (sqRes as Record<string, unknown>)?.rawData || sqRes) as Record<string, unknown>;
                            const foundSqNo = cleanRefNo(d.sq_no || d.sqNo || d.sale_quotation_no || d.sq_number || d.code || d.no);
                            if (foundSqNo) {
                                r.sq_no = foundSqNo;
                            } else {
                                const discovered = findDocRef(d, SQ_CONFIG);
                                if (discovered.no) r.sq_no = discovered.no;
                            }
                        }
                    } catch (err) {
                        logger.debug('Failed to fetch quotation details for SQ ID:', sqId, err);
                    }
                }

                // If AQ ID exists and either AQ number or SQ number is missing, fetch the AQ to resolve both
                const aqId = (r.aq_id || r.aq_header_id || r.approval_id || r.sale_quotation_approval_id || rRaw.aq_id) as string | number | undefined;
                if ((!r.aq_no || !r.sq_no) && aqId) {
                    try {
                        // 1. Try Available Approvals (Fastest)
                        const aqs = await ReservationService.getAvailableApprovals();
                        const match = aqs.find((a) => String(a.aq_id) === String(aqId) || (sqId && String(a.sq_id) === String(sqId)));
                        if (match) {
                            if (!r.aq_no) {
                                const matchAq = findDocRef(match, AQ_CONFIG);
                                if (matchAq.no) r.aq_no = matchAq.no;
                            }
                            if (!r.sq_no) {
                                const matchSq = findDocRef(match, SQ_CONFIG);
                                if (matchSq.no) r.sq_no = matchSq.no;
                            }
                            if (!r.sq_id && match.sq_id) {
                                r.sq_id = String(match.sq_id);
                            }
                        } else {
                            // 2. Try the general approval list (since direct ID fetch is not supported and returns 404)
                            const listRes = await api.get<unknown>('/sale-quotation-approval', { params: { limit: 1000, page: 1 }, skipToast: true });
                            const items = extractArrayFromResponse<Record<string, unknown>>(listRes as object);
                            
                            const listMatch = items.find((item) => {
                                const itemAqId = findDocRef(item, AQ_CONFIG).id || item.aq_id || item.id || item.sale_quotation_approval_id;
                                const itemSqId = findDocRef(item, SQ_CONFIG).id || item.sq_id;
                                return String(itemAqId) === String(aqId) || (sqId && String(itemSqId) === String(sqId));
                            });
                            
                            if (listMatch) {
                                if (!r.aq_no) {
                                    const matchAq = findDocRef(listMatch, AQ_CONFIG);
                                    if (matchAq.no) r.aq_no = matchAq.no;
                                }
                                if (!r.sq_no) {
                                    const matchSq = findDocRef(listMatch, SQ_CONFIG);
                                    if (matchSq.no) r.sq_no = matchSq.no;
                                }
                                if (!r.sq_id) {
                                    const matchSq = findDocRef(listMatch, SQ_CONFIG);
                                    if (matchSq.id) r.sq_id = matchSq.id;
                                }
                            }
                        }
                    } catch (err) {
                        logger.debug('Failed to fetch and resolve AQ/SQ details:', err);
                    }
                }

                // Sync values back to raw data to ensure UI form reads them correctly
                rRaw.sq_no = r.sq_no;
                rRaw.aq_no = r.aq_no;
                rRaw.so_no = r.so_no;
                
                // 📅 Date Formatting
                if (r.reservation_date) r.reservation_date = String(r.reservation_date).split('T')[0];
                if (r.exchange_rate_date) r.exchange_rate_date = String(r.exchange_rate_date).split('T')[0];

                // 💰 Multicurrency Logic
                const qcc = r.quote_currency_code || r.currency_code || 'THB';
                const bcc = r.base_currency_code || 'THB';
                r.currency_code = qcc;
                r.base_currency_code = bcc;
                r.quote_currency_code = qcc;
                
                const explicitFlag = r.is_multicurrency;
                const isExplicitlyFalse = explicitFlag === 'N' || explicitFlag === false;
                
                r.isMulticurrency = (qcc !== bcc && qcc !== 'THB') || 
                                           explicitFlag === 'Y' || 
                                           explicitFlag === true || 
                                           (!isExplicitlyFalse && (explicitFlag === undefined || explicitFlag === null || explicitFlag === ''));

                if (r.project_id) r.job_id = String(r.project_id);

                // 💵 Summary Mapping
                r.sub_total = safeNumber(r.sub_total || r.base_sub_total || 0);
                r.discount_amount = safeNumber(r.discount_amount || r.base_discount_amount || 0);
                r.discount_input = String(r.discount_expression || r.discount_input || (r.discount_amount ? String(r.discount_amount) : ''));
                r.vat_amount = safeNumber(r.vat_amount || r.base_vat_amount || 0);
                r.total_amount = safeNumber(r.total_amount || r.base_total_amount || 0);

                const idFields = ['sq_id', 'aq_id', 'so_id', 'customer_id', 'branch_id', 'emp_dept_id', 'emp_sale_id', 'sale_area_id', 'tax_code_id'];
                idFields.forEach(f => {
                    if (r[f]) r[f] = String(r[f]);
                });

                // Copy critical fields from r to rRaw if r !== rRaw
                if (r !== rRaw) {
                    const criticalFields = [
                        'reservation_no', 'reservation_date', 'sq_id', 'sq_no', 'aq_id', 'aq_no', 'so_id', 'so_no',
                        'customer_id', 'branch_id', 'payment_term_days', 'ship_days',
                        'emp_dept_id', 'tax_code_id', 'emp_sale_id', 'sale_area_id', 'job_id',
                        'remarks', 'status', 'onhold', 'status_remark', 'sub_total', 'discount_amount',
                        'discount_input', 'vat_amount', 'total_amount', 'isMulticurrency',
                        'base_currency_code', 'quote_currency_code', 'currency_code', 'exchange_rate',
                        'exchange_rate_date'
                    ];
                    criticalFields.forEach(field => {
                        if (r[field] !== undefined) rRaw[field] = r[field];
                    });
                }
                
                // 🛠️ Line Mapping with Batch Enrichment (Fixes N+1 Waterfall)
                const rawLines = (r.saleReservationLines || r.lines || rRaw.saleReservationLines || rRaw.lines || []) as Record<string, unknown>[];
                if (Array.isArray(rawLines) && rawLines.length > 0) {
                    // 1. Collect unique IDs for batch fetching
                    const uniqueItemIds = [...new Set(rawLines
                        .map(l => {
                            const itemObj = (l.item || l.item_master || l.master_item || l.product || {}) as Record<string, unknown>;
                            return String(l.item_id || itemObj.item_id || itemObj.id || '');
                        })
                        .filter(id => !!id)
                    )];

                    const uniqueLotIds = [...new Set(rawLines
                        .map(l => {
                            const lotIdVal = l.lot_id;
                            if (lotIdVal && (typeof lotIdVal === 'number' || typeof lotIdVal === 'string')) return String(lotIdVal);
                            const lotObj = (l.lot || l.item_lot || {}) as Record<string, unknown>;
                            return String(lotObj.lot_id || lotObj.id || '');
                        })
                        .filter(id => !!id && !isNaN(Number(id)))
                    )];

                    // 2. Fetch all required Master Data in parallel (Batch)
                    const [itemsMap, lotsMap] = await Promise.all([
                        (async () => {
                            const map: Record<string, { code: string; name: string }> = {};
                            if (uniqueItemIds.length === 0) return map;
                            try {
                                // Fetch only the required item IDs in a single batch
                                const itemsRes = await api.get<unknown>('/item-master', { params: { ids: uniqueItemIds, limit: uniqueItemIds.length } });
                                const itemsData = (Array.isArray(itemsRes) 
                                    ? itemsRes 
                                    : ((itemsRes as Record<string, unknown>)?.data || (itemsRes as Record<string, unknown>)?.items || [])) as Record<string, unknown>[];
                                itemsData.forEach(item => {
                                    const id = String(item.item_id || item.id || '');
                                    if (id) map[id] = { 
                                        code: String(item.item_code || item.code || ''), 
                                        name: String(item.item_name || item.name || '') 
                                    };
                                });
                            } catch (err) {
                                logger.error('Batch Item fetch failed, trying fallback list lookup:', err);
                                // Defensive Fallback to a limit lookup if the batch ids parameter has an issue
                                try {
                                    const itemsRes = await api.get<unknown>('/item-master', { params: { limit: 200 } });
                                    const itemsData = (Array.isArray(itemsRes) 
                                        ? itemsRes 
                                        : ((itemsRes as Record<string, unknown>)?.data || (itemsRes as Record<string, unknown>)?.items || [])) as Record<string, unknown>[];
                                    itemsData.forEach(item => {
                                        const id = String(item.item_id || item.id || '');
                                        if (id) map[id] = { 
                                            code: String(item.item_code || item.code || ''), 
                                            name: String(item.item_name || item.name || '') 
                                        };
                                    });
                                } catch { /* ignore */ }
                            }
                            return map;
                        })(),
                        (async () => {
                            const map: Record<string, string> = {};
                            if (uniqueLotIds.length === 0) return map;
                            try {
                                // Fetch only the required lot IDs in a single batch
                                const lotsRes = await api.get<unknown>('/item-lot', { params: { ids: uniqueLotIds, limit: uniqueLotIds.length } });
                                const lotsData = (Array.isArray(lotsRes) 
                                    ? lotsRes 
                                    : ((lotsRes as Record<string, unknown>)?.data || (lotsRes as Record<string, unknown>)?.items || [])) as Record<string, unknown>[];
                                lotsData.forEach(lot => {
                                    const id = String(lot.lot_id || lot.id || '');
                                    if (id) map[id] = String(lot.lot_no || lot.code || '');
                                });
                            } catch (err) {
                                logger.error('Batch Lot fetch failed, trying fallback list lookup:', err);
                                // Defensive Fallback
                                try {
                                    const lotsRes = await api.get<unknown>('/item-lot', { params: { limit: 200 } });
                                    const lotsData = (Array.isArray(lotsRes) 
                                        ? lotsRes 
                                        : ((lotsRes as Record<string, unknown>)?.data || (lotsRes as Record<string, unknown>)?.items || [])) as Record<string, unknown>[];
                                    lotsData.forEach(lot => {
                                        const id = String(lot.lot_id || lot.id || '');
                                        if (id) map[id] = String(lot.lot_no || lot.code || '');
                                    });
                                } catch { /* ignore */ }
                            }
                            return map;
                        })()
                    ]);

                    // 3. Map lines with enriched data from maps
                    rRaw.lines = rawLines.map((l: Record<string, unknown>) => {
                        const itemObj = (l.item || l.item_master || l.master_item || l.product || {}) as Record<string, unknown>;
                        const itemId = String(l.item_id || itemObj.item_id || itemObj.id || '');
                        
                        let itemCode = String(l.item_code || l.code || itemObj.item_code || itemObj.code || itemObj.sku || '');
                        let itemName = String(l.item_name || l.name || itemObj.item_name || itemObj.name || itemObj.description || '');

                        // Enrich from map if missing
                        if ((!itemCode || !itemName) && itemId && itemsMap[itemId]) {
                            itemCode = itemCode || itemsMap[itemId].code;
                            itemName = itemName || itemsMap[itemId].name;
                        }

                        // Final fallback for name
                        if (!itemName && itemId) itemName = `[Item ID: ${itemId}]`;

                        const lotIdVal = l.lot_id;
                        const lotObj = (typeof lotIdVal === 'object' && lotIdVal !== null) ? (lotIdVal as Record<string, unknown>) : ((l.lot || l.item_lot || {}) as Record<string, unknown>);
                        let lotNo = String(l.lot_no || l.lot_number || lotObj.lot_no || lotObj.code || '');
                        const effectiveLotId = (typeof lotIdVal === 'number' || typeof lotIdVal === 'string') ? String(lotIdVal) : String(lotObj.lot_id || lotObj.id || '');
                        
                        // Enrich lot from map
                        if (!lotNo && effectiveLotId && lotsMap[effectiveLotId]) {
                            lotNo = lotsMap[effectiveLotId];
                        }

                        return {
                            ...l,
                            id: String(l.reservation_line_id || l.id || ''),
                            item_id: itemId,
                            item_code: itemCode,
                            item_name: itemName,
                            uom_id: (() => {
                                const itemUomObj = (l.item_uom || l.uom || {}) as Record<string, unknown>;
                                const fromUomObj = (itemUomObj.from_uom || itemUomObj.fromUom || {}) as Record<string, unknown>;
                                return String(fromUomObj.uom_id || fromUomObj.id || l.uom_id || '');
                            })(),
                            item_uom_id: (() => {
                                const itemUomObj = (l.item_uom || l.uom || {}) as Record<string, unknown>;
                                return Number(itemUomObj.item_uom_id || itemUomObj.id || l.uom_id || 0);
                            })(),
                            uom_name: String(l.uom_name || (() => {
                                const itemUomObj = (l.item_uom || l.uom || {}) as Record<string, unknown>;
                                const fromUomObj = (itemUomObj.from_uom || itemUomObj.fromUom || {}) as Record<string, unknown>;
                                return fromUomObj.uom_name || itemUomObj.uom_name || '';
                            })() || ''),
                            warehouse_id: String(l.warehouse_id || ''),
                            location_id: String(l.location_id || ''),
                            lot_no: lotNo,
                            lot_id: (typeof lotIdVal === 'object' && lotIdVal !== null) 
                                ? String((lotIdVal as Record<string, unknown>).id || (lotIdVal as Record<string, unknown>).lot_id || '') 
                                : (lotIdVal ? String(lotIdVal) : undefined),
                            line_discount_input: String(l.discount_expression || l.line_discount_input || '0'),
                            qty_reserved: Number(l.qty_reserved !== undefined ? l.qty_reserved : (l.qty !== undefined ? l.qty : 0)),
                            lot_available_qty: (() => {
                                const lotObj = (typeof lotIdVal === 'object' && lotIdVal !== null) 
                                    ? (lotIdVal as Record<string, unknown>) 
                                    : ((l.lot || l.item_lot || {}) as Record<string, unknown>);
                                const balances = (l.lot_balances || lotObj.lot_balances || lotObj.balances || []) as Record<string, unknown>[];
                                const bal = balances[0] || {};
                                return Number(
                                    l.lot_available_qty ?? 
                                    l.available_qty ?? 
                                    bal.qty_available ??
                                    bal.balance_qty ??
                                    lotObj.qty_available ?? 
                                    lotObj.available_qty ?? 
                                    lotObj.qty_on_hand ??
                                    lotObj.on_hand_qty ?? 
                                    l.qty_available ?? 
                                    1000000 // safe fallback to prevent false validation warning
                                );
                            })(),
                            line_discount: Number(l.discount_amount || l.line_discount || 0),
                            line_total: Number(l.net_amount || l.line_total || 0),
                            price_source: l.price_source !== undefined ? Number(l.price_source) : undefined,
                            price_source_name: String(l.price_source_name || ''),
                            price_level_priority: l.price_level_priority !== undefined ? Number(l.price_level_priority) : undefined,
                        };
                    });
                } else {
                    rRaw.lines = [];
                }
                return rRaw as unknown as ReservationFormData;
            }

            return null;
        } catch (error) {
            logger.error('Failed to fetch reservation detail:', error);
            return null;
        }
    },

    /**
     * ดึงรายการใบเสนอราคาที่อนุมัติแล้ว (AQ) เพื่อนำมาทำใบสั่งจอง
     */
    getAvailableApprovals: async (): Promise<AvailableApproval[]> => {
        try {
            const response = await api.get<unknown>('/sale-reservation/available-approvals');
            // Handle both direct array and paginated { data: [...] } responses
            if (Array.isArray(response)) return response as AvailableApproval[];
            const r = response as Record<string, unknown>;
            if (Array.isArray(r?.data)) return r.data as AvailableApproval[];
            return [];
        } catch (error) {
            logger.error('Failed to fetch available approvals:', error);
            return [];
        }
    },

    /**
     * Helper to clean data before sending to API
     */
    sanitizeData: (data: ReservationFormData | Partial<ReservationFormData>, isUpdate = false) => {
        const raw = { ...data } as Record<string, unknown>;
        
        // Root Level Mapping
        const cleaned: Record<string, unknown> = {
            reservation_date: toISODateString(raw.reservation_date),
            sq_id: safeNumberOrNull(raw.sq_id),
            aq_id: safeNumberOrNull(raw.aq_id),
            customer_id: safeNumberOrNull(raw.customer_id),
            branch_id: safeNumberOrNull(raw.branch_id),
            status: raw.status || 'DRAFT',
            ship_days: safeNumber(raw.ship_days),
            remarks: raw.remarks || '',
            payment_term_days: safeNumber(raw.payment_term_days),
            onhold: raw.onhold || 'N',
            emp_sale_id: safeNumberOrNull(raw.emp_sale_id),
            sale_area_id: safeNumberOrNull(raw.sale_area_id),
            emp_dept_id: safeNumberOrNull(raw.emp_dept_id),
            project_id: raw.job_id ? safeNumberOrNull(raw.job_id) : safeNumberOrNull(raw.project_id),
            status_remark: raw.status_remark || '',
            base_currency_code: raw.base_currency_code || raw.currency_code || 'THB',
            quote_currency_code: raw.quote_currency_code || raw.currency_code || 'THB',
            exchange_rate: safeNumber(raw.exchange_rate || 1),
            exchange_rate_date: toISODateString(raw.exchange_rate_date) || toISODateString(raw.reservation_date),
            tax_code_id: safeNumberOrNull(raw.tax_code_id),
            discount_expression: (raw.discount_input as string) || '0',
        };

        // Lines Mapping: Frontend 'lines' -> Backend 'saleReservationLines'
        const rawLines = (raw.lines || []) as Record<string, unknown>[];
        cleaned.saleReservationLines = rawLines.map((line: Record<string, unknown>) => {
            const l: Record<string, unknown> = {
                item_id: safeNumberOrNull(line.item_id),
                warehouse_id: safeNumberOrNull(line.warehouse_id),
                location_id: safeNumberOrNull(line.location_id),
                lot_id: safeNumberOrNull(line.lot_id),
                note: line.note || '',
                qty: safeNumber(line.qty_reserved),
                uom_id: safeNumberOrNull(line.item_uom_id || line.uom_id),
                unit_price: safeNumber(line.unit_price),
                discount_expression: line.line_discount_input || '0',
                discount_rate: 0, 
                discount_amount: safeNumber(line.line_discount),
                net_amount: safeNumber(line.line_total),
            };

            // Only send reservation_line_id if it exists AND we are in update mode
            if (isUpdate && line.id && line.id !== '' && !isNaN(Number(line.id))) {
                l.reservation_line_id = Number(line.id);
            }

            return l;
        });

        // Remove null fields only when CREATING to keep payload clean.
        // On UPDATE, we must allow null values so the backend can clear those fields in the database.
        if (!isUpdate) {
            Object.keys(cleaned).forEach(key => {
                if (cleaned[key] === null) delete cleaned[key];
            });
        }

        return cleaned;
    },

    /**
     * สร้าง Reservation ใหม่
     */
    create: async (data: ReservationFormData) => {
        const payload = ReservationService.sanitizeData(data, false);
        logger.debug('Creating reservation (Sanitized):', payload);
        try {
            const response = await api.post('/sale-reservation', payload);
            return { success: true, data: response };
        } catch (error) {
            handleMutationError('create reservation', error, payload);
        }
    },

    /**
     * อัปเดต Reservation
     */
    update: async (id: string, data: Partial<ReservationFormData>) => {
        const payload = ReservationService.sanitizeData(data, true);
        logger.debug('Updating reservation (Sanitized):', id, payload);
        try {
            const response = await api.patch(`/sale-reservation/${id}`, payload);
            return { success: true, data: response };
        } catch (error) {
            handleMutationError(`update reservation ${id}`, error, payload);
        }
    },

    delete: async (id: string) => {
        logger.debug('Deleting reservation:', id);
        try {
            await api.delete(`/sale-reservation/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Failed to delete reservation:', error);
            throw error;
        }
    },

    /**
     * ยืนยัน Reservation (เปลี่ยนสถานะเป็น CONFIRMED)
     * 🧪 แก้ไข: ส่งข้อมูลเต็มรูปแบบเพื่อป้องกัน 400 Bad Request จาก Backend
     */
    confirm: async (id: string) => {
        logger.debug('Confirming reservation (Full Sync):', id);
        try {
            // 1. ดึงข้อมูลเต็มรูปแบบมาก่อน
            const currentData = await ReservationService.getById(id);
            if (!currentData) {
                throw new Error('ไม่พบข้อมูลใบสั่งจองสำหรับการยืนยัน');
            }

            // ป้องกันการยืนยันซ้ำ หรือยืนยันเอกสารที่ยกเลิก/หมดอายุไปแล้ว
            if (currentData.status !== 'DRAFT') {
                throw new Error(`ไม่สามารถยืนยันเอกสารได้เนื่องจากเอกสารอยู่ในสถานะ ${currentData.status}`);
            }

            // 2. รวมข้อมูลเดิมเข้ากับสถานะใหม่แล้วสั่งอัปเดตผ่าน Service เดิมที่จัดการ Sanitization ไว้แล้ว
            return await ReservationService.update(id, {
                ...currentData,
                status: 'CONFIRMED'
            });
        } catch (error) {
            logger.error('Failed to confirm reservation:', error);
            throw error;
        }
    }
};