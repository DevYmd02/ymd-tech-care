/**
 * @file grn.service.ts
 * @description Simplified Goods Receipt Note (GRN) Service
 */

import api, { extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/modules/procurement/types/grn-types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const BASE_URL = '/procurement/grn';

export const GRNService = {
    getList: async (params?: GRNListParams): Promise<GRNListResponse> => {
        if (import.meta.env.VITE_USE_MICK === 'true' || import.meta.env.VITE_USE_MOCK === 'true') {
             const { MOCK_GRNS } = await import('@/modules/procurement/mocks/procurementMocks');
             logger.info('🎭 [Mock Mode] Serving GRN List');
             
             let filtered = MOCK_GRNS;
             if (params?.status && params.status !== 'ALL') {
                 filtered = filtered.filter(grn => grn.status === params.status);
             }

             // 1. Text Search
             if (params?.grn_no) {
                 const searchLower = params.grn_no.toLowerCase();
                 filtered = filtered.filter(grn => grn.grn_no.toLowerCase().includes(searchLower));
             }
             if (params?.po_no) {
                 const searchLower = params.po_no.toLowerCase();
                 filtered = filtered.filter(grn => grn.po_no.toLowerCase().includes(searchLower));
             }

             const sortParam = params?.sort || 'received_date:desc';
             const [sortKey, sortDir] = sortParam.split(':');
             
             const sorted = [...filtered].sort((a, b) => {
                 const valA = a[sortKey as keyof typeof a];
                 const valB = b[sortKey as keyof typeof b];
                 
                 if (valA === valB) return 0;
                 if (valA === null || valA === undefined) return 1;
                 if (valB === null || valB === undefined) return -1;
                 
                 const multiplier = sortDir === 'asc' ? 1 : -1;
                 
                 if (typeof valA === 'string' && typeof valB === 'string') {
                     return valA.localeCompare(valB) * multiplier;
                 }
                 
                 return (valA < valB ? -1 : 1) * multiplier;
             });

             // 2. Pagination
             const page = Number(params?.page) || 1;
             const limit = Number(params?.limit) || 10;
             const startIndex = (page - 1) * limit;
             const endIndex = startIndex + limit;
             const paginated = sorted.slice(startIndex, endIndex);

             return {
                 data: paginated,
                 total: sorted.length,
                 page,
                 limit
             };
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
