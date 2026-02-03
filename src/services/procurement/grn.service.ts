/**
 * @file grn.service.ts
 * @description Simplified Goods Receipt Note (GRN) Service
 */

import api, { extractErrorMessage } from '@/services/core/api';
import { logger } from '@/utils/logger';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/types/grn-types';

const BASE_URL = '/procurement/grn';

export const GRNService = {
    getList: async (params?: GRNListParams): Promise<GRNListResponse> => {
        if (import.meta.env.VITE_USE_MOCK === 'true') {
             const { MOCK_GRNS } = await import('@/__mocks__/procurementMocks');
             console.log('🎭 [Mock Mode] Serving GRN List');
             return {
                 data: MOCK_GRNS,
                 total: MOCK_GRNS.length,
                 page: 1,
                 limit: 100
             };
        }

        try {
            const response = await api.get(BASE_URL, { params });
            return response.data;
        } catch (error) {
            logger.error('GRNService.getList error:', extractErrorMessage(error));
            throw error;
        }
    },

    getById: async (id: string): Promise<GRNListItem | null> => {
        try {
            const response = await api.get(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            logger.error(`GRNService.getById(${id}) error:`, extractErrorMessage(error));
            throw error;
        }
    },

    getSummaryCounts: async (): Promise<GRNSummaryCounts> => {
        try {
            const response = await api.get(`${BASE_URL}/summary-status`);
            return response.data;
        } catch (error) {
            logger.error('GRNService.getSummaryCounts error:', extractErrorMessage(error));
            // Return default 0s on error to prevent UI crash
            return { DRAFT: 0, POSTED: 0, REVERSED: 0, RETURNED: 0 };
        }
    },

    create: async (data: CreateGRNPayload): Promise<void> => {
        try {
            await api.post(BASE_URL, data);
        } catch (error) {
            logger.error('GRNService.create error:', extractErrorMessage(error));
            throw error;
        }
    }
};
