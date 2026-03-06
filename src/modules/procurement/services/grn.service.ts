import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/modules/procurement/types';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const BASE_URL = '/procurement/grn';

export const GRNService = {
    getList: async (params?: GRNListParams): Promise<GRNListResponse> => {
        logger.info('[GRNService] Fetching GRN List', params);
        const response = await api.get<GRNListResponse>(BASE_URL, { params });

        // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
        if (!USE_MOCK && params) {
            const allItems = extractArrayFromResponse<GRNListItem>(response);
            const filterParams: Record<string, string | number | boolean | undefined | null> = {};
            if (params.grn_no) filterParams.grn_no = params.grn_no;
            if (params.po_no) filterParams.po_no = params.po_no;
            if (params.status && params.status !== 'ALL') filterParams.status = params.status;
            if (params.date_from) filterParams.date_from = params.date_from;
            if (params.date_to) filterParams.date_to = params.date_to;
            if (params.page) filterParams.page = params.page;
            if (params.limit) filterParams.limit = params.limit;
            if (params.sort) filterParams.sort = params.sort;

            return applyClientFilters<GRNListItem>(allItems, filterParams, {
                searchableFields: ['grn_no', 'po_no'],
                dateField: 'received_date',
            });
        }

        // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
        const allItems = extractArrayFromResponse<GRNListItem>(response);
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        return applyClientPagination<GRNListItem>(allItems, page, limit);
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
