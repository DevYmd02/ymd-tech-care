import api from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '@/modules/procurement/types/rfq-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

export const RFQService = {
  getList: async (params?: RFQFilterCriteria): Promise<RFQListResponse> => {
    logger.info('[RFQService] Fetching RFQ List', params);
    return await api.get<RFQListResponse>(ENDPOINTS.list, { params });
  },

  getById: async (id: string): Promise<RFQHeader> => {
    logger.info(`[RFQService] Fetching RFQ Detail: ${id}`);
    return await api.get<RFQHeader>(ENDPOINTS.detail(id));
  },

  create: async (data: RFQCreateData): Promise<RFQHeader> => {
    logger.info('[RFQService] Creating RFQ');
    return await api.post<RFQHeader>(ENDPOINTS.create, data);
  },

  update: async (id: string, data: Partial<RFQCreateData>): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Updating RFQ: ${id}`);
    return await api.put<SuccessResponse>(ENDPOINTS.detail(id), data);
  },

  delete: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Deleting RFQ: ${id}`);
    return await api.delete<SuccessResponse>(ENDPOINTS.detail(id));
  },

  sendToVendors: async (rfqId: string, vendorIds: string[]): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Sending RFQ ${rfqId} to vendors`);
    return await api.post<SuccessResponse>(ENDPOINTS.sendToVendors(rfqId), { vendor_ids: vendorIds });
  }
};
