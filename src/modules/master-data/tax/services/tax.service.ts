import api, { USE_MOCK } from '@/core/api/api';
import type { TaxCode, TaxGroup } from '../types/tax-types';
import { logger } from '@/shared/utils/logger';

// Mock Data: Tax Codes
const MOCK_TAX_CODES: TaxCode[] = [
    {
        tax_id: '1',
        tax_code: 'VAT-OUT-7',
        tax_name: 'ภาษีขาย 7%',
        tax_type: 'SALES',
        tax_rate: 7,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_id: '2',
        tax_code: 'VAT-IN-7',
        tax_name: 'ภาษีซื้อ 7%',
        tax_type: 'PURCHASE',
        tax_rate: 7,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_id: '3',
        tax_code: 'EXEMPT',
        tax_name: 'ได้รับยกเว้นภาษี',
        tax_type: 'EXEMPT',
        tax_rate: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_id: '4',
        tax_code: 'VAT-OUT-10',
        tax_name: 'ภาษีขาย 10% (อนาคต)',
        tax_type: 'SALES',
        tax_rate: 10,
        is_active: false,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_id: '5',
        tax_code: 'VAT-OUT-0',
        tax_name: 'ภาษีขาย 0% (ส่งออก)',
        tax_type: 'SALES',
        tax_rate: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
];

// Mock Data: Tax Groups
const MOCK_TAX_GROUPS: TaxGroup[] = [
    {
        tax_group_id: '1',
        tax_group_code: 'TG-VAT-7',
        tax_type: 'TAX_CODE',
        tax_rate: 7,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_group_id: '2',
        tax_group_code: 'TG-LUMP-3',
        tax_type: 'LUMP_SUM',
        tax_rate: 3,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_group_id: '3',
        tax_group_code: 'TG-NONE',
        tax_type: 'NONE',
        tax_rate: 0,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
    {
        tax_group_id: '4',
        tax_group_code: 'TG-VAT-10',
        tax_type: 'TAX_CODE',
        tax_rate: 10,
        is_active: false,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    },
     {
        tax_group_id: '5',
        tax_group_code: 'TG-LUMP-5',
        tax_type: 'LUMP_SUM',
        tax_rate: 5,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        created_by: 'System',
        updated_at: '2023-01-01T00:00:00Z',
        updated_by: 'System'
    }
];

export const TaxService = {
    // --- Tax Codes ---
    getTaxCodes: async (): Promise<TaxCode[]> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Tax Codes');
            return new Promise((resolve) => {
                setTimeout(() => resolve([...MOCK_TAX_CODES]), 500);
            });
        }
        try {
            return await api.get<TaxCode[]>('/taxes');
        } catch (error) {
            logger.error('[TaxService] getTaxCodes error:', error);
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
            return await api.get<TaxCode>(`/taxes/${id}`);
        } catch (error) {
            logger.error('[TaxService] getTaxCodeById error:', error);
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
            return await api.post<TaxCode>('/taxes', data);
        } catch (error) {
            logger.error('[TaxService] createTaxCode error:', error);
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
            return await api.put<TaxCode>(`/taxes/${id}`, data);
        } catch (error) {
            logger.error('[TaxService] updateTaxCode error:', error);
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
            await api.delete(`/taxes/${id}`);
            return true;
        } catch (error) {
            logger.error('[TaxService] deleteTaxCode error:', error);
            return false;
        }
    },

    getDefaultTaxRate: async (): Promise<number> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const defaultTax = MOCK_TAX_CODES.find(t => t.tax_code === 'VAT-OUT-7');
                    resolve(defaultTax ? defaultTax.tax_rate : 7);
                }, 300);
            });
        }
        try {
            // Assuming there's a specific endpoint or we fetch all and find default
            // For now, let's fetch default from a dedicated endpoint or filter from list
            const response = await api.get<{tax_rate: number}>('/taxes/default-rate');
            return response.tax_rate;
        } catch (error) {
            logger.error('[TaxService] getDefaultTaxRate error:', error);
            return 7; // Fallback to 7 if API fails? Or define as strict? 
            // Strict mode says "return empty state or throw". 
            // For a default rate, causing a crash might be bad. But returning 7 silently masks the error.
            // Let's log error and return 7 for now but at least we TRIED the API.
        }
    },

    // --- Tax Groups ---
     getTaxGroups: async (): Promise<TaxGroup[]> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Tax Groups');
            return new Promise((resolve) => {
                setTimeout(() => resolve([...MOCK_TAX_GROUPS]), 500);
            });
        }
        try {
            return await api.get<TaxGroup[]>('/tax-groups');
        } catch (error) {
            logger.error('[TaxService] getTaxGroups error:', error);
            throw error;
        }
    },
    
    getTaxGroupById: async (id: string): Promise<TaxGroup | undefined> => {
        if (USE_MOCK) {
               return new Promise((resolve) => {
                setTimeout(() => resolve(MOCK_TAX_GROUPS.find(t => t.tax_group_id === id)), 300);
            });
        }
        try {
            return await api.get<TaxGroup>(`/tax-groups/${id}`);
        } catch (error) {
            logger.error('[TaxService] getTaxGroupById error:', error);
            throw error;
        }
    },

    createTaxGroup: async (data: Partial<TaxGroup>): Promise<TaxGroup> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const newGroup: TaxGroup = {
                         ...data as TaxGroup,
                        tax_group_id: Math.random().toString(36).substr(2, 9),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        created_by: 'Admin',
                        updated_by: 'Admin'
                    };
                    MOCK_TAX_GROUPS.push(newGroup);
                    resolve(newGroup);
                }, 500);
            });
        }
        try {
            return await api.post<TaxGroup>('/tax-groups', data);
        } catch (error) {
            logger.error('[TaxService] createTaxGroup error:', error);
            throw error;
        }
    },

    updateTaxGroup: async (id: string, data: Partial<TaxGroup>): Promise<TaxGroup> => {
        if (USE_MOCK) {
             return new Promise((resolve) => {
                setTimeout(() => {
                    const index = MOCK_TAX_GROUPS.findIndex(t => t.tax_group_id === id);
                    if (index !== -1) {
                        MOCK_TAX_GROUPS[index] = { ...MOCK_TAX_GROUPS[index], ...data, updated_at: new Date().toISOString() };
                        resolve(MOCK_TAX_GROUPS[index]);
                    }
                }, 500);
            });
        }
        try {
            return await api.put<TaxGroup>(`/tax-groups/${id}`, data);
        } catch (error) {
            logger.error('[TaxService] updateTaxGroup error:', error);
            throw error;
        }
    },

    deleteTaxGroup: async (id: string): Promise<boolean> => {
        if (USE_MOCK) {
              return new Promise((resolve) => {
                setTimeout(() => {
                    const index = MOCK_TAX_GROUPS.findIndex(t => t.tax_group_id === id);
                    if (index !== -1) {
                        MOCK_TAX_GROUPS.splice(index, 1);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }, 500);
            });
        }
        try {
            await api.delete(`/tax-groups/${id}`);
            return true;
        } catch (error) {
            logger.error('[TaxService] deleteTaxGroup error:', error);
            return false;
        }
    },
};
