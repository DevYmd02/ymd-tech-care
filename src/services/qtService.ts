/**
 * @file qtService.ts
 * @description Service สำหรับจัดการ Quotation (QT)
 */

import { MOCK_QUOTATIONS } from '../__mocks__/qtMocks';
import type { QTListItem, QuotationLine } from '../types/qt-types';

// TODO: Define real API response types when backend is ready
export interface QTListResponse {
    data: QTListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface QTListParams {
    quotation_no?: string;
    vendor_name?: string;
    rfq_no?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
}

export const qtService = {
    /**
     * ดึงรายการ Quotation ทั้งหมด (Mock)
     */
    getList: async (params?: QTListParams): Promise<QTListResponse> => {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));

        let data = [...MOCK_QUOTATIONS];

        if (params) {
            if (params.quotation_no) {
                data = data.filter(item => item.quotation_no.toLowerCase().includes(params.quotation_no!.toLowerCase()));
            }
            if (params.vendor_name) {
                data = data.filter(item => 
                    (item.vendor_name || '').toLowerCase().includes(params.vendor_name!.toLowerCase()) ||
                    (item.vendor_code || '').toLowerCase().includes(params.vendor_name!.toLowerCase())
                );
            }
            if (params.rfq_no) {
                data = data.filter(item => (item.rfq_no || '').toLowerCase().includes(params.rfq_no!.toLowerCase()));
            }
            if (params.status && params.status !== 'ALL') {
                 // Simple mapping for demo: 'ได้รับแล้ว' -> SUBMITTED, 'เทียบราคาแล้ว' -> SELECTED
                 // But in UI we use 'ALL' or specific values.
                 data = data.filter(item => item.status === params.status);
            }
            // Date filter logic (simple string compare for mock)
            if (params.date_from) {
                data = data.filter(item => item.quotation_date >= params.date_from!);
            }
            if (params.date_to) {
                data = data.filter(item => item.quotation_date <= params.date_to!);
            }
        }

        return {
            data,
            total: data.length,
            page: 1,
            limit: 20
        };
    },

    /**
     * สร้างใบเสนอราคาใหม่ (Mock)
     */
    create: async (data: Partial<QTListItem> & { lines?: Partial<QuotationLine>[] }): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Mock Create QT:', data);
        // In real app, this would append to DB. For mock, we can push to list if we want, or just success.
        MOCK_QUOTATIONS.unshift({
            ...data,
            quotation_id: `qt-${Date.now()}`,
            vendor_code: 'V-MOCK', 
            vendor_name: 'Vendor Mock',
            status: 'SUBMITTED',
            // Default other missing fields
        } as QTListItem);
    }
};
