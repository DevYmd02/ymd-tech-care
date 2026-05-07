import type { AxiosRequestConfig } from 'axios';
import type { ExchangeRateType, ExchangeRate, CurrencyApiItem, CurrencyMappedItem, CurrencyApiRequest, CurrencyCreateRequest, CurrencyFormValues } from '@currency/types/currency-types';
import { logger } from '@/shared/utils';

export interface BaseResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

import api from '@/core/api/api';

import { normalizeListResponse, unwrapResponseData } from '@/shared/utils/apiUtils';

// 🔄 Helper function: Map from API to UI (Standardized like item-group)
function mapCurrencyFromApi(item: CurrencyApiItem): CurrencyMappedItem {
    const isAct = item.is_active !== undefined ? item.is_active : item.status === 'ACTIVE';
    return {
        id: item.currency_id,
        currency_id: item.currency_id,
        code: item.currency_code,
        currency_code: item.currency_code, // alias for backward-comp
        name_th: item.currency_name,
        currency_name: item.currency_name, // alias for backward-comp
        name_en: item.currency_nameeng || item.currency_code, // alias for backward-comp
        exchange_rate: Number(item.exchange_rate || 0),
        is_active: isAct,
        status: item.status || (isAct ? 'ACTIVE' : 'INACTIVE'),
        created_at: '', // Default to meet BaseMasterData
        updated_at: ''  // Default to meet BaseMasterData
    };
}

// 🔄 Helper function: Map from UI to API
function mapCurrencyToApi(data: CurrencyMappedItem | CurrencyFormValues | CurrencyCreateRequest): CurrencyApiRequest {
    const isForm = 'currencyCode' in data;
    const isCreateRequest = 'code' in data && 'name_th' in data;
    
    if (isCreateRequest) {
        return {
            currency_code: data.code,
            currency_name: data.name_th,
            currency_nameeng: data.code, // Default to code for create requests
            exchange_rate: Number(data.exchange_rate || 0),
            is_active: data.is_active
        };
    }
    
    return {
        currency_code: isForm ? (data as CurrencyFormValues).currencyCode : (data as CurrencyMappedItem).code || '',
        currency_name: isForm ? (data as CurrencyFormValues).nameTh : (data as CurrencyMappedItem).name_th || '',
        currency_nameeng: isForm ? (data as CurrencyFormValues).nameEn : (data as CurrencyMappedItem).code || '', 
        exchange_rate: isForm ? 0 : Number((data as CurrencyMappedItem).exchange_rate || 0), 
        is_active: isForm ? (data as CurrencyFormValues).isActive : (data as CurrencyMappedItem).is_active
    };
}

