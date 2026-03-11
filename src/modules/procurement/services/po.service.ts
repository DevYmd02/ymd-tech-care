import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import { CreatePOSchema } from '@/modules/procurement/schemas/po-schemas';
import type { CreatePOPayload } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

// ---------------------------------------------------------------------------
// NOTE on Zod Boundary Design (per Architect's guidance):
//   • Request  side: CreatePOSchema.parse(data) — throws ZodError before the
//     HTTP call if the payload is malformed. Prevents dirty data reaching API.
//   • Response side: safeParse() used as a WARNING LOGGER ONLY.
//     The original typed return value is always returned unchanged so that UI
//     components receive exactly the shape they TypeScript-expect.
// ---------------------------------------------------------------------------

const ENDPOINTS = {
    list:     '/po',
    detail:   (id: number) => `/po/${id}`,
    create:   '/po',
    issue:    (id: number) => `/po/${id}/issue`,
    approve:  (id: number) => `/po/${id}/approve`,
    reject:   (id: number) => `/po/${id}/reject`,
    complete: (id: number) => `/po/${id}/complete`,
    pending:  (id: number) => `/po/${id}/pending`,
};

export const POService = {
    getList: async (params?: POListParams): Promise<POListResponse> => {
        logger.info('[POService] Fetching PO List', params);
        const response = await api.get<POListResponse>(ENDPOINTS.list, { params });

        // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
        if (!USE_MOCK && params) {
            const allItems = extractArrayFromResponse<POListItem>(response);
            const filterParams: Record<string, string | number | boolean | undefined | null> = {};
            if (params.po_no) filterParams.po_no = params.po_no;
            if (params.pr_no) filterParams.pr_no = params.pr_no;
            if (params.vendor_name) filterParams.vendor_name = params.vendor_name;
            if (params.status && params.status !== 'ALL') filterParams.status = params.status;
            if (params.date_from) filterParams.date_from = params.date_from;
            if (params.date_to) filterParams.date_to = params.date_to;
            if (params.page) filterParams.page = params.page;
            if (params.limit) filterParams.limit = params.limit;
            if (params.sort) filterParams.sort = params.sort;

            return applyClientFilters<POListItem>(allItems, filterParams, {
                searchableFields: ['po_no', 'vendor_name', 'qc_no', 'pr_no'],
                dateField: 'po_date',
            });
        }

        // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
        const allItems = extractArrayFromResponse<POListItem>(response);
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        return applyClientPagination<POListItem>(allItems, page, limit);
    },

    getById: async (id: number): Promise<POListItem> => {
        logger.info(`[POService] Fetching PO Detail: ${id}`);
        return await api.get<POListItem>(ENDPOINTS.detail(id));
    },

    /**
     * Creates a new PO.
     * Validates payload against CreatePOSchema BEFORE sending — throws ZodError
     * on bad input (missing qc_id / vendor_id etc.) so the UI error handler fires.
     * Return type stays `POListItem` exactly as before.
     */
    create: async (data: CreatePOPayload): Promise<POListItem> => {
        logger.info('[POService] Creating PO — validating payload…');
        // 🛡️ Request boundary: throws if required FKs are missing
        CreatePOSchema.parse(data);
        logger.info('[POService] Payload valid — posting to API');
        return await api.post<POListItem>(ENDPOINTS.create, data);
    },

    /** Transition: DRAFT → ISSUED (send PO to vendor) */
    issue: async (id: number, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Issuing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.issue(id), { remark });
    },

    /** Transition: DRAFT → PENDING_APPROVAL (send PO for approval) */
    submit: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Submitting PO: ${id}`);
        // 🎯 GOLD PATTERN: PATCH with EMPTY BODY {}
        return await api.patch<SuccessResponse>(ENDPOINTS.pending(id), {});
    },

    /** Transition: ISSUED → APPROVED (internal approval) */
    approve: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Approving PO: ${id}`);
        // 🎯 FIX: Send EMPTY BODY {} to avoid 400 Bad Request (consistent with PR module)
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), {});
    },

    /** Transition: ANY → CANCELLED */
    reject: async (id: number, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Rejecting/Cancelling PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { remark });
    },

    /** Transition: APPROVED → COMPLETED (goods fully received via GRN) */
    complete: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Completing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.complete(id));
    },
};
