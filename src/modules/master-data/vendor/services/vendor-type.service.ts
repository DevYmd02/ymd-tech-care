import api, { USE_MOCK } from '@/core/api/api';
import type { VendorTypeMaster, VendorTypeFormData } from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_VENDOR_TYPES } from '../mocks/vendor-type.mock';
import type { SuccessResponse } from '@/shared/types/api-response.types';

import type { ListResponse } from '@/shared/types/common-api.types';

// Local in-memory store
const localVendorTypes: ListResponse<VendorTypeMaster> = { ...MOCK_VENDOR_TYPES };

export const VendorTypeService = {
    /**
     * Get all vendor types
     */
    getAll: async (): Promise<ListResponse<VendorTypeMaster>> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Vendor Types');
            return localVendorTypes;
        }
        try {
            return await api.get<ListResponse<VendorTypeMaster>>('/vendor-types');
        } catch (error) {
            logger.error('[VendorTypeService] getAll error:', error);
            return { items: [], total: 0 };
        }
    },

    /**
     * Get vendor type by ID
     */
    getById: async (id: string): Promise<VendorTypeMaster | null> => {
        if (USE_MOCK) {
            const vendorType = localVendorTypes.items.find(vt => vt.vendor_type_id === id);
            if (vendorType) {
                logger.info(`🎭 [Mock Mode] Serving Vendor Type: ${id}`);
                return vendorType;
            }
            return null;
        }
        try {
            return await api.get<VendorTypeMaster>(`/vendor-types/${id}`);
        } catch (error) {
            logger.error('[VendorTypeService] getById error:', error);
            return null;
        }
    },

    /**
     * Create new vendor type
     */
    create: async (data: VendorTypeFormData): Promise<{ success: boolean; data?: VendorTypeMaster; message?: string }> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Creating Vendor Type', data);
            const newId = `VTYPE-${data.typeCode.toUpperCase()}`;
            const newVendorType: VendorTypeMaster = {
                vendor_type_id: newId,
                id: newId,
                vendor_type_code: data.typeCode.toUpperCase(),
                code: data.typeCode.toUpperCase(),
                vendor_type_name: data.typeName,
                name_th: data.typeName,
                vendor_type_name_en: data.typeNameEn,
                is_active: data.isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            localVendorTypes.items.unshift(newVendorType);
            localVendorTypes.total++;
            return { success: true, data: newVendorType };
        }
        try {
            const response = await api.post<VendorTypeMaster>('/vendor-types', data);
            return { success: true, data: response };
        } catch (error) {
            logger.error('[VendorTypeService] create error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างประเภทเจ้าหนี้' };
        }
    },

    /**
     * Update vendor type
     */
    update: async (id: string, data: VendorTypeFormData): Promise<{ success: boolean; data?: VendorTypeMaster; message?: string }> => {
        if (USE_MOCK) {
            const index = localVendorTypes.items.findIndex(vt => vt.vendor_type_id === id);
            if (index !== -1) {
                localVendorTypes.items[index] = {
                    ...localVendorTypes.items[index],
                    vendor_type_code: data.typeCode.toUpperCase(),
                    code: data.typeCode.toUpperCase(),
                    vendor_type_name: data.typeName,
                    name_th: data.typeName,
                    vendor_type_name_en: data.typeNameEn,
                    is_active: data.isActive,
                    updated_at: new Date().toISOString(),
                };
                return { success: true, data: localVendorTypes.items[index] };
            }
            return { success: false, message: 'ไม่พบประเภทเจ้าหนี้' };
        }
        try {
            const response = await api.put<VendorTypeMaster>(`/vendor-types/${id}`, data);
            return { success: true, data: response };
        } catch (error) {
            logger.error('[VendorTypeService] update error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตประเภทเจ้าหนี้' };
        }
    },

    /**
     * Delete vendor type
     */
    delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK) {
            const initialLength = localVendorTypes.items.length;
            localVendorTypes.items = localVendorTypes.items.filter(vt => vt.vendor_type_id !== id);
            if (localVendorTypes.items.length < initialLength) {
                localVendorTypes.total--;
                return { success: true };
            }
            return { success: false, message: 'ไม่พบประเภทเจ้าหนี้' };
        }
        try {
            await api.delete<SuccessResponse>(`/vendor-types/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[VendorTypeService] delete error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบประเภทเจ้าหนี้' };
        }
    },
};
