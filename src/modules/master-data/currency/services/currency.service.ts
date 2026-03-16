import api from '@/core/api/api';
import type { Currency, ExchangeRateType, ExchangeRate } from '@currency/types/currency-types';
import { logger } from '@/shared/utils/logger';

export interface BaseResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

// 🔄 Helper function: Map from API to UI (Standardized like item-group)
function mapCurrencyFromApi(item: any): any {
    return {
        id: item.currency_id,
        currency_id: item.currency_id,
        code: item.currency_code,
        name_th: item.currency_name,
        exchange_rate: Number(item.exchange_rate || 0),
        is_active: item.is_active !== undefined ? item.is_active : item.status === 'ACTIVE',
        status: item.status || (item.is_active ? 'ACTIVE' : 'INACTIVE'),
    };
}

// 🔄 Helper function: Map from UI to API
function mapCurrencyToApi(data: any): any {
    return {
        currency_code: data.code || data.currency_code,
        currency_name: data.name_th || data.nameTh || data.currency_name,
        currency_nameeng: data.code || data.currency_code, // เพิ่มตามที่ Backend ต้องการ (ใช้ค่า code เป็นค่าเริ่มต้น)
        exchange_rate: Number(data.exchange_rate || data.exchangeRate || 0), // ส่งเป็น Number
        is_active: Boolean(data.is_active ?? data.isActive ?? (data.status === 'ACTIVE')) // ส่งเป็น Boolean
    };
}

export const CurrencyService = {
    // ==========================================
    // 🏦 Currency (Standardized for generic UI)
    // ==========================================
    getAll: async (): Promise<BaseResponse<any>> => {
        try {
            const res = await api.get<any>('/currency', { timeout: 30000 });
            const resData = res;
            const rawItems = Array.isArray(resData) ? resData : (resData?.data || []);
            
            // 🔄 Transform payload to match generic UI structure (id, code, name_th, is_active)
            const items = rawItems.map(mapCurrencyFromApi);
            return { items, total: items.length, page: 1, limit: items.length || 20 };
        } catch (error) {
            logger.error('[CurrencyService] getAll error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getById: async (id: string | number): Promise<any | null> => {
        try {
            const res = await api.get<any>(`/currency/${id}`);
            const rawItem = res?.data || res;
            return rawItem ? mapCurrencyFromApi(rawItem) : null;
        } catch (error) {
            logger.error('[CurrencyService] getById error:', error);
            return null;
        }
    },

    create: async (data: any): Promise<{ success: boolean; data?: any; message?: string }> => {
        try {
            const payload = mapCurrencyToApi(data);
            // 📝 ส่งเป็น Object ไปยัง /currency (เอา Array ออก)
            const response = await api.post('/currency', payload);
            return { success: true, data: response };
        } catch (error: any) {
            logger.error('[CurrencyService] create error:', error);
            const msg = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูล';
            return { success: false, message: msg };
        }
    },

    update: async (id: string | number, data: any): Promise<{ success: boolean; data?: any; message?: string }> => {
        try {
            const payload = mapCurrencyToApi(data);
            // 📝 ใช้ PUT ไปยัง /currency/:id สำหรับการอัปเดตเป็น Object (เอา Array ออก)
            const response = await api.put(`/currency/${id}`, payload);
            return { success: true, data: response };
        } catch (error: any) {
            logger.error('[CurrencyService] update error:', error);
            const msg = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล';
            return { success: false, message: msg };
        }
    },

    delete: async (id: string | number): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/currency/${id}`);
            return { success: true };
        } catch (error: any) {
            logger.error('[CurrencyService] delete error:', error);
            const msg = error?.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล';
            return { success: false, message: msg };
        }
    },

    // 🔗 Legacy aliases to prevent breaking existing components that rely on the old method names
    getCurrencies: function() { return this.getAll(); },
    getCurrencyById: function(id: string) { return this.getById(id); },
    createCurrency: function(data: any) { return this.create(data); },
    updateCurrency: function(id: string, data: any) { return this.update(id, data); },
    deleteCurrency: function(id: string) { return this.delete(id); },

    // Exchange Rate Types
    getExchangeRateTypes: async (): Promise<BaseResponse<ExchangeRateType>> => {
        try {
            const res = await api.get<{ data?: ExchangeRateType[] } | ExchangeRateType[]>('/exchange-rate-type');
            const resData = res;
            const items = Array.isArray(resData) ? resData : (resData?.data || []);
            return { items, total: items.length, page: 1, limit: items.length || 20 };
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateTypes error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getExchangeRateTypeById: async (id: string): Promise<ExchangeRateType | null> => {
        try {
            return await api.get<ExchangeRateType>(`/exchange-rate-type/${id}`);
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateTypeById error:', error);
            return null;
        }
    },

    createExchangeRateType: async (data: Partial<ExchangeRateType>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.post('/exchange-rate-type', data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] createExchangeRateType error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    updateExchangeRateType: async (id: string, data: Partial<ExchangeRateType>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.put(`/exchange-rate-type/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] updateExchangeRateType error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },

    deleteExchangeRateType: async (id: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/exchange-rate-type/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] deleteExchangeRateType error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
        }
    },

    // Exchange Rates
    getExchangeRates: async (): Promise<BaseResponse<ExchangeRate & { currency_code?: string; type_name?: string }>> => {
        try {
            const res = await api.get<{ data?: (ExchangeRate & { currency_code?: string; type_name?: string })[] } | (ExchangeRate & { currency_code?: string; type_name?: string })[]>('/exchange-rate');
            const resData = res;
            const items = Array.isArray(resData) ? resData : (resData?.data || []);
            return { items, total: items.length, page: 1, limit: items.length || 20 };
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRates error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getExchangeRateById: async (id: string): Promise<ExchangeRate | null> => {
        try {
            return await api.get<ExchangeRate>(`/exchange-rate/${id}`);
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateById error:', error);
            return null;
        }
    },

    createExchangeRate: async (data: Partial<ExchangeRate>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.post('/exchange-rate', data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] createExchangeRate error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    updateExchangeRate: async (id: string, data: Partial<ExchangeRate>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.put(`/exchange-rate/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] updateExchangeRate error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },

    deleteExchangeRate: async (id: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/exchange-rate/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] deleteExchangeRate error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
        }
    }
};