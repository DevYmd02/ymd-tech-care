/**
 * @file company.service.ts
 * @description Service for Company Master Data (Department, Section, Job, Employee, etc.)
 */

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
} from '@/types/master-data-types';
import {
  mockDepartments,
  mockSections,
  mockJobs,
  mockEmployeeGroups,
  mockPositions,
  mockSalesZones,
  mockSalesChannels,
  mockSalesTargets,
  mockEmployees,
} from '@/__mocks__/masterDataMocks';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// GENERIC HELPER (Private)
// ============================================================================
async function genericGetList<T>(mockData: T[]): Promise<T[]> {
  await delay(300);
  return [...mockData];
}

async function genericGet<T>(mockData: T[], idKey: keyof T, id: string): Promise<T | null> {
  await delay(200);
  const found = mockData.find((item: T) => String(item[idKey]) === id);
  return found || null;
}

async function genericCreate<T>(mockData: T[], data: T): Promise<{ success: boolean; data?: T; message?: string }> {
  await delay(500);
  mockData.push(data);
  return { success: true, data };
}

async function genericUpdate<T>(mockData: T[], idKey: keyof T, id: string, data: Partial<T>): Promise<{ success: boolean; data?: T; message?: string }> {
  await delay(500);
  const index = mockData.findIndex((item: T) => String(item[idKey]) === id);
  if (index !== -1) {
    mockData[index] = { ...mockData[index], ...data };
    return { success: true, data: mockData[index] };
  }
  return { success: false, message: 'Not found' };
}

async function genericDelete<T>(mockData: T[], idKey: keyof T, id: string): Promise<boolean> {
  await delay(300);
  const index = mockData.findIndex((item: T) => String(item[idKey]) === id);
  if (index !== -1) {
    mockData.splice(index, 1);
    return true;
  }
  return false;
}

// ============================================================================
// SERVICES
// ============================================================================

