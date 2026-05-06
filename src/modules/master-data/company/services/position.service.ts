/**
 * @file position.service.ts
 * @description Service for Position (ตำแหน่ง) master data
 */

import api from '@/core/api/api';
import type { PositionMaster, PositionFormData } from '@/modules/master-data/company/types/position.types';
import { type PaginatedListResponse } from '@/shared/types/api.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const PositionService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<PositionMaster>>('/org-positions', { params }),
  get: (id: number) => api.get<PositionMaster>(`/org-positions/${id}`),
  create: (data: PositionFormData) => api.post<{ success: boolean; data?: PositionMaster; message?: string }>('/org-positions', data),
  update: (id: number, data: Partial<PositionFormData>) => api.put<{ success: boolean; data?: PositionMaster; message?: string }>(`/org-positions/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/org-positions/${id}`),
};
