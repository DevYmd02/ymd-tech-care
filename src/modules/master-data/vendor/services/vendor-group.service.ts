import api, { USE_MOCK } from '@/core/api/api';
import type { VendorGroupMaster, VendorGroupFormData } from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';

// Mock Data
const MOCK_VENDOR_GROUPS: VendorGroupMaster[] = [
    {
        vendor_group_id: 'VGRP-FUR',
        vendor_group_code: 'VGRP-FUR',
        vendor_group_name: 'กลุ่มเฟอร์นิเจอร์',
        vendor_group_name_en: 'Furniture Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_group_id: 'VGRP-STA',
        vendor_group_code: 'VGRP-STA',
        vendor_group_name: 'กลุ่มเครื่องเขียน',
        vendor_group_name_en: 'Stationery Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_group_id: 'VGRP-IT',
        vendor_group_code: 'VGRP-IT',
        vendor_group_name: 'กลุ่มคอมพิวเตอร์',
        vendor_group_name_en: 'Computer Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_group_id: 'VGRP-CON',
        vendor_group_code: 'VGRP-CON',
        vendor_group_name: 'กลุ่มวัสดุก่อสร้าง',
        vendor_group_name_en: 'Construction Materials Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// Local in-memory store
let localVendorGroups: VendorGroupMaster[] = [...MOCK_VENDOR_GROUPS];

export const VendorGroupService = {
    /**
     * Get all vendor groups
     */
    getAll: async (): Promise<VendorGroupMaster[]> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Vendor Groups');
            return localVendorGroups;
        }
        try {
            const response = await api.get<VendorGroupMaster[]>('/vendor-groups');
            return response.data;
        } catch (error) {
            logger.error('[VendorGroupService] getAll error:', error);
            return [];
        }
    },

    /**
     * Get vendor group by ID
     */
    getById: async (id: string): Promise<VendorGroupMaster | null> => {
        if (USE_MOCK) {
            const vendorGroup = localVendorGroups.find(vg => vg.vendor_group_id === id);
            if (vendorGroup) {
                logger.info(`🎭 [Mock Mode] Serving Vendor Group: ${id}`);
                return vendorGroup;
            }
            return null;
        }
        try {
            const response = await api.get<VendorGroupMaster>(`/vendor-groups/${id}`);
            return response.data;
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
            const newId = `VGRP-${data.groupCode.toUpperCase()}`;
            const newVendorGroup: VendorGroupMaster = {
                vendor_group_id: newId,
                vendor_group_code: data.groupCode.toUpperCase(),
                vendor_group_name: data.groupName,
                vendor_group_name_en: data.groupNameEn,
                is_active: data.isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            localVendorGroups.unshift(newVendorGroup);
            return { success: true, data: newVendorGroup };
        }
        try {
            const response = await api.post<{ success: boolean; data: VendorGroupMaster }>('/vendor-groups', data);
            return response.data;
        } catch (error) {
            logger.error('[VendorGroupService] create error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างกลุ่มเจ้าหนี้' };
        }
    },

    /**
     * Update vendor group
     */
    update: async (id: string, data: VendorGroupFormData): Promise<{ success: boolean; data?: VendorGroupMaster; message?: string }> => {
        if (USE_MOCK) {
            const index = localVendorGroups.findIndex(vg => vg.vendor_group_id === id);
            if (index !== -1) {
                localVendorGroups[index] = {
                    ...localVendorGroups[index],
                    vendor_group_code: data.groupCode.toUpperCase(),
                    vendor_group_name: data.groupName,
                    vendor_group_name_en: data.groupNameEn,
                    is_active: data.isActive,
                    updated_at: new Date().toISOString(),
                };
                return { success: true, data: localVendorGroups[index] };
            }
            return { success: false, message: 'ไม่พบกลุ่มเจ้าหนี้' };
        }
        try {
            const response = await api.put<{ success: boolean; data: VendorGroupMaster }>(`/vendor-groups/${id}`, data);
            return response.data;
        } catch (error) {
            logger.error('[VendorGroupService] update error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตกลุ่มเจ้าหนี้' };
        }
    },

    /**
     * Delete vendor group
     */
    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK) {
            const initialLength = localVendorGroups.length;
            localVendorGroups = localVendorGroups.filter(vg => vg.vendor_group_id !== id);
            if (localVendorGroups.length < initialLength) {
                return { success: true };
            }
            return { success: false, message: 'ไม่พบกลุ่มเจ้าหนี้' };
        }
        try {
            await api.delete(`/vendor-groups/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[VendorGroupService] delete error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบกลุ่มเจ้าหนี้' };
        }
    },
};
