/**
 * @file poa.service.ts
 * @description Service for Purchase Order Approval (POA) module
 */
import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import type { POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
    list: '/po',
    detail: (id: number) => `/po/${id}`,
    update: (id: number) => `/po/${id}`,
    approve: (id: number) => `/po/${id}/approve`,
    reject: (id: number) => `/po/${id}/reject`,
    bulkApprove: '/po/bulk-approve', // If exists, otherwise we'll map over array
};

export const POAService = {
    /** Fetch only PENDING_APPROVAL POs for the POA list */
    getList: async (params?: POListParams): Promise<POListResponse> => {
        logger.info('[POAService] Fetching POA List (status: PENDING_APPROVAL)', params);
        // Force status to PENDING_APPROVAL for the approval list
        const queryParams = { ...params, status: 'PENDING_APPROVAL' };
        
        const response = await api.get<POListResponse>(ENDPOINTS.list, { params: queryParams });

        const rawItems = extractArrayFromResponse<POListItem>(response);
        const allItems = rawItems.map(item => ({
            ...item,
            po_id: item.po_id ?? (item as unknown as { po_header_id?: number }).po_header_id as number
        }));

        if (!USE_MOCK && params) {
            const filterParams: Record<string, string | number | boolean | undefined | null> = {};
            if (params.po_no) filterParams.po_no = params.po_no;
            if (params.pr_no) filterParams.pr_no = params.pr_no;
            if (params.vendor_name) filterParams.vendor_name = params.vendor_name;
            filterParams.status = 'PENDING_APPROVAL';
            if (params.date_from) filterParams.date_from = params.date_from;
            if (params.date_to) filterParams.date_to = params.date_to;
            if (params.page) filterParams.page = params.page;
            if (params.limit) filterParams.limit = params.limit;
            if (params.sort) filterParams.sort = params.sort;

            return applyClientFilters<POListItem>(allItems, filterParams, {
                searchableFields: ['po_no', 'vendor_name', 'qc_no', 'pr_no'],
                dateField: 'po_date',
                backendTotal: response.total
            });
        }

        const page = params?.page || 1;
        const limit = params?.limit || 20;
        return applyClientPagination<POListItem>(allItems, page, limit, response.total);
    },

    getById: async (id: number): Promise<POListItem> => {
        logger.info(`[POAService] Fetching POA Detail: ${id}`);
        const res = await api.get<POListItem>(ENDPOINTS.detail(id));
        return {
            ...res,
            po_id: res.po_id ?? (res as unknown as { po_header_id?: number }).po_header_id as number
        };
    },

    /** Update PO details (quantity, remark) before approval */
    update: async (id: number, data: Partial<POAFormData>): Promise<SuccessResponse> => {
        logger.info(`[POAService] Updating PO before approval: ${id}`);
        return await api.put<SuccessResponse>(ENDPOINTS.update(id), data);
    },

    /** Approve PO */
    approve: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POAService] Approving PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), {});
    },

    /** Reject/Cancel PO */
    reject: async (id: number, reject_reason?: string): Promise<SuccessResponse> => {
        logger.info(`[POAService] Rejecting PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { reject_reason });
    },
    
    /** Bulk Approve POs (if API supports, otherwise loop) */
    bulkApprove: async (ids: number[]): Promise<SuccessResponse[]> => {
        logger.info(`[POAService] Bulk Approving POs:`, ids);
        // Implementing sequentially to ensure compatibility if bulk endpoint isn't ready
        const results = [];
        for (const id of ids) {
            results.push(await POAService.approve(id));
        }
        return results;
    }
};
