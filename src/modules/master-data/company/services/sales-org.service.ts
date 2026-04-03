/**
 * @file sales-org.service.ts
 * @description Service for managing Sales Organization Master Data (Zone, Target, Channel)
 */

import api from '@/core/api/api';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type SaleAreaMaster as SalesZoneMaster, type SaleAreaFormData as SalesZoneFormData } from '@/modules/master-data/sales/types/area/area.types';
import { type SalesChannelMaster, type SalesChannelFormData } from '@/modules/master-data/sales/types/channel/channel.types';
import { type SalePeriodMaster, type SalePeriodFormData } from '@/modules/master-data/sales/types/target/sale-period.types';

// ====================================================================================
// SALES ZONE SERVICE
// ====================================================================================

export const SalesZoneService = {
  getList: (params?: Record<string, string | number | boolean>) => api.get<SalesZoneMaster[]>('/master/sales-zones', { params }),
  get: (id: string | number) => api.get<SalesZoneMaster>(`/master/sales-zones/${id}`),
  create: async (data: SalesZoneFormData): Promise<{ success: boolean; data?: SalesZoneMaster; message?: string }> => {
    try {
      const response = await api.post<SalesZoneMaster>('/master/sales-zones', data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },
  update: async (id: string | number, data: Partial<SalesZoneFormData>): Promise<{ success: boolean; data?: SalesZoneMaster; message?: string }> => {
    try {
      const response = await api.put<SalesZoneMaster>(`/master/sales-zones/${id}`, data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(`/master/sales-zones/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};

// ====================================================================================
// SALES CHANNEL SERVICE
// ====================================================================================

export const SalesChannelService = {
  getList: (params?: Record<string, string | number | boolean>) => api.get<SalesChannelMaster[]>('/master/sales-channels', { params }),
  get: (id: string | number) => api.get<SalesChannelMaster>(`/master/sales-channels/${id}`),
  create: async (data: SalesChannelFormData): Promise<{ success: boolean; data?: SalesChannelMaster; message?: string }> => {
    try {
      const response = await api.post<SalesChannelMaster>('/master/sales-channels', data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },
  update: async (id: string | number, data: Partial<SalesChannelFormData>): Promise<{ success: boolean; data?: SalesChannelMaster; message?: string }> => {
    try {
      const response = await api.put<SalesChannelMaster>(`/master/sales-channels/${id}`, data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(`/master/sales-channels/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};

// ====================================================================================
// SALES TARGET SERVICE (Sale Period)
// ====================================================================================

export const SalesTargetService = {
  getList: (params?: Record<string, string | number | boolean>) => api.get<PaginatedListResponse<SalePeriodMaster>>('/employees-sale-period', { params }),
  get: (id: string | number) => api.get<SalePeriodMaster>(`/employees-sale-period/${id}`),
  create: async (data: SalePeriodFormData): Promise<{ success: boolean; data?: SalePeriodMaster; message?: string }> => {
    try {
      const response = await api.post<SalePeriodMaster>('/employees-sale-period', data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },
  update: async (id: string | number, data: Partial<SalePeriodFormData>): Promise<{ success: boolean; data?: SalePeriodMaster; message?: string }> => {
    try {
      const response = await api.patch<SalePeriodMaster>(`/employees-sale-period/${id}`, data);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(`/employees-sale-period/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
