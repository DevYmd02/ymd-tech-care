/**
 * @file reservation.service.ts
 * @description Service สำหรับจัดการข้อมูลใบสั่งจอง (Sales Reservation)
 */

export interface ReservationListParams {
    rs_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

export interface ReservationHeader {
    id: number;
    rs_no: string;
    date: string;
    customer_name: string;
    customer_code: string;
    total_amount: number;
    currency: string;
    status: 'Draft' | 'Confirmed' | 'Released';
}

export const ReservationService = {
    /**
     * ดึงรายการ Reservation
     */
    getList: async (params: ReservationListParams = {}) => {
        // สำหรับนักพัฒนา: เชื่อมต่อ API จริงได้ที่นี่
        console.log('Fetching reservations with params:', params);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            data: [], 
            total: 0
        };
    }
};