export const DepartmentService = {
  getList: () => genericGetList<DepartmentListItem>(mockDepartments),
  get: (id: string) => genericGet<DepartmentListItem>(mockDepartments, 'department_id', id),
  create: (data: DepartmentFormData) => genericCreate<DepartmentListItem>(mockDepartments, {
    department_id: `DEPT${Math.floor(Math.random() * 10000)}`,
    department_code: data.departmentCode,
    department_name: data.departmentName,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<DepartmentFormData>) => {
    const payload: Partial<DepartmentListItem> = {};
    if (data.departmentCode !== undefined) payload.department_code = data.departmentCode;
    if (data.departmentName !== undefined) payload.department_name = data.departmentName;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<DepartmentListItem>(mockDepartments, 'department_id', id, payload);
  },
  delete: (id: string) => genericDelete<DepartmentListItem>(mockDepartments, 'department_id', id),
};

export const SectionService = {
  getList: () => genericGetList<SectionListItem>(mockSections),
  get: (id: string) => genericGet<SectionListItem>(mockSections, 'section_id', id),
  create: (data: SectionFormData) => genericCreate<SectionListItem>(mockSections, {
    section_id: `SEC${Math.floor(Math.random() * 10000)}`,
    section_code: data.sectionCode,
    section_name: data.sectionName,
    department_id: data.departmentId,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<SectionFormData>) => {
    const payload: Partial<SectionListItem> = {};
    if (data.sectionCode !== undefined) payload.section_code = data.sectionCode;
    if (data.sectionName !== undefined) payload.section_name = data.sectionName;
    if (data.departmentId !== undefined) payload.department_id = data.departmentId;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<SectionListItem>(mockSections, 'section_id', id, payload);
  },
  delete: (id: string) => genericDelete<SectionListItem>(mockSections, 'section_id', id),
};

export const JobService = {
  getList: () => genericGetList<JobListItem>(mockJobs),
  get: (id: string) => genericGet<JobListItem>(mockJobs, 'job_id', id),
  create: (data: JobFormData) => genericCreate<JobListItem>(mockJobs, {
    job_id: `JOB${Math.floor(Math.random() * 10000)}`,
    job_code: data.jobCode,
    job_name: data.jobName,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<JobFormData>) => {
    const payload: Partial<JobListItem> = {};
    if (data.jobCode !== undefined) payload.job_code = data.jobCode;
    if (data.jobName !== undefined) payload.job_name = data.jobName;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<JobListItem>(mockJobs, 'job_id', id, payload);
  },
  delete: (id: string) => genericDelete<JobListItem>(mockJobs, 'job_id', id),
};

export const EmployeeGroupService = {
  getList: () => genericGetList<EmployeeGroupListItem>(mockEmployeeGroups),
  get: (id: string) => genericGet<EmployeeGroupListItem>(mockEmployeeGroups, 'group_id', id),
  create: (data: EmployeeGroupFormData) => genericCreate<EmployeeGroupListItem>(mockEmployeeGroups, {
    group_id: `EGRP${Math.floor(Math.random() * 10000)}`,
    group_code: data.groupCode,
    group_name: data.groupName,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<EmployeeGroupFormData>) => {
    const payload: Partial<EmployeeGroupListItem> = {};
    if (data.groupCode !== undefined) payload.group_code = data.groupCode;
    if (data.groupName !== undefined) payload.group_name = data.groupName;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<EmployeeGroupListItem>(mockEmployeeGroups, 'group_id', id, payload);
  },
  delete: (id: string) => genericDelete<EmployeeGroupListItem>(mockEmployeeGroups, 'group_id', id),
};

export const PositionService = {
  getList: () => genericGetList<PositionListItem>(mockPositions),
  get: (id: string) => genericGet<PositionListItem>(mockPositions, 'position_id', id),
  create: (data: PositionFormData) => genericCreate<PositionListItem>(mockPositions, {
    position_id: `POS${Math.floor(Math.random() * 10000)}`,
    position_code: data.positionCode,
    position_name: data.positionName,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<PositionFormData>) => {
    const payload: Partial<PositionListItem> = {};
    if (data.positionCode !== undefined) payload.position_code = data.positionCode;
    if (data.positionName !== undefined) payload.position_name = data.positionName;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<PositionListItem>(mockPositions, 'position_id', id, payload);
  },
  delete: (id: string) => genericDelete<PositionListItem>(mockPositions, 'position_id', id),
};

export const SalesZoneService = {
  getList: () => genericGetList<SalesZoneListItem>(mockSalesZones),
  get: (id: string) => genericGet<SalesZoneListItem>(mockSalesZones, 'zone_id', id),
  create: (data: SalesZoneFormData) => genericCreate<SalesZoneListItem>(mockSalesZones, {
    zone_id: `SZ${Math.floor(Math.random() * 10000)}`,
    zone_code: data.zoneCode,
    zone_name: data.zoneName,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<SalesZoneFormData>) => {
    const payload: Partial<SalesZoneListItem> = {};
    if (data.zoneCode !== undefined) payload.zone_code = data.zoneCode;
    if (data.zoneName !== undefined) payload.zone_name = data.zoneName;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<SalesZoneListItem>(mockSalesZones, 'zone_id', id, payload);
  },
  delete: (id: string) => genericDelete<SalesZoneListItem>(mockSalesZones, 'zone_id', id),
};

export const SalesChannelService = {
  getList: () => genericGetList<SalesChannelListItem>(mockSalesChannels),
  get: (id: string) => genericGet<SalesChannelListItem>(mockSalesChannels, 'channel_id', id),
  create: (data: SalesChannelFormData) => genericCreate<SalesChannelListItem>(mockSalesChannels, {
    channel_id: `SC${Math.floor(Math.random() * 10000)}`,
    channel_code: data.channelCode,
    channel_name: data.channelName,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<SalesChannelFormData>) => {
    const payload: Partial<SalesChannelListItem> = {};
    if (data.channelCode !== undefined) payload.channel_code = data.channelCode;
    if (data.channelName !== undefined) payload.channel_name = data.channelName;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<SalesChannelListItem>(mockSalesChannels, 'channel_id', id, payload);
  },
  delete: (id: string) => genericDelete<SalesChannelListItem>(mockSalesChannels, 'channel_id', id),
};

export const SalesTargetService = {
  getList: () => genericGetList<SalesTargetListItem>(mockSalesTargets),
  get: (id: string) => genericGet<SalesTargetListItem>(mockSalesTargets, 'target_id', id),
  create: (data: SalesTargetFormData) => genericCreate<SalesTargetListItem>(mockSalesTargets, {
    target_id: `STG${Math.floor(Math.random() * 10000)}`,
    target_code: data.targetCode,
    target_name: data.targetName,
    amount: data.amount,
    year: data.year,
    period: data.period,
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<SalesTargetFormData>) => {
    const payload: Partial<SalesTargetListItem> = {};
    if (data.targetCode !== undefined) payload.target_code = data.targetCode;
    if (data.targetName !== undefined) payload.target_name = data.targetName;
    if (data.amount !== undefined) payload.amount = data.amount;
    if (data.year !== undefined) payload.year = data.year;
    if (data.period !== undefined) payload.period = data.period;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    payload.updated_at = new Date().toISOString();
    return genericUpdate<SalesTargetListItem>(mockSalesTargets, 'target_id', id, payload);
  },
  delete: (id: string) => genericDelete<SalesTargetListItem>(mockSalesTargets, 'target_id', id),
};

export const EmployeeService = {
  getList: () => genericGetList<EmployeeListItem>(mockEmployees),
  get: (id: string) => genericGet<EmployeeListItem>(mockEmployees, 'employee_id', id),
  create: (data: EmployeeFormData) => genericCreate<EmployeeListItem>(mockEmployees, {
    employee_id: `EMP${Math.floor(Math.random() * 10000)}`,
    employee_code: data.employeeCode,
    employee_name: `${data.firstName} ${data.lastName}`,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    position_id: data.positionId,
    department_id: data.departmentId,
    status: data.isActive ? 'ACTIVE' : 'SUSPENDED',
    is_active: data.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  update: (id: string, data: Partial<EmployeeFormData>) => {
    const payload: Partial<EmployeeListItem> = {};
    if (data.employeeCode !== undefined) payload.employee_code = data.employeeCode;
    if (data.firstName !== undefined || data.lastName !== undefined) {
       // Logic to handle partial name update if needed, but simple map for now
       if (data.firstName) payload.first_name = data.firstName;
       if (data.lastName) payload.last_name = data.lastName;
       payload.employee_name = `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
    }
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.positionId !== undefined) payload.position_id = data.positionId;
    if (data.departmentId !== undefined) payload.department_id = data.departmentId;
    if (data.isActive !== undefined) {
        payload.is_active = data.isActive;
        payload.status = data.isActive ? 'ACTIVE' : 'SUSPENDED';
    }
    payload.updated_at = new Date().toISOString();
    return genericUpdate<EmployeeListItem>(mockEmployees, 'employee_id', id, payload);
  },
  delete: (id: string) => genericDelete<EmployeeListItem>(mockEmployees, 'employee_id', id),
};
