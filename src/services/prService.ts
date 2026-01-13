/**
 * @file prService.ts
 * @description Service สำหรับจัดการข้อมูล Purchase Requisition
 * @usage import { prService } from '@/services/prService';
 */

import { API_BASE_URL } from './api';
import type { PRDetail } from '../types/pr-types';

// Re-export types for convenience
export type { PRDetail, PRListItem, PRItem } from '../types/pr-types';

/**
 * PR Service - API calls สำหรับ Purchase Requisition
 * 
 * @example
 * // เมื่อติดตั้ง axios แล้ว
 * const prList = await prService.getList();
 * const prDetail = await prService.getById(1);
 * await prService.approve(1, { remark: 'อนุมัติ' });
 */
export const prService = {
    /**
     * ดึงรายการ PR ทั้งหมด
     */
    getList: async (params?: { status?: string; dateFrom?: string; dateTo?: string }) => {
        // TODO: Implement API call
        console.log('prService.getList called with:', params);
        console.log('API URL:', `${API_BASE_URL}/pr`);
        return [];
    },

    /**
     * ดึงรายละเอียด PR ตาม ID
     */
    getById: async (id: number) => {
        // TODO: Implement API call
        console.log('prService.getById called with:', id);
        return null;
    },

    /**
     * สร้าง PR ใหม่
     */
    create: async (data: Partial<PRDetail>) => {
        // TODO: Implement API call
        console.log('prService.create called with:', data);
        return null;
    },

    /**
     * อนุมัติ PR
     */
    approve: async (id: number, data: { remark?: string }) => {
        // TODO: Implement API call
        console.log('prService.approve called with:', id, data);
        return null;
    },

    /**
     * ยกเลิก PR
     */
    cancel: async (id: number, data: { remark?: string }) => {
        // TODO: Implement API call
        console.log('prService.cancel called with:', id, data);
        return null;
    },
};
