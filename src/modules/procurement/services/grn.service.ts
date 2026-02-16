/**
 * @file grn.service.ts
 * @description Simplified Goods Receipt Note (GRN) Service
 */

import api, { extractErrorMessage, USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/modules/procurement/types/grn-types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const BASE_URL = '/procurement/grn';

export const GRNService = {
    getList: async (params?: GRNListParams): Promise<GRNListResponse> => {
        // Removed: const IS_DEV = import.meta.env.DEV;
        // Removed: const USE_MOCK = IS_DEV;

        if (USE_MOCK) {
            const { MOCK_GRNS } = await import('@/modules/procurement/mocks/procurementMocks');
            let filtered = [...MOCK_GRNS];

            if (params) {
                if (params.status && params.status !== 'ALL') {
                    filtered = filtered.filter(item => item.status === params.status);
                }
                if (params.grn_no) {
                    filtered = filtered.filter(item => 
                        item.grn_no.toLowerCase().includes(params.grn_no!.toLowerCase())
                    );
                }
                if (params.po_no) {
                    filtered = filtered.filter(item => 
                        (item.po_no || '').toLowerCase().includes(params.po_no!.toLowerCase())
                    );
                }
                if (params.date_from) {
                    const fromDate = new Date(params.date_from).getTime();
                    filtered = filtered.filter(item => new Date(item.received_date).getTime() >= fromDate);
                }
                if (params.date_to) {
                    const toDate = new Date(params.date_to).getTime();
                    filtered = filtered.filter(item => new Date(item.received_date).getTime() <= toDate);
                }

                if (params.sort) {
                    const [field, order] = params.sort.split(':') as [keyof GRNListItem, 'asc' | 'desc'];
                    filtered.sort((a, b) => {
                        const valA = a[field];
                        const valB = b[field];
                        if (valA === valB) return 0;
                        if (valA === null || valA === undefined) return 1;
                        if (valB === null || valB === undefined) return -1;
                        
                        const comparison = (valA > valB) ? 1 : -1;
                        return order === 'desc' ? -comparison : comparison;
                    });
                }
            }

            const page = params?.page || 1;
            const limit = params?.limit || 10;
            const total = filtered.length;
            const data = filtered.slice((page - 1) * limit, page * limit);

            return { data, total, page, limit };
        }

        try {
            return await api.get<GRNListResponse>(BASE_URL, { params });
        } catch (error) {
            logger.error('GRNService.getList error:', extractErrorMessage(error));
            throw error;
        }
    },

    getById: async (id: string): Promise<GRNListItem | null> => {
        try {
            return await api.get<GRNListItem>(`${BASE_URL}/${id}`);
        } catch (error) {
            logger.error(`GRNService.getById(${id}) error:`, extractErrorMessage(error));
            throw error;
        }
    },

    getSummaryCounts: async (): Promise<GRNSummaryCounts> => {
        try {
            return await api.get<GRNSummaryCounts>(`${BASE_URL}/summary-status`);
        } catch (error) {
            logger.error('GRNService.getSummaryCounts error:', extractErrorMessage(error));
            // Return default 0s on error to prevent UI crash
            return { DRAFT: 0, POSTED: 0, REVERSED: 0, RETURNED: 0 };
        }
    },

    create: async (data: CreateGRNPayload): Promise<void> => {
        try {
            await api.post<SuccessResponse>(BASE_URL, data);
        } catch (error) {
            logger.error('GRNService.create error:', extractErrorMessage(error));
            throw error;
        }
    }
};
