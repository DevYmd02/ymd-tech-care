import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UOMListItem, UOMCreateRequest, UOMUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type PaginatedListResponse } from '@/shared/types/api.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

// ✅ กำหนด type Backend response ชัดเจน
interface UomResponse extends Record<string, unknown> {
    uom_id?: number;
    id?: number;
    uom_code?: string;
    uom_name: string;
    uom_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface UnitFilters extends Partial<TableFilters> {
    uom_code?: string;
    uom_name?: string;
}


// ✅ type-safe ไม่ใช้ any
function mapUomToUnit(item: UomResponse): UOMListItem {
    const finalId = Number(item.uom_id || item.id || 0);
    return {
        id: finalId,
        uom_id: finalId,
        uom_code: item.uom_code || '',
        uom_name: item.uom_name,
        uom_name_en: item.uom_nameeng ?? '',
        is_active: item.is_active,
        created_at: item.created_at,
    };
}
 
import { normalizeListResponse } from '@/shared/utils/apiUtils';

export const UOMService = {
    getAll: async (params?: UnitFilters, config?: AxiosRequestConfig): Promise<PaginatedListResponse<UOMListItem>> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Unit List');
            return { items: mockUnits, total: mockUnits.length, page: 1, limit: 100 };
        }

        try {
            const response = await api.get<unknown>('/uom', { ...config, params });
            const normalized = normalizeListResponse<UomResponse>(response);
            
            return { 
                items: normalized.items.map(mapUomToUnit), 
                total: Number(normalized.total), 
                page: Number(normalized.page), 
                limit: Number(normalized.limit) 
            };
        } catch (error) {
            logger.error('❌ [UOMService] getAll failed:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    get: async (id: number, config?: AxiosRequestConfig): Promise<UOMListItem | null> => {
        if (USE_MOCK) return mockUnits.find(u => u.uom_id === id) ?? null;
        try {
            // ✅ รองรับ response ที่อาจจะถูก wrap ด้วย { data: ... } หรือส่งมาตรงๆ
            const response = await api.get<{ success?: boolean; data?: UomResponse } & Partial<UomResponse>>(`/uom/${id}`, config);

            // Handle wrapped response { success: true, data: {...} }
            if (response?.success && response?.data) {
                return mapUomToUnit(response.data);
            }

            // Handle axios-like response or direct data property
            if (response?.data && response.data.uom_id) {
                return mapUomToUnit(response.data);
            }

            if (response?.uom_id) {
                return mapUomToUnit({
                    uom_id: response.uom_id,
                    uom_code: response.uom_code ?? '',
                    uom_name: response.uom_name ?? '',
                    uom_nameeng: response.uom_nameeng,
                    is_active: response.is_active ?? true,
                    created_at: response.created_at ?? ''
                });
            }

            return null;
        } catch (error) {
            logger.error('[UOMService] get error:', error);
            return null;
        }
    },
    create: async (data: UOMCreateRequest): Promise<{ success: boolean; data?: UOMListItem; message?: string }> => {
        if (USE_MOCK) return { success: true, message: 'Mock Create Success' };
        try {
            const payload = {
                uom_code: data.uom_code,
                uom_name: data.uom_name,
                uom_nameeng: data.uom_name_en,
                is_active: data.is_active,
            };
            // The API client returns the full response object, not an unwrapped one.
            const response = await api.post<UomResponse>('/uom', payload);
            return {
                success: true,
                data: mapUomToUnit(response),
                message: 'สร้างหน่วยนับสำเร็จ',
            };
        } catch (error) {
            logger.error('[UOMService] create error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    // ✅ แก้แล้ว
    update: async (id: number, data: Partial<UOMUpdateRequest>) => {
        if (USE_MOCK) return { success: true, message: 'Mock Update Success' };
        try {
            const payload = {
                uom_code: data.uom_code,
                uom_name: data.uom_name,
                uom_nameeng: data.uom_name_en,
                is_active: data.is_active,
            };

            // interceptor unwrap แล้ว → ได้ UomResponse ตรงๆ
            const response = await api.patch<UomResponse>(`/uom/${id}`, payload);

            return {
                success: true,
                data: mapUomToUnit(response),
                message: 'แก้ไขหน่วยสำเร็จ',
            };
        } catch (error) {
            logger.error('[UOMService] update error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },
    
    delete: async (id: number): Promise<boolean> => {
        if (USE_MOCK) return true;
        try {
            await api.delete<void>(`/uom/${id}`);
            return true;
        } catch (error) {
            logger.error('[UOMService] delete error:', error);
            return false;
        }
    },

    toggleStatus: async (id: number, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK) {
            const unit = mockUnits.find(u => u.uom_id === id);
            if (unit) unit.is_active = isActive;
            return { success: true };
        }
        try {
            // ✅ interceptor unwrap แล้ว → ได้ { success, message } ตรงๆ
            // เพราะ toggleStatus Backend ไม่มี data field จึงไม่ unwrap
            return await api.patch<{ success: boolean; message?: string }>(
                `/uom/${id}/status`,
                { is_active: isActive },
            );
        } catch (error) {
            logger.error('[UOMService] toggleStatus error:', error);
            return { success: false, message: 'ไม่สามารถเปลี่ยนสถานะได้' };
        }
    },
};