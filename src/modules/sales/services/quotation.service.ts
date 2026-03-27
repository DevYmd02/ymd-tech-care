/**
 * @file quotation.service.ts
 * @description Service สำหรับจัดการข้อมูลใบเสนอราคาขาย (Sales Quotation)
 */

export interface QuotationListParams {
    sq_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

export interface QuotationHeader {
    id: number;
    sq_no: string;
    date: string;
    customer_name: string;
    customer_code: string;
    total_amount: number;
    currency: string;
    status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
    expiry_date: string;
    workflow_status: string;
}

export const QuotationService = {
    /**
     * ดึงรายการ Quotation
     */
    getList: async (params: QuotationListParams = {}) => {
        // สำหรับนักพัฒนา: เชื่อมต่อ API จริงได้ที่นี่
        console.log('Fetching quotations with params:', params);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            data: [], 
            total: 0
        };
    }
};
