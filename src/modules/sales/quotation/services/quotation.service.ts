/**
 * @file quotation.service.ts
 * @description Service สำหรับจัดการข้อมูลใบเสนอราคาขาย (Sales Quotation)
 */

import { logger } from '@/shared/utils/logger';
import type { QuotationFormData, QuotationHeader } from '@sales/quotation/types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';

export type { QuotationHeader };

export interface QuotationListParams {
    sq_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

export interface QuotationListResponse {
    data: QuotationHeader[];
    total: number;
}

export class QuotationService {
    /**
     * ดึงรายการ Quotation
     */
    static async getList(params?: QuotationListParams): Promise<QuotationListResponse> {
        logger.debug('Fetching quotations with params:', params);
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            data: [], 
            total: 0
        };
    }

    /**
     * ดึงรายละเอียด Quotation ตาม ID
     */
    static async getById(id: string): Promise<QuotationFormData | null> {
        logger.debug('Fetching quotation detail for id:', id);
        await new Promise(resolve => setTimeout(resolve, 500));
        return null;
    }

    /**
     * สร้าง Quotation ใหม่
     */
    static async create(data: QuotationFormValues): Promise<void> {
        logger.info('Creating Quotation:', data);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve();
    }

    /**
     * อัปเดตข้อมูล Quotation
     */
    static async update(id: string, data: Partial<QuotationFormValues>): Promise<void> {
        logger.info('Updating Quotation:', id, data);
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve();
    }
}
