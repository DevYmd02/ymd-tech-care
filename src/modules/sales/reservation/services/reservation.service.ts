import api from '@core/api/api';
import { logger } from '@utils';
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
                // 🕵️ Structured Discovery: Find Reference Numbers
                const r = response as Record<string, unknown>;
                const sqId = (r.sq_id || r.sale_quotation_id || r.quotation_id || r.sq_header_id) as string | number | undefined;
                
                // If SQ ID exists but number is missing, fetch it
                if (!r.sq_no && sqId) {
                    try {
                        const sqRes = await api.get<unknown>(`/sale-quotation/${sqId}`);
                        const sqStr = JSON.stringify(sqRes);
                        const match = sqStr.match(/SQ-?\d{4,}-\d{4,}/i) || sqStr.match(/"sq_no":"(.*?)"/i) || sqStr.match(/"sqNo":"(.*?)"/i) || sqStr.match(/"code":"(.*?)"/i);
                        if (match) {
                            response.sq_no = match[1] || match[0];
                        } else {
                            const d = ((sqRes as Record<string, unknown>)?.data || (sqRes as Record<string, unknown>)?.rawData || sqRes) as Record<string, unknown>;
                            response.sq_no = String(d.sq_no || d.sqNo || d.sale_quotation_no || d.sq_number || d.code || d.no || '');
                        }

                        // Super Fallback: If still no sq_no, try fetching from the list
                        if (!response.sq_no) {
                            const sqsRes = await api.get<unknown>('/sale-quotation', { params: { limit: 1000 } });
                            const sqsData = ((sqsRes as Record<string, unknown>)?.data || (sqsRes as Record<string, unknown>)?.items || sqsRes || []) as Record<string, unknown>[];
                            const matchInList = sqsData.find(s => String(s.sq_id || s.id) === String(sqId));
                            if (matchInList) response.sq_no = String(matchInList.sq_no || matchInList.code || matchInList.no || '');
                        }
                    } catch { /* ignore */ }
                }

                // If AQ ID exists but number is missing, fetch it
                const aqId = (r.aq_id || r.aq_header_id || r.approval_id || r.sale_quotation_approval_id) as string | number | undefined;
                if (!r.aq_no && aqId) {
                    try {
                        // 1. Try Available Approvals (Fastest)
                        const aqs = await ReservationService.getAvailableApprovals();
                        const match = aqs.find((a) => String(a.aq_id) === String(aqId));
                        if (match) response.aq_no = match.aq_no;
                        else {
                            // 2. Try searching in general AQ list (Avoids 404 because list endpoint usually exists)
                            const aqsRes = await api.get<unknown>('/sale-quotation-approval', { params: { limit: 1000 } });
                            const aqsData = ((aqsRes as Record<string, unknown>)?.data || (aqsRes as Record<string, unknown>)?.items || aqsRes || []) as Record<string, unknown>[];
                            const matchInList = aqsData.find(a => String(a.aq_id || a.id || a.sale_quotation_approval_id) === String(aqId));
                            
                            if (matchInList) {
                                response.aq_no = String(matchInList.aq_no || matchInList.sale_quotation_approval_no || matchInList.code || matchInList.no || '');
                            } else {
                                // 3. Last resort: Direct fetch (might 404 if ID endpoint not supported)
                                try {
                                    const aqRes = await api.get<unknown>(`/sale-quotation-approval/${aqId}`);
                                    const aqStr = JSON.stringify(aqRes);
                                    const aqMatch = aqStr.match(/AQ-?\d{4,}-\d{4,}/i) || aqStr.match(/"aq_no":"(.*?)"/i) || aqStr.match(/"aqNo":"(.*?)"/i);
                                    if (aqMatch) response.aq_no = aqMatch[1] || aqMatch[0];
                                } catch { /* ignore 404 */ }
                            }
                        }
                    } catch { /* ignore */ }
                }

                if (!response.sq_no || response.sq_no === 'undefined' || response.sq_no === 'null') {
                    const sqObj = (r.sq || r.sale_quotation || r.quotation || r.header || {}) as Record<string, unknown>;
                    const fullStr = JSON.stringify(response);
                    const fallbackMatch = fullStr.match(/SQ-?\d{4,}-\d{4,}/i);
                    const resolvedSq = r.sq_no || r.sqNo || sqObj.sq_no || sqObj.sqNo || sqObj.code || sqObj.no || r.sale_quotation_no || (fallbackMatch ? fallbackMatch[0] : '');
                    response.sq_no = resolvedSq ? String(resolvedSq) : '';
                }
                
                if (!response.aq_no || response.aq_no === 'undefined' || response.aq_no === 'null') {
                    const aqObj = (r.aq || r.aq_header || r.sale_quotation_approval || r.quotation_approval || {}) as Record<string, unknown>;
                    const aqStr = JSON.stringify(response);
                    const aqFallback = aqStr.match(/AQ-?\d{4,}-\d{4,}/i);
                    const resolvedAq = r.aq_no || r.aqNo || aqObj.aq_no || aqObj.aqNo || aqObj.code || aqObj.no || (aqFallback ? aqFallback[0] : '');
                    response.aq_no = resolvedAq ? String(resolvedAq) : '';
                }
                
                // 📅 Date Formatting
                if (response.reservation_date) response.reservation_date = String(response.reservation_date).split('T')[0];
                if (response.exchange_rate_date) response.exchange_rate_date = String(response.exchange_rate_date).split('T')[0];

                // 💰 Multicurrency Logic
                const qcc = response.quote_currency_code || response.currency_code || 'THB';
                const bcc = response.base_currency_code || 'THB';
                response.currency_code = qcc;
                response.base_currency_code = bcc;
                response.quote_currency_code = qcc;
                
                const explicitFlag = response.is_multicurrency;
                const isExplicitlyFalse = explicitFlag === 'N' || explicitFlag === false;
                
                response.isMulticurrency = (qcc !== bcc && qcc !== 'THB') || 
                                           explicitFlag === 'Y' || 
                                           explicitFlag === true || 
                                           (!isExplicitlyFalse && (explicitFlag === undefined || explicitFlag === null || explicitFlag === ''));

                if (response.project_id) response.job_id = String(response.project_id);

                // 💵 Summary Mapping
                response.sub_total = Number(response.sub_total || response.base_sub_total || 0);
                response.discount_amount = Number(response.discount_amount || response.base_discount_amount || 0);
                response.discount_input = String(response.discount_expression || response.discount_input || (response.discount_amount ? String(response.discount_amount) : ''));
                response.vat_amount = Number(response.vat_amount || response.base_vat_amount || 0);
                response.total_amount = Number(response.total_amount || response.base_total_amount || 0);

                const idFields = ['sq_id', 'aq_id', 'customer_id', 'branch_id', 'emp_dept_id', 'emp_sale_id', 'sale_area_id', 'tax_code_id'];
                idFields.forEach(f => {
                    if (response[f]) response[f] = String(response[f]);
                });
                
                // 🛠️ Line Mapping with Enrichment (Back to fetching if missing)
                const rawLines = (response.saleReservationLines || response.lines || []) as Record<string, unknown>[];
                if (Array.isArray(rawLines)) {
                    response.lines = await Promise.all(rawLines.map(async (l: Record<string, unknown>) => {
                        const itemObj = (l.item || l.item_master || l.master_item || l.product || {}) as Record<string, unknown>;
                        const itemId = String(l.item_id || itemObj.item_id || itemObj.id || '');
                        let itemCode = String(l.item_code || l.code || itemObj.item_code || itemObj.code || itemObj.sku || '');
                        let itemName = String(l.item_name || l.name || itemObj.item_name || itemObj.name || itemObj.description || '');
                        
                        // 🚀 Re-Enrich Items if missing (Essential fallback)
                        if ((!itemCode || !itemName) && itemId) {
                            try {
                                const masterRes = await api.get<unknown>(`/item-master/${itemId}`);
                                const master = ((masterRes as Record<string, unknown>)?.data || masterRes) as Record<string, unknown>;
                                if (master) {
                                    itemCode = itemCode || String(master.item_code || master.code || '');
                                    itemName = itemName || String(master.item_name || master.name || '');
                                }
                            } catch { /* ignore */ }
                        }

                        // Final fallback for name
                        if (!itemName && itemId) itemName = `[Item ID: ${itemId}]`;

                        const lotIdVal = l.lot_id;
                        const lotObj = (typeof lotIdVal === 'object' && lotIdVal !== null) ? (lotIdVal as Record<string, unknown>) : ((l.lot || l.item_lot || {}) as Record<string, unknown>);
                        let lotNo = String(l.lot_no || l.lot_number || lotObj.lot_no || lotObj.code || '');
                        
                        // 🚀 Re-Enrich Lots if missing or if lotNo looks like an ID (Essential fallback)
                        const isLotNoNumericId = /^\d+$/.test(lotNo) && lotNo.length < 10 && lotNo === String(lotIdVal);
                        
                        if ((!lotNo || isLotNoNumericId) && lotIdVal && (typeof lotIdVal === 'number' || typeof lotIdVal === 'string')) {
                            try {
                                const lotRes = await api.get<unknown>(`/item-lot/${lotIdVal}`);
                                const lotData = (lotRes as Record<string, unknown>)?.data || lotRes;
                                if (lotData && typeof lotData === 'object' && !Array.isArray(lotData)) {
                                    const lotItem = lotData as Record<string, unknown>;
                                    lotNo = String(lotItem.lot_no || lotItem.code || lotNo);
                                }
                            } catch {
                                // Fallback to list search if direct ID access fails
                                try {
                                    const lotRes = await api.get<unknown>('/item-lot', { params: { lot_id: lotIdVal, limit: 1 } });
                                    const lotData = (lotRes as Record<string, unknown>)?.data || (lotRes as Record<string, unknown>)?.items || lotRes;
                                    const lotItems = Array.isArray(lotData) ? lotData : [];
                                    if (lotItems.length > 0) {
                                        const firstLot = lotItems[0] as Record<string, unknown>;
                                        lotNo = String(firstLot.lot_no || firstLot.code || lotNo);
                                    }
                                } catch { /* ignore */ }
                            }
                        }

                        return {
                            ...l,
                            id: String(l.reservation_line_id || l.id || ''),
                            item_id: itemId,
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
                            price_source: l.price_source !== undefined ? Number(l.price_source) : undefined,
                            price_source_name: String(l.price_source_name || ''),
                            price_level_priority: l.price_level_priority !== undefined ? Number(l.price_level_priority) : undefined,
                        };
                    }));
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
        cleaned.saleReservationLines = rawLines.map((line: Record<string, unknown>) => {
            const l: Record<string, unknown> = {
                item_id: line.item_id ? Number(line.item_id) : null,
                warehouse_id: line.warehouse_id ? Number(line.warehouse_id) : null,
                location_id: line.location_id ? Number(line.location_id) : null,
                lot_id: line.lot_id ? Number(line.lot_id) : null,
                note: line.note || '',
                qty: Number(line.qty_reserved || 0),
                uom_id: line.uom_id ? Number(line.uom_id) : null,
                unit_price: Number(line.unit_price || 0),
                discount_expression: line.line_discount_input || '0',
                discount_rate: 0, 
                discount_amount: Number(line.line_discount || 0),
                net_amount: Number(line.line_total || 0),
            };

            // Only send reservation_line_id if it exists AND we are in update mode
            if (isUpdate && line.id && line.id !== '' && !isNaN(Number(line.id))) {
                l.reservation_line_id = Number(line.id);
            }

            return l;
        });

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
        const payload = ReservationService.sanitizeData(data, false);
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
        const payload = ReservationService.sanitizeData(data, true);
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