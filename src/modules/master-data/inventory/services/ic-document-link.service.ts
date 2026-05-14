import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils';
import { mockICDocumentLinks } from '@/modules/master-data/mocks/masterDataMocks';
import type { 
    ICDocumentLinkListItem, 
    ICDocumentLinkMaster, 
    ICDocumentLinkFormData,
    BackendICDocumentLink 
} from '@/modules/master-data/types/master-data-types';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';
import { normalizeListResponse, unwrapResponseData } from '@/shared/utils/apiUtils';

export const ICDocumentLinkService = {
  getAll: async (params?: unknown, config?: AxiosRequestConfig): Promise<ListResponse<ICDocumentLinkListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving IC Document Link List');
       return {
           items: mockICDocumentLinks,
           total: mockICDocumentLinks.length,
           page: 1,
           limit: 10
       };
    }
    try {
      const response = await api.get<unknown>('/ic-document-link', { ...config, params });
      const normalized = normalizeListResponse<BackendICDocumentLink>(response);
      
      const items: ICDocumentLinkListItem[] = normalized.items.map(item => ({
          ...item,
          id: item.docu_type_id,
          is_active: item.is_active ?? true,
      }));
      
      return { 
          items, 
          total: normalized.total, 
          page: normalized.page, 
          limit: normalized.limit 
      };
    } catch (error) {
      logger.error('[ICDocumentLinkService] getAll error:', error);
      return { items: [], total: 0, page: 1, limit: 10 };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/ic-document-link/${id}`);
      return true;
    } catch (error) {
      logger.error('[ICDocumentLinkService] delete error:', error);
      return false;
    }
  },

  getById: async (id: string, config?: AxiosRequestConfig): Promise<ICDocumentLinkMaster | null> => {
    if (USE_MOCK) {
        return mockICDocumentLinks.find(w => w.docu_type_id === id) as ICDocumentLinkMaster || null;
    }
    try {
        const res = await api.get<unknown>(`/ic-document-link/${id}`, config);
        return unwrapResponseData<ICDocumentLinkMaster>(res);
    } catch (error) {
        logger.error('[ICDocumentLinkService] getById error:', error);
        return null;
    }
  },

  create: async (data: ICDocumentLinkFormData): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Create IC Document Link', data);
        return { success: true, message: 'Created mock successfully' };
    }
    try {
        await api.post('/ic-document-link', data);
        return { success: true };
    } catch (error) {
        logger.error('[ICDocumentLinkService] create error:', error);
        return { success: false, message: 'Failed to create' };
    }
  },

  update: async (id: string, data: Partial<ICDocumentLinkFormData>): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Update IC Document Link', id, data);
        return { success: true, message: 'Updated mock successfully' };
    }
    try {
        await api.patch(`/ic-document-link/${id}`, data);
        return { success: true };
    } catch (error) {
        logger.error('[ICDocumentLinkService] update error:', error);
        return { success: false, message: 'Failed to update' };
    }
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Toggle IC Document Link Status', id, isActive);
        return { success: true };
    }
    try {
        await api.patch(`/ic-document-link/${id}/status`, { is_active: isActive });
        return { success: true };
    } catch (error) {
        logger.error('[ICDocumentLinkService] toggleStatus error:', error);
        return { success: false, message: 'Failed to toggle status' };
    }
  }
};
