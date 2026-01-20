/**
 * @file vendorService.ts
 * @description Service สำหรับจัดการข้อมูล Vendor Master
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 * ควบคุมโดย VITE_USE_MOCK ใน .env
 */

import api, { USE_MOCK } from './api';
import { RELATED_VENDORS } from '../__mocks__/relatedMocks';
import type {
    VendorMaster,
    VendorListParams,
    VendorListResponse,
    VendorCreateRequest,
    VendorResponse,
    VendorDropdownItem,
} from '../types/vendor-types';
import { logger } from '../utils/logger';

// =============================================================================
// VENDOR SERVICE
// =============================================================================

export const vendorService = {

    // ==================== READ OPERATIONS ====================

    /**
     * ดึงรายการ Vendor ทั้งหมด
     */
    getList: async (params?: VendorListParams): Promise<VendorListResponse> => {
        if (USE_MOCK) {
            logger.log('[vendorService] Using MOCK data');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            let filteredVendors = [...RELATED_VENDORS];
            
            // Filter by status
            if (params?.status && params.status !== 'ALL') {
                filteredVendors = filteredVendors.filter(v => v.status === params.status);
            }
            
            // Filter by search
            if (params?.search) {
                const search = params.search.toLowerCase();
                filteredVendors = filteredVendors.filter(v => 
                    v.vendor_name.toLowerCase().includes(search) ||
                    v.vendor_code.toLowerCase().includes(search)
                );
            }
            
            return {
                data: filteredVendors as VendorMaster[],
                total: filteredVendors.length,
                page: params?.page || 1,
                limit: params?.limit || 20,
            };
        }

        try {
            const response = await api.get<VendorListResponse>('/vendors', { params });
            return response.data;
        } catch (error) {
            logger.error('vendorService.getList error:', error);
            return {
                data: [],
                total: 0,
                page: params?.page || 1,
                limit: params?.limit || 20,
            };
        }
    },

    /**
     * ดึงรายละเอียด Vendor ตาม ID
     */
    getById: async (vendorId: string): Promise<VendorMaster | null> => {
        if (USE_MOCK) {
            const vendor = RELATED_VENDORS.find(v => v.vendor_id === vendorId);
            return vendor as VendorMaster || null;
        }

        try {
            const response = await api.get<VendorMaster>(`/vendors/${vendorId}`);
            return response.data;
        } catch (error) {
            logger.error('vendorService.getById error:', error);
            return null;
        }
    },

    /**
     * ดึงรายการ Vendor สำหรับ Dropdown
     */
    getDropdown: async (): Promise<VendorDropdownItem[]> => {
        if (USE_MOCK) {
            return RELATED_VENDORS.map(v => ({
                vendor_code: v.vendor_code,
                vendor_name: v.vendor_name,
            }));
        }

        try {
            const response = await api.get<VendorDropdownItem[]>('/vendors/dropdown');
            return response.data;
        } catch (error) {
            logger.error('vendorService.getDropdown error:', error);
            return [];
        }
    },

    // ==================== WRITE OPERATIONS ====================

    /**
     * สร้าง Vendor ใหม่
     */
    create: async (data: VendorCreateRequest): Promise<VendorResponse> => {
        if (USE_MOCK) {
            logger.log('[vendorService] Mock create:', data);
            return { success: true, message: 'สร้าง Vendor สำเร็จ (Mock)' };
        }

        try {
            const response = await api.post<VendorResponse>('/vendors', data);
            return response.data;
        } catch (error) {
            logger.error('vendorService.create error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง Vendor' };
        }
    },

    /**
     * อัปเดต Vendor
     */
    update: async (vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse> => {
        if (USE_MOCK) {
            logger.log('[vendorService] Mock update:', vendorId, data);
            return { success: true, message: 'อัปเดต Vendor สำเร็จ (Mock)' };
        }

        try {
            const response = await api.put<VendorResponse>(`/vendors/${vendorId}`, data);
            return response.data;
        } catch (error) {
            logger.error('vendorService.update error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต Vendor' };
        }
    },

    /**
     * ลบ Vendor
     */
    delete: async (vendorId: string): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK) {
            logger.log('[vendorService] Mock delete:', vendorId);
            return { success: true };
        }

        try {
            await api.delete(`/vendors/${vendorId}`);
            return { success: true };
        } catch (error) {
            logger.error('vendorService.delete error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบ Vendor' };
        }
    },

    // ==================== STATUS OPERATIONS ====================

    block: async (vendorId: string, remark?: string): Promise<VendorResponse> => {
        if (USE_MOCK) {
            return { success: true, message: 'Block Vendor สำเร็จ (Mock)' };
        }
        try {
            const response = await api.post<VendorResponse>(`/vendors/${vendorId}/block`, { remark });
            return response.data;
        } catch (error) {
            logger.error('vendorService.block error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
        }
    },

    unblock: async (vendorId: string): Promise<VendorResponse> => {
        if (USE_MOCK) {
            return { success: true, message: 'Unblock Vendor สำเร็จ (Mock)' };
        }
        try {
            const response = await api.post<VendorResponse>(`/vendors/${vendorId}/unblock`);
            return response.data;
        } catch (error) {
            logger.error('vendorService.unblock error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
        }
    },

    setOnHold: async (vendorId: string, onHold: boolean): Promise<VendorResponse> => {
        if (USE_MOCK) {
            return { success: true, message: `Set Hold=${onHold} สำเร็จ (Mock)` };
        }
        try {
            const response = await api.post<VendorResponse>(`/vendors/${vendorId}/hold`, { on_hold: onHold });
            return response.data;
        } catch (error) {
            logger.error('vendorService.setOnHold error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Hold' };
        }
    },
};

export default vendorService;
