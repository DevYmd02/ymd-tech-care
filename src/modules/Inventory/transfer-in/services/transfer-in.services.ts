/**
 * @file transfer-in.services.ts
 * @description API Service สำหรับ Transfer In
 */

import api from '@/core/api/api';
import type { 
    TransferInHeader, 
    TransferInListParams,
    TransferInListItem,
    TransferInPayload,
    PendingTransferInItem
} from '../types/transfer-in.types';

export class TransferInService {
    private static readonly BASE_URL = '/transfer-in';

    /**
     * ดึงรายการใบโอนย้ายเข้า (Pagination & Filter)
     */
    static async getList(params: TransferInListParams, config?: { signal?: AbortSignal }) {
        try {
            const response = await api.get<{
                success: boolean;
                data: {
                    items: TransferInListItem[];
                    total: number;
                };
            }>(this.BASE_URL, {
                params,
                signal: config?.signal,
            });
            // If response has a .data property (AxiosResponse), return response.data.data
            // If response is already the data (interceptor), return response.data
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            
            // If the API returns an array directly
            if (Array.isArray(resData)) {
                return { items: resData as TransferInListItem[], total: resData.length };
            }
            
            return (resData as { data?: { items: TransferInListItem[]; total: number } })?.data 
                || (resData as { items?: TransferInListItem[]; total?: number }) 
                || { items: [], total: 0 };
        } catch (error: unknown) {
            if ((error as Error)?.name !== 'CanceledError') {
                console.error('TransferInService.getList error:', error);
            }
            throw error;
        }
    }

    /**
     * ดึงรายการที่รอโอนย้ายเข้า (Pending In)
     */
    static async getPendingList(params?: Record<string, unknown>, config?: { signal?: AbortSignal }) {
        try {
            const response = await api.get<{
                success: boolean;
                data: PendingTransferInItem[];
            }>(`${this.BASE_URL}/pending-in`, {
                params,
                signal: config?.signal,
            });
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            return Array.isArray(resData) ? resData : (resData as { data?: PendingTransferInItem[] })?.data || [];
        } catch (error: unknown) {
            if ((error as Error)?.name !== 'CanceledError') {
                console.error('TransferInService.getPendingList error:', error);
            }
            throw error;
        }
    }

    /**
     * ดึงข้อมูลใบโอนย้ายเข้า 1 ใบพร้อมรายการ
     */
    static async getById(id: string) {
        try {
            const response = await api.get<{
                success: boolean;
                data: TransferInHeader;
            }>(`${this.BASE_URL}/${id}`);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            return (resData as { data?: TransferInHeader })?.data || resData as TransferInHeader;
        } catch (error: unknown) {
            if ((error as Error)?.name !== 'CanceledError') {
                console.error('TransferInService.getById error:', error);
            }
            throw error;
        }
    }

    /**
     * สร้างใบโอนย้ายเข้าใหม่
     */
    static async create(payload: TransferInPayload) {
        try {
            const response = await api.post<{
                success: boolean;
                message: string;
                data?: unknown;
            }>(this.BASE_URL, payload);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            // If the backend returns the object directly without a success wrapper
            if (resData && typeof resData === 'object' && !('success' in resData)) {
                return { success: true, message: 'Created successfully', data: resData };
            }
            return resData as { success: boolean; message: string; data?: unknown };
        } catch (error) {
            console.error('TransferInService.create error:', error);
            throw error;
        }
    }

    /**
     * อัปเดตใบโอนย้ายเข้า
     */
    static async update(id: string, payload: TransferInPayload) {
        try {
            const response = await api.put<{
                success: boolean;
                message: string;
                data?: unknown;
            }>(`${this.BASE_URL}/${id}`, payload);
            const resData = (response as { data?: unknown }).data !== undefined ? (response as { data?: unknown }).data : response;
            // If the backend returns the object directly without a success wrapper
            if (resData && typeof resData === 'object' && !('success' in resData)) {
                return { success: true, message: 'Updated successfully', data: resData };
            }
            return resData as { success: boolean; message: string; data?: unknown };
        } catch (error) {
            console.error('TransferInService.update error:', error);
            throw error;
        }
    }

    /**
     * ลบใบโอนย้ายเข้า
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
            console.error('TransferInService.delete error:', error);
            throw error;
        }
    }
}
