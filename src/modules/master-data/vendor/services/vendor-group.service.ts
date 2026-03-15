import api, { USE_MOCK } from '@/core/api/api';
import type { VendorGroupMaster, VendorGroupFormData } from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_VENDOR_GROUPS } from '../mocks/vendor-group.mock';
import type { SuccessResponse } from '@/shared/types/api-response.types';

import type { ListResponse } from '@/shared/types/common-api.types';

// Local in-memory store
const localVendorGroups: ListResponse<VendorGroupMaster> = { ...MOCK_VENDOR_GROUPS };

export const VendorGroupService = {
    /**
     * Get all vendor groups
     */
    getAll: async (): Promise<ListResponse<VendorGroupMaster>> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Vendor Groups');
            return localVendorGroups; 
        }
        try {
            const response = await api.get<ListResponse<VendorGroupMaster> | VendorGroupMaster[]>('/vendor-group');
            
            // Handle raw array response or wrapped ListResponse
            if (Array.isArray(response)) {
                return {
                    items: response,
                    total: response.length
                };
            }
            
            return response || { items: [], total: 0 };
        } catch (error) {
            logger.error('[VendorGroupService] getAll error:', error);
            return { items: [], total: 0 };
        }
    },

    /**
     * Get vendor group by ID
     */
    getById: async (id: number): Promise<VendorGroupMaster | null> => {
        if (USE_MOCK) {
            const vendorGroup = localVendorGroups.items.find(vg => vg.vendor_group_id === id);
            if (vendorGroup) {
                logger.info(`🎭 [Mock Mode] Serving Vendor Group: ${id}`);
                return vendorGroup;
            }
            return null;
        }
        try {
            // API Interceptor unwraps { success: true, data: VendorGroupMaster } -> returns VendorGroupMaster
            return await api.get<VendorGroupMaster>(`/vendor-group/${id}`);
        } catch (error) {
            logger.error('[VendorGroupService] getById error:', error);
            return null;
        }
    },

    /**
     * Create new vendor group
     */
    create: async (data: VendorGroupFormData): Promise<{ success: boolean; data?: VendorGroupMaster; message?: string }> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Creating Vendor Group', data);
            const newId = Date.now();
            const newVendorGroup: VendorGroupMaster = {
                vendor_group_id: newId,
                id: newId,
                vendor_group_code: data.groupCode.toUpperCase(),
                code: data.groupCode.toUpperCase(),
                vendor_group_name: data.groupName,
                name_th: data.groupName,
                vendor_group_nameeng: data.groupNameEn,
                is_active: data.isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            localVendorGroups.items.unshift(newVendorGroup);
            localVendorGroups.total++;
            return { success: true, data: newVendorGroup };
        }
        try {
            // API Interceptor unwraps { success: true, data: VendorGroupMaster } -> returns VendorGroupMaster
            const response = await api.post<VendorGroupMaster>('/vendor-group', data);
            return { success: true, data: response };
        } catch (error) {
            logger.error('[VendorGroupService] create error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างกลุ่มเจ้าหนี้' };
        }
    },

    /**
     * Update vendor group
     */
    update: async (id: number, data: VendorGroupFormData): Promise<{ success: boolean; data?: VendorGroupMaster; message?: string }> => {
        if (USE_MOCK) {
            const index = localVendorGroups.items.findIndex(vg => vg.vendor_group_id === id);
            if (index !== -1) {
                localVendorGroups.items[index] = {
                    ...localVendorGroups.items[index],
                    vendor_group_code: data.groupCode.toUpperCase(),
                    code: data.groupCode.toUpperCase(),
                    vendor_group_name: data.groupName,
                    name_th: data.groupName,
                    vendor_group_nameeng: data.groupNameEn,
                    is_active: data.isActive,
                    updated_at: new Date().toISOString(),
                };
                return { success: true, data: localVendorGroups.items[index] };
            }
            return { success: false, message: 'ไม่พบกลุ่มเจ้าหนี้' };
        }
        try {
            // API Interceptor unwraps { success: true, data: VendorGroupMaster } -> returns VendorGroupMaster
            const response = await api.put<VendorGroupMaster>(`/vendor-group/${id}`, data);
            return { success: true, data: response };
        } catch (error) {
            logger.error('[VendorGroupService] update error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตกลุ่มเจ้าหนี้' };
        }
    },

    /**
     * Delete vendor group
     */
    delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK) {
            const initialLength = localVendorGroups.items.length;
            localVendorGroups.items = localVendorGroups.items.filter(vg => vg.vendor_group_id !== id);
            if (localVendorGroups.items.length < initialLength) {
                localVendorGroups.total--;
                return { success: true };
            }
            return { success: false, message: 'ไม่พบกลุ่มเจ้าหนี้' };
        }
        try {
            await api.delete<SuccessResponse>(`/vendor-group/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[VendorGroupService] delete error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบกลุ่มเจ้าหนี้' };
        }
    },
};
