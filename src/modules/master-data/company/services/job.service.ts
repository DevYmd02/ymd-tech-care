/**
 * @file job.service.ts
 * @description Service for Job (งาน) master data
 */

import api from '@/core/api/api';
import type { JobMaster, JobFormData } from '@/modules/master-data/company/types/job.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const JobService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<JobMaster>>('/org-jobs', { params }),
  get: (id: number) => api.get<JobMaster>(`/org-jobs/${id}`),
  create: (data: JobFormData) => api.post<{ success: boolean; data?: JobMaster; message?: string }>('/org-jobs', data),
  update: (id: number, data: Partial<JobFormData>) => api.put<{ success: boolean; data?: JobMaster; message?: string }>(`/org-jobs/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/org-jobs/${id}`),
};
