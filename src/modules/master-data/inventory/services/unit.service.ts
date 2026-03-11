import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UnitListItem, UnitCreateRequest, UnitUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';
 
// ✅ กำหนด type Backend response ชัดเจน
interface UomResponse {
    uom_id: number;
    uom_code: string;
    uom_name: string;
    uom_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}
 
// ✅ This is the wrapper for mutation responses
interface UomMutationSuccessResponse {
    success: true;
    data: UomResponse;
    message: string;
}
 
// ✅ type-safe ไม่ใช้ any
function mapUomToUnit(item: UomResponse): UnitListItem {
    return {
        id: item.uom_id,
        unit_id: item.uom_id,
        unit_code: item.uom_code,
        unit_name: item.uom_name,
        unit_name_en: item.uom_nameeng ?? '',
        is_active: item.is_active ?? true,
        created_at: item.created_at || new Date().toISOString(),
 
        // ✅ Add these back so UI components that rely on them still work
        uom_id: item.uom_id,
        uom_code: item.uom_code,
        uom_name: item.uom_name,
        uom_nameeng: item.uom_nameeng,
    };
}
 
export const UnitService = {
 
    getAll: async (params?: Partial<TableFilters>): Promise<PaginatedListResponse<UnitListItem>> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Unit List');
            return { items: mockUnits, total: mockUnits.length, page: 1, limit: 100 };
        }
        try {
            // ✅ interceptor unwrap แล้ว → ได้ array ตรงๆ
            const response = await api.get<UomResponse[]>('/uom', { params });
            const items = response.map(mapUomToUnit);
            return { items, total: items.length, page: 1, limit: items.length || 10 };
        } catch (error) {
            logger.error('[UnitService] getAll error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },
 
    get: async (id: number): Promise<UnitListItem | null> => {
        if (USE_MOCK) return mockUnits.find(u => u.unit_id === id || String(u.unit_id) === String(id)) ?? null;
        try {
            // ✅ รองรับ response ที่อาจจะถูก wrap ด้วย { data: ... } หรือส่งมาตรงๆ
            const response = await api.get<UomResponse | { success?: boolean; data: UomResponse }>(`/uom/${id}`);
 
            // Handle wrapped response { success: true, data: {...} }
            if ('data' in response && response.data) {
                return mapUomToUnit(response.data);
            }
 
            // Handle direct response
            if ('uom_id' in response && response.uom_id) {
                return mapUomToUnit(response);
            }
 
            return null;
        } catch (error) {
            logger.error('[UnitService] get error:', error);
            return null;
        }
    },
 
    create: async (data: UnitCreateRequest): Promise<{ success: boolean; data?: UnitListItem; message?: string }> => {
        if (USE_MOCK) return { success: true, message: 'Mock Create Success' };
        try {
            const payload = {
                uom_code: data.unit_code,
                uom_name: data.unit_name,
                uom_nameeng: data.unit_name_en,
                is_active: data.is_active,
            };
            // The API client returns the full response object, not an unwrapped one.
            const response = await api.post<UomMutationSuccessResponse>('/uom', payload);
            return {
                success: response.success,
                data: response.data ? mapUomToUnit(response.data) : undefined,
                message: response.message,
            };
        } catch (error) {
            logger.error('[UnitService] create error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },
 
    // ✅ แก้แล้ว
    update: async (id: number, data: Partial<UnitUpdateRequest>) => {
        if (USE_MOCK) return { success: true, message: 'Mock Update Success' };
        try {
            const payload = {
                uom_code: data.unit_code,
                uom_name: data.unit_name,
                uom_nameeng: data.unit_name_en,
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
            logger.error('[UnitService] update error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },
   
    delete: async (id: number): Promise<boolean> => {
        if (USE_MOCK) return true;
        try {
            await api.delete<void>(`/uom/${id}`);
            return true;
        } catch (error) {
            logger.error('[UnitService] delete error:', error);
            return false;
        }
    },
 
    toggleStatus: async (id: number, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
        if (USE_MOCK) {
            const unit = mockUnits.find(u => u.unit_id === id || String(u.unit_id) === String(id));
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
            logger.error('[UnitService] toggleStatus error:', error);
            return { success: false, message: 'ไม่สามารถเปลี่ยนสถานะได้' };
        }
    },
};