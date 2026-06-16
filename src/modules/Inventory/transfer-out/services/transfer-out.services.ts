/**
 * @file transfer-out.services.ts
 * @description API Service สำหรับ Transfer Out
 */

import api from '@/core/api/api';
import type { 
    TransferOutHeader, 
    TransferOutListParams,
    TransferOutListItem,
    TransferOutPayload,
    PendingTransferOutItem
} from '../types/transfer-out.types';

export class TransferOutService {
    private static readonly BASE_URL = '/transfer-out';

    /**
     * ดึงรายการใบโอนย้ายออก (Pagination & Filter)
     */
    static async getList(params: TransferOutListParams, config?: { signal?: AbortSignal }) {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    items: TransferOutListItem[];
                    total: number;
                };
            }>(this.BASE_URL, {
                params,
                signal: config?.signal,
            });
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            
            // If the API returns an array directly
            if (Array.isArray(resData)) {
                return { items: resData as TransferOutListItem[], total: resData.length };
            }
            
            // If the API returns { success, data: { items, total } } or { items, total }
            return (resData as { data?: { items: TransferOutListItem[]; total: number } })?.data 
                || (resData as { items?: TransferOutListItem[]; total?: number }) 
                || { items: [], total: 0 };
        } catch (error: unknown) {
            if ((error as Error)?.name !== 'CanceledError') {
                console.error('TransferOutService.getList error:', error);
            }
            throw error;
        }
    }

    /**
     * ดึงรายการที่รอโอนย้ายออก (Pending Out)
     */
    static async getPendingList(params?: Record<string, unknown>, config?: { signal?: AbortSignal }) {
        try {
            const response = await api.get<{
                success: boolean;
                data: PendingTransferOutItem[];
            }>(`${this.BASE_URL}/pending-out`, {
                params,
                signal: config?.signal,
            });
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            return Array.isArray(resData) ? resData : (resData as { data?: PendingTransferOutItem[] })?.data || [];
        } catch (error: unknown) {
            if ((error as Error)?.name !== 'CanceledError') {
                console.error('TransferOutService.getPendingList error:', error);
            }
            throw error;
        }
    }

    /**
     * ดึงข้อมูลใบโอนย้ายออก 1 ใบพร้อมรายการ
     */
    static async getById(id: string) {
        try {
            const response = await api.get<{
                success: boolean;
                data: TransferOutHeader;
            }>(`${this.BASE_URL}/${id}`);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            return (resData as { data?: TransferOutHeader })?.data || resData as TransferOutHeader;
        } catch (error: unknown) {
            if ((error as Error)?.name !== 'CanceledError') {
                console.error('TransferOutService.getById error:', error);
            }
            throw error;
        }
    }

    /**
     * สร้างใบโอนย้ายออกใหม่
     */
    static async create(payload: TransferOutPayload) {
        try {
            const response = await api.post<{
                success: boolean;
                message: string;
                data?: unknown;
            }>(this.BASE_URL, payload);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            if (resData && typeof resData === 'object' && !('success' in resData)) {
                return { success: true, message: 'Created successfully', data: resData };
            }
            return resData as { success: boolean; message: string; data?: unknown };
        } catch (error) {
            console.error('TransferOutService.create error:', error);
            throw error;
        }
    }

    /**
     * อัปเดตใบโอนย้ายออก
     */
    static async update(id: string, payload: TransferOutPayload) {
        try {
            const response = await api.put<{
                success: boolean;
                message: string;
                data?: unknown;
            }>(`${this.BASE_URL}/${id}`, payload);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            if (resData && typeof resData === 'object' && !('success' in resData)) {
                return { success: true, message: 'Updated successfully', data: resData };
            }
            return resData as { success: boolean; message: string; data?: unknown };
        } catch (error) {
            console.error('TransferOutService.update error:', error);
            throw error;
        }
    }

    /**
     * ลบใบโอนย้ายออก
     */
    static async delete(id: string) {
        try {
            const response = await api.delete<{
                success: boolean;
                message: string;
            }>(`${this.BASE_URL}/${id}`);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            return resData as { success: boolean; message: string };
        } catch (error) {
            console.error('TransferOutService.delete error:', error);
            throw error;
        }
    }
}
