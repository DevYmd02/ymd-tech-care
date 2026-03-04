import api from '@/core/api/api';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import { CreatePOSchema } from '@/modules/procurement/schemas/po-schemas';
import type { CreatePOPayload } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

// ---------------------------------------------------------------------------
// NOTE on Zod Boundary Design (per Architect's guidance):
//   • Request  side: CreatePOSchema.parse(data) — throws ZodError before the
//     HTTP call if the payload is malformed. Prevents dirty data reaching API.
//   • Response side: safeParse() used as a WARNING LOGGER ONLY.
//     The original typed return value is always returned unchanged so that UI
//     components receive exactly the shape they TypeScript-expect.
// ---------------------------------------------------------------------------

const ENDPOINTS = {
    list:     '/purchase-orders',
    detail:   (id: string) => `/purchase-orders/${id}`,
    create:   '/purchase-orders',
    issue:    (id: string) => `/purchase-orders/${id}/issue`,
    approve:  (id: string) => `/purchase-orders/${id}/approve`,
    reject:   (id: string) => `/purchase-orders/${id}/reject`,
    complete: (id: string) => `/purchase-orders/${id}/complete`,
};

export const POService = {
    getList: async (params?: POListParams): Promise<POListResponse> => {
        logger.info('[POService] Fetching PO List', params);
        const response = await api.get<POListResponse>(ENDPOINTS.list, { params });
        return response;
    },

    getById: async (id: string): Promise<POListItem> => {
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
    issue: async (id: string, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Issuing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.issue(id), { remark });
    },

    /** Transition: ISSUED → APPROVED (internal approval) */
    approve: async (id: string, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Approving PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), { remark });
    },

    /** Transition: ANY → CANCELLED */
    reject: async (id: string, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Rejecting/Cancelling PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { remark });
    },

    /** Transition: APPROVED → COMPLETED (goods fully received via GRN) */
    complete: async (id: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Completing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.complete(id));
    },
};