export const CurrencyService = {
    // ==========================================
    // 🏦 Currency (Standardized for generic UI)
    // ==========================================
    getAll: async (config?: AxiosRequestConfig): Promise<BaseResponse<CurrencyMappedItem>> => {
        try {
            const res = await api.get<unknown>('/currency', { ...config, timeout: 30000 });
            const normalized = normalizeListResponse<CurrencyApiItem>(res);
            
            // 🔄 Transform payload to match generic UI structure (id, code, name_th, is_active)
            const items = normalized.items.map(mapCurrencyFromApi);
            return { items, total: items.length, page: 1, limit: items.length || 20 };
        } catch (error) {
            logger.error('[CurrencyService] getAll error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getById: async (id: string | number, config?: AxiosRequestConfig): Promise<CurrencyMappedItem | null> => {
        try {
            const res = await api.get<unknown>(`/currency/${id}`, config);
            const rawItem = unwrapResponseData<CurrencyApiItem>(res);
            return (rawItem && 'currency_id' in rawItem) ? mapCurrencyFromApi(rawItem) : null;
        } catch (error) {
            logger.error('[CurrencyService] getById error:', error);
            return null;
        }
    },

    create: async (data: CurrencyCreateRequest | CurrencyFormValues): Promise<{ success: boolean; data?: CurrencyApiItem; message?: string }> => {
        try {
            const payload = mapCurrencyToApi(data);
            // 📝 ส่งเป็น Object ไปยัง /currency (เอา Array ออก)
            const response = await api.post<CurrencyApiItem>('/currency', payload);
            return { success: true, data: response };
        } catch (error: unknown) {
            logger.error('[CurrencyService] create error:', error);
            const err = error as { response?: { data?: { message?: string } } };
            const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูล';
            return { success: false, message: msg };
        }
    },

    update: async (id: string | number, data: CurrencyCreateRequest | CurrencyFormValues): Promise<{ success: boolean; data?: CurrencyApiItem; message?: string }> => {
        try {
            const payload = mapCurrencyToApi(data);
            // 📝 ใช้ PUT ไปยัง /currency/:id สำหรับการอัปเดตเป็น Object (เอา Array ออก)
            const response = await api.put<CurrencyApiItem>(`/currency/${id}`, payload);
            return { success: true, data: response };
        } catch (error: unknown) {
            logger.error('[CurrencyService] update error:', error);
            const err = error as { response?: { data?: { message?: string } } };
            const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล';
            return { success: false, message: msg };
        }
    },

    delete: async (id: string | number): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/currency/${id}`);
            return { success: true };
        } catch (error: unknown) {
            logger.error('[CurrencyService] delete error:', error);
            const err = error as { response?: { data?: { message?: string } } };
            const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล';
            return { success: false, message: msg };
        }
    },

    // 🔗 Legacy aliases to prevent breaking existing components that rely on the old method names
    getCurrencies: function(config?: AxiosRequestConfig) { return this.getAll(config); },
    getCurrencyById: function(id: string, config?: AxiosRequestConfig) { return this.getById(id, config); },
    createCurrency: function(data: CurrencyFormValues) { return this.create(data); },
    updateCurrency: function(id: string, data: CurrencyFormValues) { return this.update(id, data); },
    deleteCurrency: function(id: string) { return this.delete(id); },

    // Exchange Rate Types
    getExchangeRateTypes: async (config?: AxiosRequestConfig): Promise<BaseResponse<ExchangeRateType>> => {
        try {
            const res = await api.get<unknown>('/exchange-rate-type', config);
            const normalized = normalizeListResponse<ExchangeRateType>(res);
            return { 
                items: normalized.items, 
                total: Number(normalized.total), 
                page: Number(normalized.page), 
                limit: Number(normalized.limit || 20) 
            };
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateTypes error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getExchangeRateTypeById: async (id: string, config?: AxiosRequestConfig): Promise<ExchangeRateType | null> => {
        try {
            return await api.get<ExchangeRateType>(`/exchange-rate-type/${id}`, config);
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
    getExchangeRates: async (config?: AxiosRequestConfig): Promise<BaseResponse<ExchangeRate & { currency_code?: string; type_name?: string }>> => {
        try {
            const res = await api.get<unknown>('/exchange-rate', config);
            const normalized = normalizeListResponse<ExchangeRate & { currency_code?: string; type_name?: string }>(res);
            return { 
                items: normalized.items, 
                total: Number(normalized.total), 
                page: Number(normalized.page), 
                limit: Number(normalized.limit || 20) 
            };
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRates error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getExchangeRateById: async (id: string, config?: AxiosRequestConfig): Promise<ExchangeRate | null> => {
        try {
            return await api.get<ExchangeRate>(`/exchange-rate/${id}`, config);
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
    },

    getLatestExchangeRate: async (currencyId: string, rateDate?: string, config?: AxiosRequestConfig): Promise<{ rate: number; source?: string } | null> => {
        try {
            const res = await api.get<unknown>('/exchange-rate/latest', {
                ...config,
                params: { currency_id: currencyId, rate_date: rateDate }
            });
            return unwrapResponseData<{ rate: number; source?: string }>(res);
        } catch (error) {
            logger.error('[CurrencyService] getLatestExchangeRate error:', error);
            return null;
        }
    }
};