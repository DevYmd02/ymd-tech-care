import api from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/modules/procurement/types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const BASE_URL = '/procurement/grn';

export const GRNService = {
    getList: async (params?: GRNListParams): Promise<GRNListResponse> => {
        logger.info('[GRNService] Fetching GRN List', params);
        return await api.get<GRNListResponse>(BASE_URL, { params });
    },

    getById: async (id: string): Promise<GRNListItem> => {
        logger.info(`[GRNService] Fetching GRN Detail: ${id}`);
        return await api.get<GRNListItem>(`${BASE_URL}/${id}`);
    },

    getSummaryCounts: async (): Promise<GRNSummaryCounts> => {
        logger.info('[GRNService] Fetching GRN Summary Counts');
        return await api.get<GRNSummaryCounts>(`${BASE_URL}/summary-status`);
    },

    create: async (data: CreateGRNPayload): Promise<SuccessResponse> => {
        logger.info('[GRNService] Creating GRN');
        return await api.post<SuccessResponse>(BASE_URL, data);
    }
};
