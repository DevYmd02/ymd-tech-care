import api from '@/core/api/api';
import type { VEListParams, VEListResponse, CreateVEPayload, VendorEvaluationHeader } from '@/modules/procurement/types/ve-types';
import { logger } from '@/shared/utils/logger';

const ENDPOINTS = {
  list:    '/ve/list',
  create:  '/ve/create',
  detail:  (id: string) => `/ve/${id}`,
};

/**
 * 🧹 Helper to clean params before API call
 */
export const cleanParams = (params: object = {}): Record<string, string | number | boolean> => {
  const entries = Object.entries(params);
  const filtered = entries.filter(([, value]) => value !== undefined && value !== null && value !== '');
  const cleaned = Object.fromEntries(filtered) as Record<string, string | number | boolean>;
  
  if (!cleaned.page) cleaned.page = 1;
  if (!cleaned.limit) cleaned.limit = 20;

  return cleaned;
};

export const VEService = {
  getList: async (params?: VEListParams): Promise<VEListResponse> => {
    logger.info('[VEService] Fetching Vendor Evaluation List', params);
    const cleanedParams = cleanParams(params || {});
    return await api.get<VEListResponse>(ENDPOINTS.list, { params: cleanedParams });
  },

  getById: async (id: string): Promise<VendorEvaluationHeader> => {
    logger.info(`[VEService] Fetching Vendor Evaluation Detail: ${id}`);
    return await api.get<VendorEvaluationHeader>(ENDPOINTS.detail(id));
  },

  create: async (data: CreateVEPayload): Promise<{ evaluation_id: string }> => {
    logger.info('[VEService] Creating Vendor Evaluation', data);
    return await api.post<{ evaluation_id: string }>(ENDPOINTS.create, data);
  },
};
