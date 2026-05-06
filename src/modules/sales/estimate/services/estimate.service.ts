/**
 * @file estimate.service.ts
 * @description Service สำหรับจัดการข้อมูลประมาณการราคา (Sales Estimate)
 */

import { logger } from '@utils';

export interface EstimateListParams {
    estimate_no?: string;
    inquiry_no?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface EstimateHeader {
    id: number;
    estimate_no: string;
    inquiry_no: string;
    markup: number;
    total_price: number;
    status: 'DRAFT' | 'SUBMITTED';
}

export interface EstimateListResponse {
    data: EstimateHeader[];
    total: number;
}

export const EstimateService = {
    /**
     * ดึงรายการ Estimate
     */
    getList: async (_params: EstimateListParams = {}): Promise<EstimateListResponse> => {
        // สำหรับนักพัฒนา: เชื่อมต่อ API จริงได้ที่นี่
        logger.debug('Fetching estimates with params:', _params);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            data: [], // คืนค่าว่างตามที่ผู้ใช้ต้องการ (ไม่เอา Mock ที่ Hardcode ใน UI)
            total: 0
        };
    }
};
