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
            return await api.get<BaseResponse<Currency>>('/master-data/currencies');
        } catch (error) {
            logger.error('[CurrencyService] getCurrencies error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getCurrencyById: async (id: string): Promise<Currency | null> => {
        try {
            return await api.get<Currency>(`/master-data/currencies/${id}`);
        } catch (error) {
            logger.error('[CurrencyService] getCurrencyById error:', error);
            return null;
        }
    },

    createCurrency: async (data: Partial<Currency>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.post('/master-data/currencies', data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] createCurrency error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    updateCurrency: async (id: string, data: Partial<Currency>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.put(`/master-data/currencies/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] updateCurrency error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },

    deleteCurrency: async (id: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/master-data/currencies/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] deleteCurrency error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
        }
    },

    // Exchange Rate Types
    getExchangeRateTypes: async (): Promise<BaseResponse<ExchangeRateType>> => {
        try {
            return await api.get<BaseResponse<ExchangeRateType>>('/master-data/exchange-rate-types');
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateTypes error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getExchangeRateTypeById: async (id: string): Promise<ExchangeRateType | null> => {
        try {
            return await api.get<ExchangeRateType>(`/master-data/exchange-rate-types/${id}`);
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateTypeById error:', error);
            return null;
        }
    },

    createExchangeRateType: async (data: Partial<ExchangeRateType>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.post('/master-data/exchange-rate-types', data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] createExchangeRateType error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    updateExchangeRateType: async (id: string, data: Partial<ExchangeRateType>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.put(`/master-data/exchange-rate-types/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] updateExchangeRateType error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },

    deleteExchangeRateType: async (id: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/master-data/exchange-rate-types/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] deleteExchangeRateType error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
        }
    },

    // Exchange Rates
    getExchangeRates: async (): Promise<BaseResponse<ExchangeRate & { currency_code?: string; type_name?: string }>> => {
        try {
            return await api.get<BaseResponse<ExchangeRate & { currency_code?: string; type_name?: string }>>('/master-data/exchange-rates');
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRates error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
        }
    },

    getExchangeRateById: async (id: string): Promise<ExchangeRate | null> => {
        try {
            return await api.get<ExchangeRate>(`/master-data/exchange-rates/${id}`);
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateById error:', error);
            return null;
        }
    },

    createExchangeRate: async (data: Partial<ExchangeRate>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.post('/master-data/exchange-rates', data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] createExchangeRate error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
        }
    },

    updateExchangeRate: async (id: string, data: Partial<ExchangeRate>): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.put(`/master-data/exchange-rates/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] updateExchangeRate error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' };
        }
    },

    deleteExchangeRate: async (id: string): Promise<{ success: boolean; message?: string }> => {
        try {
            await api.delete(`/master-data/exchange-rates/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[CurrencyService] deleteExchangeRate error:', error);
            return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' };
        }
    }
};