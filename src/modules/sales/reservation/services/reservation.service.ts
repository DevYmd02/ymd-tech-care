import api from '@core/api/api';
import { logger } from '@utils/logger';
import { ItemMasterService } from '@inventory/services/item-master.service';
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
    status: 'DRAFT' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
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
                logger.debug('[ReservationService] Raw Detail Response:', response);

                // 🕵️ Mapping Discovery: Ensure reference numbers are available at root level
                if (!response.sq_no) {
                    const r = response as Record<string, unknown>;
                    
                    // 1. Recursive failsafe to find any property named 'sq_no'
                    const findSqNo = (obj: Record<string, unknown>, depth = 0): string => {
                        if (depth > 5 || !obj) return '';
                        if (typeof obj.sq_no === 'string' && obj.sq_no) return obj.sq_no;
                        if (typeof obj.sale_quotation_no === 'string' && obj.sale_quotation_no) return obj.sale_quotation_no;
                        
                        for (const key of Object.keys(obj)) {
                            const val = obj[key];
                            if (val && typeof val === 'object' && !Array.isArray(val)) {
                                const res = findSqNo(val as Record<string, unknown>, depth + 1);
                                if (res) return res;
                            }
                        }
                        return '';
                    };

                    // 2. 🧪 Ultimate Brute Force: Find ANY string starting with "SQ-" using JSON matching
                    let foundSq = findSqNo(r);
                    if (!foundSq) {
                        try {
                            const str = JSON.stringify(r);
                            const match = str.match(/SQ-[A-Z0-9-]{4,}/i);
                            if (match) foundSq = match[0];
                        } catch { /* ignore */ }
                    }
                    response.sq_no = foundSq;
                }
                
                if (!response.aq_no) {
                    const r = response as Record<string, unknown>;
                    const aqObj = (r.aq || r.aq_header || r.sale_quotation_approval || r.quotation_approval || r.header || {}) as Record<string, unknown>;
                    const aqH = (aqObj.sale_quotation_approval || aqObj.quotation_approval || aqObj.header || {}) as Record<string, unknown>;
                    response.aq_no = String(r.aq_no || aqObj.aq_no || aqH.aq_no || aqObj.code || aqH.code || '');
                }
                
                // 🚨 FALLBACK: If numbers are still missing but IDs exist, fetch them
                if (!response.sq_no && response.sq_id) {
                    try {
                        const rawSq = await api.get<unknown>(`/sale-quotation/${response.sq_id}`);
                        
                        if (Array.isArray(rawSq) && rawSq.length === 0) {
                            // Plan B: Fetch list and search for the ID
                            const listRes = await api.get<unknown>('/sale-quotation', { params: { limit: 1000 } });
                            const items = Array.isArray(listRes) ? listRes : (typeof listRes === 'object' && listRes !== null ? (listRes as Record<string, unknown>).data : []) as unknown[];
                            
                            if (Array.isArray(items)) {
                                const match = items.find((i: unknown) => {
                                    const item = i as Record<string, unknown>;
                                    return String(item.sq_id || item.id) === String(response.sq_id);
                                }) as Record<string, unknown> | undefined;

                                if (match && match.sq_no) {
                                    response.sq_no = String(match.sq_no);
                                }
                            }
                        } else if (rawSq && typeof rawSq === 'object') {
                            const obj = rawSq as Record<string, unknown>;
                            const data = (obj.data || obj.rawData || obj.header || obj.sale_quotation || obj.quotation || obj) as Record<string, unknown>;
                            let foundSqNo = String(data.sq_no || data.sale_quotation_no || '');
                            
                            if (!foundSqNo) {
                                try {
                                    const str = JSON.stringify(obj);
                                    const match = str.match(/SQ-[A-Z0-9-]{4,}/i);
                                    if (match) foundSqNo = match[0];
                                } catch { /* ignore */ }
                            }
                            if (foundSqNo) response.sq_no = foundSqNo;
                        }
                    } catch (err) { 
                        logger.error('[ReservationService] Fallback Error (SQ):', err);
                    }
                }

                // 🚀 Combined Approval Lookup: Use the List which we know works to find the SQ
                if (!response.sq_no && response.aq_id) {
                    try {
                        const aqs = await ReservationService.getAvailableApprovals();
                        const match = aqs.find((a: AvailableApproval) => String(a.aq_id || a.id) === String(response.aq_id));
                        if (match) {
                            const m = match as unknown as Record<string, unknown>;
                            const sqObj = (m.sq || m.sq_header || m.sale_quotation || m.quotation || {}) as Record<string, unknown>;
                            
                            let found = String(m.sq_no || m.sale_quotation_no || m.quotation_no || sqObj.sq_no || sqObj.sale_quotation_no || sqObj.code || '');
                            if (!found) {
                                try {
                                    const str = JSON.stringify(m);
                                    const bruteMatch = str.match(/SQ-[A-Z0-9-]{4,}/i);
                                    if (bruteMatch) found = bruteMatch[0];
                                } catch { /* ignore */ }
                            }
                            if (found) response.sq_no = found;
                        }
                    } catch (err) { 
                        logger.error('[ReservationService] Fallback Error (AQ List Search):', err);
                    }
                }

                if (!response.aq_no && response.aq_id) {
                    try {
                        const aqs = await ReservationService.getAvailableApprovals();
                        const match = aqs.find((a: AvailableApproval) => String(a.aq_id || a.id) === String(response.aq_id));
                        if (match) response.aq_no = match.aq_no;
                    } catch (err) {
                        logger.error('[ReservationService] Fallback Error (AQ):', err);
                    }
                }

                // 📅 Date Formatting: Ensure dates are in yyyy-MM-dd format for the input
                if (response.reservation_date) response.reservation_date = String(response.reservation_date).split('T')[0];
                if (response.exchange_rate_date) response.exchange_rate_date = String(response.exchange_rate_date).split('T')[0];

                // 💰 Multicurrency & Currency Logic
                const qcc = response.quote_currency_code || response.currency_code || 'THB';
                const bcc = response.base_currency_code || 'THB';
                response.currency_code = qcc;
                response.base_currency_code = bcc;
                response.quote_currency_code = qcc;
                
                // 🚀 Default to TRUE if flag is missing, as requested by user
                const explicitFlag = response.is_multicurrency;
                const isExplicitlyFalse = explicitFlag === 'N' || explicitFlag === false;
                
                response.isMulticurrency = (qcc !== bcc && qcc !== 'THB') || 
                                           explicitFlag === 'Y' || 
                                           explicitFlag === true || 
                                           (!isExplicitlyFalse && (explicitFlag === undefined || explicitFlag === null || explicitFlag === ''));

                // 🏗️ Project/Job Mapping
                if (response.project_id) response.job_id = String(response.project_id);

                // 💵 Summary Mapping
                response.sub_total = Number(response.sub_total || response.base_sub_total || 0);
                response.discount_amount = Number(response.discount_amount || response.base_discount_amount || 0);
                response.discount_input = String(response.discount_expression || response.discount_input || (response.discount_amount ? String(response.discount_amount) : ''));
                response.vat_amount = Number(response.vat_amount || response.base_vat_amount || 0);
                response.total_amount = Number(response.total_amount || response.base_total_amount || 0);

                // Also ensure IDs are strings for the form if they come as numbers
                const idFields = ['sq_id', 'aq_id', 'customer_id', 'branch_id', 'emp_dept_id', 'emp_sale_id', 'sale_area_id', 'tax_code_id'];
                idFields.forEach(f => {
                    if (response[f]) response[f] = String(response[f]);
                });
                
                // 🛠️ Line Mapping: Backend 'saleReservationLines' -> Frontend 'lines'
                const rawLines = (response.saleReservationLines || response.lines || []) as Record<string, unknown>[];
                if (Array.isArray(rawLines)) {
                    const mappedLines = await Promise.all(rawLines.map(async (l: Record<string, unknown>) => {
                        // Aggressive item discovery
                        const itemObj = (l.item || l.item_master || l.master_item || {}) as Record<string, unknown>;
                        let itemCode = String(l.item_code || itemObj.item_code || itemObj.code || '');
                        let itemName = String(l.item_name || itemObj.item_name || itemObj.name || itemObj.description || '');
                        
                        // 🚀 Enrichment: If still missing, fetch from master data
                        if ((!itemCode || !itemName) && l.item_id) {
                            try {
                                const master = await ItemMasterService.getById(Number(l.item_id));
                                if (master) {
                                    itemCode = itemCode || master.item_code || '';
                                    itemName = itemName || master.item_name || '';
                                }
                            } catch { /* ignore */ }
                        }

                        // 🔍 Lot Discovery
                        const lotIdVal = l.lot_id;
                        const lotIdObj = (typeof lotIdVal === 'object' && lotIdVal !== null) ? (lotIdVal as Record<string, unknown>) : {};
                        const lotBase = (l.lot || (l as Record<string, unknown>).item_lot || lotIdObj || {}) as Record<string, unknown>;
                        let lotNo = String(l.lot_no || l.lot_number || l.lot_code || lotBase.lot_no || lotBase.code || '');
 
                        // 🚀 Enrichment: If still missing but lot_id exists as a number, try to fetch it from /item-lot
                        if (!lotNo && typeof lotIdVal === 'number') {
                            try {
                                type LotRes = Record<string, unknown> | { items?: Record<string, unknown>[] };
                                const lotRes = await api.get<LotRes | Record<string, unknown>[]>('/item-lot', { params: { lot_id: lotIdVal, limit: 1 } });
                                let lotItems: Record<string, unknown>[] = [];
                                
                                if (Array.isArray(lotRes)) {
                                    lotItems = lotRes;
                                } else if (lotRes && typeof lotRes === 'object' && 'items' in lotRes) {
                                    lotItems = (lotRes as { items: Record<string, unknown>[] }).items || [];
                                }
                                
                                if (lotItems.length > 0) {
                                    const first = lotItems[0];
                                    lotNo = String(first.lot_no || first.lot_number || first.code || '');
                                }
                            } catch { /* ignore */ }
                        }
 
                        return {
                            ...l,
                            id: String(l.reservation_line_id || l.id || ''),
                            item_id: String(l.item_id || ''),
                            item_code: itemCode,
                            item_name: itemName,
                            qty_reserved: Number(l.qty || l.qty_reserved || 0),
                            uom_id: String(l.uom_id || l.unit_id || ''),
                            warehouse_id: String(l.warehouse_id || ''),
                            location_id: String(l.location_id || ''),
                            lot_no: lotNo,
                            lot_id: (typeof lotIdVal === 'object' && lotIdVal !== null) 
                                ? String((lotIdVal as Record<string, unknown>).id || (lotIdVal as Record<string, unknown>).lot_id || '') 
                                : (lotIdVal ? String(lotIdVal) : undefined),
                            line_discount_input: String(l.discount_expression || l.line_discount_input || '0'),
                            line_discount: Number(l.discount_amount || l.line_discount || 0),
                            line_total: Number(l.net_amount || l.line_total || 0),
                        };
                    }));
                    response.lines = mappedLines;
                }
            }

            return response as unknown as ReservationFormData;
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
            const response = await api.get<unknown>('/sale-quotation-approval');
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
    sanitizeData: (data: ReservationFormData | Partial<ReservationFormData>) => {
        const raw = { ...data } as Record<string, unknown>;
        
        // Root Level Mapping
        const cleaned: Record<string, unknown> = {
            reservation_date: raw.reservation_date ? new Date(raw.reservation_date as string).toISOString() : null,
            sq_id: raw.sq_id ? Number(raw.sq_id) : null,
            aq_id: raw.aq_id ? Number(raw.aq_id) : null,
            customer_id: raw.customer_id ? Number(raw.customer_id) : null,
            branch_id: raw.branch_id ? Number(raw.branch_id) : null,
            status: raw.status || 'DRAFT',
            ship_days: Number(raw.ship_days || 0),
            remarks: raw.remarks || '',
            payment_term_days: Number(raw.payment_term_days || 0),
            onhold: raw.onhold || 'N',
            emp_sale_id: raw.emp_sale_id ? Number(raw.emp_sale_id) : null,
            sale_area_id: raw.sale_area_id ? Number(raw.sale_area_id) : null,
            emp_dept_id: raw.emp_dept_id ? Number(raw.emp_dept_id) : null,
            project_id: raw.job_id ? Number(raw.job_id) : (raw.project_id ? Number(raw.project_id) : null),
            status_remark: raw.status_remark || '',
            base_currency_code: raw.base_currency_code || raw.currency_code || 'THB',
            quote_currency_code: raw.quote_currency_code || raw.currency_code || 'THB',
            exchange_rate: Number(raw.exchange_rate || 1),
            exchange_rate_date: raw.exchange_rate_date 
                ? new Date(raw.exchange_rate_date as string).toISOString() 
                : (raw.reservation_date ? new Date(raw.reservation_date as string).toISOString() : null),
            tax_code_id: raw.tax_code_id ? Number(raw.tax_code_id) : null,
            discount_expression: (raw.discount_input as string) || '0',
        };

        // Lines Mapping: Frontend 'lines' -> Backend 'saleReservationLines'
        const rawLines = (raw.lines || []) as Record<string, unknown>[];
        cleaned.saleReservationLines = rawLines.map((line: Record<string, unknown>) => ({
            reservation_line_id: line.id ? Number(line.id) : null,
            item_id: line.item_id ? Number(line.item_id) : null,
            warehouse_id: line.warehouse_id ? Number(line.warehouse_id) : null,
            location_id: line.location_id ? Number(line.location_id) : null,
            lot_id: line.lot_id ? Number(line.lot_id) : null,
            note: line.note || '',
            qty: Number(line.qty_reserved || 0),
            uom_id: line.uom_id ? Number(line.uom_id) : null,
            unit_price: Number(line.unit_price || 0),
            discount_expression: line.line_discount_input || '0',
            discount_rate: 0, // Backend might calculate this or want it
            discount_amount: Number(line.line_discount || 0),
            net_amount: Number(line.line_total || 0),
        }));

        // Remove null fields to keep payload clean
        Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === null) delete cleaned[key];
        });

        return cleaned;
    },

    /**
     * สร้าง Reservation ใหม่
     */
    create: async (data: ReservationFormData) => {
        const payload = ReservationService.sanitizeData(data);
        logger.debug('Creating reservation (Sanitized):', payload);
        try {
            const response = await api.post('/sale-reservation', payload);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: unknown; status?: number }; message: string };
            const errorBody = err.response?.data;
            logger.error('Failed to create reservation:', {
                message: err.message,
                details: errorBody,
                status: err.response?.status,
                payload
            });
            throw error;
        }
    },

    /**
     * อัปเดต Reservation
     */
    update: async (id: string, data: Partial<ReservationFormData>) => {
        const payload = ReservationService.sanitizeData(data);
        logger.debug('Updating reservation (Sanitized):', id, payload);
        try {
            const response = await api.patch(`/sale-reservation/${id}`, payload);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: unknown; status?: number }; message: string };
            const errorBody = err.response?.data;
            logger.error('Failed to update reservation:', {
                message: err.message,
                details: errorBody,
                status: err.response?.status,
                payload
            });
            throw error;
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
     */
    confirm: async (id: string) => {
        logger.debug('Confirming reservation:', id);
        try {
            const response = await api.patch(`/sale-reservation/${id}`, { status: 'CONFIRMED' });
            return { success: true, data: response };
        } catch (error) {
            logger.error('Failed to confirm reservation:', error);
            throw error;
        }
    }
};