/**
 * @file vendorService.ts
 * @description Service สำหรับจัดการข้อมูล Vendor Master - เชื่อมต่อกับ Backend API
 * @usage import { vendorService } from '@/services/vendorService';
 */


import api from './api';
import type {
    VendorMaster,
    VendorListParams,
    VendorListResponse,
    VendorCreateRequest,
    VendorResponse,
    VendorDropdownItem,
} from '../types/vendor-types';
import { logger } from '../utils/logger';

// ====================================================================================
// VENDOR SERVICE - API Calls
// ====================================================================================

/**
 * Vendor Service - API calls สำหรับ Vendor Master Data
 * 
 * @example
 * // ดึงรายการ Vendor
 * const response = await vendorService.getList({ status: 'ACTIVE' });
 * 
 * // สร้าง Vendor ใหม่
 * const newVendor = await vendorService.create(data);
 * 
 * // อัปเดต Vendor
 * await vendorService.update(vendorId, data);
 */
export const vendorService = {

    // ==================== READ OPERATIONS ====================

    /**
     * ดึงรายการ Vendor ทั้งหมด
     * GET /vendor
     */
    getList: async (params?: VendorListParams): Promise<VendorListResponse> => {
        try {
            const response = await api.get<VendorListResponse>('/vendors', { params });
            return response.data;
        } catch (error) {
            logger.error('vendorService.getList error:', error);
            // Return empty data on error (fallback)
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
     * GET /vendor/:id
     */
    getById: async (vendorId: string): Promise<VendorMaster | null> => {
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
     * GET /vendor/dropdown
     */
    getDropdown: async (): Promise<VendorDropdownItem[]> => {
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
     * POST /vendor
     */
    create: async (data: VendorCreateRequest): Promise<VendorResponse> => {
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
     * PUT /vendor/:id
     */
    update: async (vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse> => {
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
     * DELETE /vendor/:id
     */
    delete: async (vendorId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/vendors/${vendorId}`);
            return { success: true };
        } catch (error) {
            logger.error('vendorService.delete error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบ Vendor' };
        }
    },

    // ==================== STATUS OPERATIONS ====================

    /**
     * Block Vendor
     * POST /vendor/:id/block
     */
    block: async (vendorId: string, remark?: string): Promise<VendorResponse> => {
        try {
            const response = await api.post<VendorResponse>(`/vendors/${vendorId}/block`, { remark });
            return response.data;
        } catch (error) {
            logger.error('vendorService.block error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
        }
    },

    /**
     * Unblock Vendor
     * POST /vendor/:id/unblock
     */
    unblock: async (vendorId: string): Promise<VendorResponse> => {
        try {
            const response = await api.post<VendorResponse>(`/vendors/${vendorId}/unblock`);
            return response.data;
        } catch (error) {
            logger.error('vendorService.unblock error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
        }
    },

    /**
     * Set On Hold
     * POST /vendor/:id/hold
     */
    setOnHold: async (vendorId: string, onHold: boolean): Promise<VendorResponse> => {
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
