/**
 * @file inquiry.service.ts
 * @description Service สำหรับจัดการข้อมูลสำรวจความต้องการ (Sales Inquiry)
 */


import { logger } from '@/shared/utils/logger';

export interface InquiryListParams {
    inquiry_no?: string;
    customer_name?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface InquiryHeader {
    id: number;
    inquiry_no: string;
    date: string;
    customer_name: string;
    status: 'DRAFT' | 'SUBMITTED';
}

export const InquiryService = {
    /**
     * ดึงรายการ Inquiry
     */
    getList: async (params: InquiryListParams = {}) => {
        // สำหรับนักพัฒนา: เชื่อมต่อ API จริงได้ที่นี่
        // const response = await axios.get('/api/sales/inquiry', { params });
        // return response.data;
        logger.debug('Fetching inquiries with params:', params);
        
        // จำลองการ delay ของ API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            data: [], // คืนค่าว่างเพื่อให้ fallback ไปใช้ mock data ใน UI
            total: 0
        };
    }
};
