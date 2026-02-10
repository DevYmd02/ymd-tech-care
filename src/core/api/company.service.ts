import api from '@/core/api/api';
import {
  type DepartmentListItem,
  type SectionListItem,
  type JobListItem,
  type EmployeeGroupListItem,
  type PositionListItem,
  type SalesZoneListItem,
  type SalesChannelListItem,
  type SalesTargetListItem,
  type EmployeeListItem,
  type DepartmentFormData,
  type SectionFormData,
  type JobFormData,
  type EmployeeGroupFormData,
  type PositionFormData,
  type SalesZoneFormData,
  type SalesChannelFormData,
  type SalesTargetFormData,
  type EmployeeFormData,
} from '@/modules/master-data/types/master-data-types';

// ============================================================================
// SERVICES
// ============================================================================

export const DepartmentService = {
  getList: () => api.get<DepartmentListItem[]>('/org-departments'),
  get: (id: string) => api.get<DepartmentListItem>(`/org-departments/${id}`),
  create: (data: DepartmentFormData) => api.post<{ success: boolean; data?: DepartmentListItem }>('/org-departments', data),
  update: (id: string, data: Partial<DepartmentFormData>) => api.put<{ success: boolean; data?: DepartmentListItem }>(`/org-departments/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-departments/${id}`),
};

export const SectionService = {
  getList: () => api.get<SectionListItem[]>('/org-sections'),
  get: (id: string) => api.get<SectionListItem>(`/org-sections/${id}`),
  create: (data: SectionFormData) => api.post<{ success: boolean; data?: SectionListItem }>('/org-sections', data),
  update: (id: string, data: Partial<SectionFormData>) => api.put<{ success: boolean; data?: SectionListItem }>(`/org-sections/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-sections/${id}`),
};

export const JobService = {
  getList: () => api.get<JobListItem[]>('/org-jobs'),
  get: (id: string) => api.get<JobListItem>(`/org-jobs/${id}`),
  create: (data: JobFormData) => api.post<{ success: boolean; data?: JobListItem }>('/org-jobs', data),
  update: (id: string, data: Partial<JobFormData>) => api.put<{ success: boolean; data?: JobListItem }>(`/org-jobs/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-jobs/${id}`),
};

export const EmployeeGroupService = {
  getList: () => api.get<EmployeeGroupListItem[]>('/org-employee-groups'),
  get: (id: string) => api.get<EmployeeGroupListItem>(`/org-employee-groups/${id}`),
  create: (data: EmployeeGroupFormData) => api.post<{ success: boolean; data?: EmployeeGroupListItem }>('/org-employee-groups', data),
  update: (id: string, data: Partial<EmployeeGroupFormData>) => api.put<{ success: boolean; data?: EmployeeGroupListItem }>(`/org-employee-groups/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-employee-groups/${id}`),
};

export const PositionService = {
  getList: () => api.get<PositionListItem[]>('/org-positions'),
  get: (id: string) => api.get<PositionListItem>(`/org-positions/${id}`),
  create: (data: PositionFormData) => api.post<{ success: boolean; data?: PositionListItem }>('/org-positions', data),
  update: (id: string, data: Partial<PositionFormData>) => api.put<{ success: boolean; data?: PositionListItem }>(`/org-positions/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-positions/${id}`),
};

export const SalesZoneService = {
  getList: () => api.get<SalesZoneListItem[]>('/org-sales-zones'),
  get: (id: string) => api.get<SalesZoneListItem>(`/org-sales-zones/${id}`),
  create: (data: SalesZoneFormData) => api.post<{ success: boolean; data?: SalesZoneListItem }>('/org-sales-zones', data),
  update: (id: string, data: Partial<SalesZoneFormData>) => api.put<{ success: boolean; data?: SalesZoneListItem }>(`/org-sales-zones/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-sales-zones/${id}`),
};

export const SalesChannelService = {
  getList: () => api.get<SalesChannelListItem[]>('/org-sales-channels'),
  get: (id: string) => api.get<SalesChannelListItem>(`/org-sales-channels/${id}`),
  create: (data: SalesChannelFormData) => api.post<{ success: boolean; data?: SalesChannelListItem }>('/org-sales-channels', data),
  update: (id: string, data: Partial<SalesChannelFormData>) => api.put<{ success: boolean; data?: SalesChannelListItem }>(`/org-sales-channels/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-sales-channels/${id}`),
};

export const SalesTargetService = {
  getList: () => api.get<SalesTargetListItem[]>('/org-sales-targets'),
  get: (id: string) => api.get<SalesTargetListItem>(`/org-sales-targets/${id}`),
  create: (data: SalesTargetFormData) => api.post<{ success: boolean; data?: SalesTargetListItem }>('/org-sales-targets', data),
  update: (id: string, data: Partial<SalesTargetFormData>) => api.put<{ success: boolean; data?: SalesTargetListItem }>(`/org-sales-targets/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-sales-targets/${id}`),
};

export const EmployeeService = {
  getList: () => api.get<EmployeeListItem[]>('/org-employees'),
  get: (id: string) => api.get<EmployeeListItem>(`/org-employees/${id}`),
  create: (data: EmployeeFormData) => api.post<{ success: boolean; data?: EmployeeListItem }>('/org-employees', data),
  update: (id: string, data: Partial<EmployeeFormData>) => api.put<{ success: boolean; data?: EmployeeListItem }>(`/org-employees/${id}`, data),
  delete: (id: string) => api.delete<boolean>(`/org-employees/${id}`),
};
