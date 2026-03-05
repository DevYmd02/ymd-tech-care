import api from '@/core/api/api';
import type { Currency, ExchangeRateType, ExchangeRate } from '@currency/types/currency-types';
import { logger } from '@/shared/utils/logger';

export interface BaseResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export const CurrencyService = {
    // Currency Codes
    getCurrencies: async (): Promise<BaseResponse<Currency>> => {
        try {
            const res = await api.get<{ data?: Currency[] } | Currency[]>('/currency');
            const resData = res;
            const items = Array.isArray(resData) ? resData : (resData?.data || []);
            return { items, total: items.length, page: 1, limit: items.length || 20 };
        } catch (error) {
            logger.error('[CurrencyService] getCurrencies error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getCurrencyById: async (id: string): Promise<Currency | null> => {
        try {
            return await api.get<Currency>(`/currency/${id}`);
        } catch (error) {
            logger.error('[CurrencyService] getCurrencyById error:', error);
            return null;
        }
    },

    createCurrency: async (data: Partial<Currency>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.post('/currency', data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] createCurrency error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    updateCurrency: async (id: string, data: Partial<Currency>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.put(`/currency/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] updateCurrency error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },

    deleteCurrency: async (id: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/currency/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] deleteCurrency error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
        }
    },

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