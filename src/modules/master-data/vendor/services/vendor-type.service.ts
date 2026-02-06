import api, { USE_MOCK } from '@/core/api/api';
import type { VendorTypeMaster, VendorTypeFormData } from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';

// Mock Data
const MOCK_VENDOR_TYPES: VendorTypeMaster[] = [
    {
        vendor_type_id: 'VTYPE-MFG',
        vendor_type_code: 'VTYPE-MFG',
        vendor_type_name: 'ผู้ผลิตเฟอร์นิเจอร์',
        vendor_type_name_en: 'Furniture Manufacturer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_type_id: 'VTYPE-DIS',
        vendor_type_code: 'VTYPE-DIS',
        vendor_type_name: 'ผู้จัดจำหน่ายเครื่องเขียน',
        vendor_type_name_en: 'Stationery Distributor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_type_id: 'VTYPE-IT',
        vendor_type_code: 'VTYPE-IT',
        vendor_type_name: 'ผู้จัดจำหน่าย IT',
        vendor_type_name_en: 'IT Distributor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_type_id: 'VTYPE-RET',
        vendor_type_code: 'VTYPE-RET',
        vendor_type_name: 'ร้านค้าปลีก',
        vendor_type_name_en: 'Retailer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// Local in-memory store
let localVendorTypes: VendorTypeMaster[] = [...MOCK_VENDOR_TYPES];

export const VendorTypeService = {
    /**
     * Get all vendor types
     */
    getAll: async (): Promise<VendorTypeMaster[]> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Vendor Types');
            return localVendorTypes;
        }
        try {
            const response = await api.get<VendorTypeMaster[]>('/vendor-types');
            return response.data;
        } catch (error) {
            logger.error('[VendorTypeService] getAll error:', error);
            return [];
        }
    },

    /**
     * Get vendor type by ID
     */
    getById: async (id: string): Promise<VendorTypeMaster | null> => {
        if (USE_MOCK) {
            const vendorType = localVendorTypes.find(vt => vt.vendor_type_id === id);
            if (vendorType) {
                logger.info(`🎭 [Mock Mode] Serving Vendor Type: ${id}`);
                return vendorType;
            }
            return null;
        }
        try {
            const response = await api.get<VendorTypeMaster>(`/vendor-types/${id}`);
            return response.data;
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
                vendor_type_code: data.typeCode.toUpperCase(),
                vendor_type_name: data.typeName,
                vendor_type_name_en: data.typeNameEn,
                is_active: data.isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            localVendorTypes.unshift(newVendorType);
            return { success: true, data: newVendorType };
        }
        try {
            const response = await api.post<{ success: boolean; data: VendorTypeMaster }>('/vendor-types', data);
            return response.data;
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
            const index = localVendorTypes.findIndex(vt => vt.vendor_type_id === id);
            if (index !== -1) {
                localVendorTypes[index] = {
                    ...localVendorTypes[index],
                    vendor_type_code: data.typeCode.toUpperCase(),
                    vendor_type_name: data.typeName,
                    vendor_type_name_en: data.typeNameEn,
                    is_active: data.isActive,
                    updated_at: new Date().toISOString(),
                };
                return { success: true, data: localVendorTypes[index] };
            }
            return { success: false, message: 'ไม่พบประเภทเจ้าหนี้' };
        }
        try {
            const response = await api.put<{ success: boolean; data: VendorTypeMaster }>(`/vendor-types/${id}`, data);
            return response.data;
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
            const initialLength = localVendorTypes.length;
            localVendorTypes = localVendorTypes.filter(vt => vt.vendor_type_id !== id);
            if (localVendorTypes.length < initialLength) {
                return { success: true };
            }
            return { success: false, message: 'ไม่พบประเภทเจ้าหนี้' };
        }
        try {
            await api.delete(`/vendor-types/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[VendorTypeService] delete error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบประเภทเจ้าหนี้' };
        }
    },
};
