/**
 * @file position.service.ts
 * @description Service for Position (ตำแหน่ง) master data
 */

import api from '@/core/api/api';
import type { PositionMaster, PositionPayload } from '@/modules/master-data/company/types/position.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const PositionService = {
  getList: (params?: Partial<TableFilters>) => api.get<PositionMaster[]>('/org-position', { params }),
  get: (id: number) => api.get<PositionMaster>(`/org-position/${id}`),
  create: (data: PositionPayload) => api.post<unknown>('/org-position', data),
  update: (id: number, data: Partial<PositionPayload>) => api.put<unknown>(`/org-position/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/org-position/${id}`),
};
