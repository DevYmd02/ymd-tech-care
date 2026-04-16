import { logger } from '@/shared/utils/logger';
import type { SalesOrderFormData } from '../types/sales-order.types';

export interface SalesOrderListParams {
    so_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

/** แสดงในตาราง List Page */
export interface SalesOrderHeader {
    so_id: string;              // PK uuid
    so_no: string;              // เลขที่ SO
    so_date: string;            // วันที่ SO (so_date)
    customer_name: string;      // ชื่อลูกค้า (join)
    customer_code: string;      // รหัสลูกค้า (join)
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED';
    total_amount: number;       // total_amount
    currency_code: string;      // currency_code
    ship_date?: string;         // วันที่กำหนดส่ง
    cust_po_no?: string;        // เลขที่ PO ลูกค้า
    remarks?: string;           // หมายเหตุ
    onhold: 'Y' | 'N';         // onhold
}

export const SalesOrderService = {
    /** ดึงรายการ Sales Order */
    getList: async (params: SalesOrderListParams = {}) => {
        logger.debug('Fetching sales orders with params:', params);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { data: [] as SalesOrderHeader[], total: 0 };
    },

    /** ดึงข้อมูล Sales Order รายตัว */
    getById: async (id: string): Promise<SalesOrderFormData | null> => {
        logger.debug('Fetching sales order:', id);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return null;
    },

    /** สร้าง Sales Order ใหม่ */
    create: async (data: SalesOrderFormData) => {
        logger.debug('Creating sales order:', data);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { success: true };
    },

    /** แก้ไข Sales Order */
    update: async (id: string, data: SalesOrderFormData) => {
        logger.debug('Updating sales order:', id, data);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { success: true };
    },
};
