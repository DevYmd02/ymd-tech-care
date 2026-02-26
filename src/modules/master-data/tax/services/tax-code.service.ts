import api, { USE_MOCK } from '@/core/api/api';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_TAX_CODES } from '@/modules/master-data/mocks/data/taxMocks';

export const TaxCodeService = {
    getTaxCodes: async (): Promise<TaxCode[]> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Tax Codes');
            return new Promise((resolve) => {
                setTimeout(() => resolve([...MOCK_TAX_CODES]), 500);
            });
        }
        try {
            type TaxCodeResponse = TaxCode[] | { data?: TaxCode[]; items?: TaxCode[] };
            const response = await api.get<TaxCodeResponse>('/tax-code');

            if (Array.isArray(response)) {
                return response;
            } else if (response && 'data' in response && Array.isArray(response.data)) {
                return response.data;
            } else if (response && 'items' in response && Array.isArray(response.items)) {
                return response.items;
            }
            return [];
        } catch (error) {
            logger.error('[TaxCodeService] getTaxCodes error:', error);
            throw error;
        }
    },

    getTaxCodeById: async (id: string): Promise<TaxCode | undefined> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => resolve(MOCK_TAX_CODES.find(t => t.tax_id === id)), 300);
            });
        }
        try {
            return await api.get<TaxCode>(`/tax-code/${id}`);
        } catch (error) {
            logger.error('[TaxCodeService] getTaxCodeById error:', error);
            throw error;
        }
    },

    createTaxCode: async (data: Partial<TaxCode>): Promise<TaxCode> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const newTax: TaxCode = {
                        ...data as TaxCode,
                        tax_id: Math.random().toString(36).substr(2, 9),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: 'Admin',
                        updated_by: 'Admin'
                    };
                    MOCK_TAX_CODES.push(newTax);
                    resolve(newTax);
                }, 500);
            });
        }
        try {
            return await api.post<TaxCode>('/tax-code', data);
        } catch (error) {
            logger.error('[TaxCodeService] createTaxCode error:', error);
            throw error;
        }
    },

    updateTaxCode: async (id: string, data: Partial<TaxCode>): Promise<TaxCode> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const index = MOCK_TAX_CODES.findIndex(t => t.tax_id === id);
                    if (index !== -1) {
                        MOCK_TAX_CODES[index] = { ...MOCK_TAX_CODES[index], ...data, updated_at: new Date().toISOString() };
                        resolve(MOCK_TAX_CODES[index]);
                    }
                }, 500);
            });
        }
        try {
            return await api.put<TaxCode>(`/tax-code/${id}`, data);
        } catch (error) {
            logger.error('[TaxCodeService] updateTaxCode error:', error);
            throw error;
        }
    },

    deleteTaxCode: async (id: string): Promise<boolean> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const index = MOCK_TAX_CODES.findIndex(t => t.tax_id === id);
                    if (index !== -1) {
                        MOCK_TAX_CODES.splice(index, 1);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }, 500);
            });
        }
        try {
            await api.delete(`/tax-code/${id}`);
            return true;
        } catch (error) {
            logger.error('[TaxCodeService] deleteTaxCode error:', error);
            return false;
        }
    },

    getDefaultTaxRate: async (): Promise<number> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const defaultTax = MOCK_TAX_CODES.find(t => t.tax_code === 'VAT-OUT-7');
                    resolve(defaultTax ? Number(defaultTax.tax_rate) : 7);
                }, 300);
            });
        }
        try {
            const response = await api.get<{ tax_rate: number | string }>('/tax-code/default-rate');
            return Number(response.tax_rate);
        } catch (error) {
            logger.error('[TaxCodeService] getDefaultTaxRate error:', error);
            return 7;
        }
    },
};
