/**
 * @file qcService.ts
 * @description Service สำหรับจัดการ Quotation Comparison (QC)
 */

import { MOCK_QC_LIST } from '../__mocks__/qcMocks';
import type { QCListItem } from '../types/qc-types';

export interface QCListParams {
    qc_no?: string;
    pr_no?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
}

export interface QCListResponse {
    data: QCListItem[];
    total: number;
    page: number;
    limit: number;
}

export const qcService = {
    /**
     * ดึงรายการ QC ทั้งหมด (Mock)
     */
    getList: async (params?: QCListParams): Promise<QCListResponse> => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        let data = [...MOCK_QC_LIST];

        if (params) {
            if (params.qc_no) {
                data = data.filter(item => item.qc_no.toLowerCase().includes(params.qc_no!.toLowerCase()));
            }
            if (params.pr_no) {
                data = data.filter(item => item.pr_no?.toLowerCase().includes(params.pr_no!.toLowerCase()));
            }
            if (params.status && params.status !== 'ALL') {
                data = data.filter(item => item.status.toLowerCase() === params.status!.toLowerCase());
            }
            if (params.date_from) {
                data = data.filter(item => item.created_at >= params.date_from!);
            }
            if (params.date_to) {
                data = data.filter(item => item.created_at <= params.date_to!);
            }
        }

        return {
            data,
            total: data.length,
            page: 1,
            limit: 20
        };
    }
};
