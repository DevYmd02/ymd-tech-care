/**
 * @file sales-order.service.ts
 * @description Service สำหรับจัดการข้อมูลคำสั่งขาย (Sales Order)
 */

export interface SalesOrderListParams {
    so_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

export interface SalesOrderHeader {
    id: number;
    so_no: string;
    date: string;
    customer_name: string;
    customer_code: string;
    status: 'Draft' | 'Approved' | 'Closed';
    amount: number;
    currency: string;
    delivery_date: string;
    remarks: string;
}

export const SalesOrderService = {
    /**
     * ดึงรายการ Sales Order
     */
    getList: async (params: SalesOrderListParams = {}) => {
        // สำหรับนักพัฒนา: เชื่อมต่อ API จริงได้ที่นี่
        console.log('Fetching sales orders with params:', params);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            data: [], 
            total: 0
        };
    }
};
