import api from '@core/api/api';
import { logger } from '@utils/logger';
import type { ReservationFormData } from '../types/reservation.types';

export interface ReservationListParams {
    rs_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

/**
 * Interface representing the header data for a Reservation in list views
 */
export interface ReservationHeader {
    reservation_id: string;
    rs_no: string;
    date: string;
    customer_name: string;
    customer_code: string;
    total_amount: number;
    currency: string;
    status: 'DRAFT' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
    branch_name?: string;
    customer_id?: string;
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
            const response = await api.get<ReservationFormData>(`/sale-reservation/${id}`);
            return response;
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
            discount_amount: Number(raw.discount_amount || 0),
            sub_total: Number(raw.sub_total || 0),
            vat_amount: Number(raw.vat_amount || 0),
            total_amount: Number(raw.total_amount || 0),
        };

        // Lines Mapping: Frontend 'lines' -> Backend 'saleReservationLines'
        const rawLines = (raw.lines || []) as Record<string, unknown>[];
        cleaned.saleReservationLines = rawLines.map((line: Record<string, unknown>) => ({
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
            tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : cleaned.tax_code_id,
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
    }
};