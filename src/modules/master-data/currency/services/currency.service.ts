import api from '@/core/api/api';
import type { Currency, ExchangeRateType, ExchangeRate } from '@/modules/master-data/types/currency-types';
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

    // Exchange Rate Types
    getExchangeRateTypes: async (): Promise<BaseResponse<ExchangeRateType>> => {
        try {
            return await api.get<BaseResponse<ExchangeRateType>>('/master-data/exchange-rate-types');
        } catch (error) {
            logger.error('[CurrencyService] getExchangeRateTypes error:', error);
            return { items: [], total: 0, page: 1, limit: 20 };
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
    }
};
