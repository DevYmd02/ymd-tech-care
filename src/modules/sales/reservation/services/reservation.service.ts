import api from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
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
    aq_status: string;
    sq_id: number;
    sq_no: string;
    sq_date: string;
    sq_status: string;
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
    /**
     * ดึงรายการ Reservation
     */
    getList: async (params: ReservationListParams = {}) => {
        logger.debug('Fetching reservations with params:', params);
        // Fallback to mock for now as list endpoint might not be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            data: [] as ReservationHeader[], 
            total: 0
        };
    },

    /**
     * ดึงข้อมูล Reservation รายใบ
     */
    getById: async (id: string): Promise<ReservationFormData | null> => {
        logger.debug('Fetching reservation by id:', id);
        await new Promise(resolve => setTimeout(resolve, 500));
        return null; // Mock return
    },

    /**
     * ดึงรายการใบเสนอราคาที่อนุมัติแล้ว (AQ) เพื่อนำมาทำใบสั่งจอง
     */
    getAvailableApprovals: async (): Promise<AvailableApproval[]> => {
        try {
            const response = await api.get<AvailableApproval[]>('/sale-reservation/available-approvals');
            return response as unknown as AvailableApproval[];
        } catch (error) {
            logger.error('Failed to fetch available approvals:', error);
            return [];
        }
    },

    /**
     * สร้าง Reservation ใหม่
     */
    create: async (data: ReservationFormData) => {
        logger.debug('Creating reservation:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, data };
    },

    /**
     * อัปเดต Reservation
     */
    update: async (id: string, data: Partial<ReservationFormData>) => {
        logger.debug('Updating reservation:', id, data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, data };
    },

    /**
     * ลบ Reservation
     */
    delete: async (id: string) => {
        logger.debug('Deleting reservation:', id);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }
};


