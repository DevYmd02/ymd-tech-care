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

export const ReservationService = {
    /**
     * ดึงรายการ Reservation
     */
    getList: async (params: ReservationListParams = {}) => {
        logger.debug('Fetching reservations with params:', params);
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

