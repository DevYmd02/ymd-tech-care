import api, { USE_MOCK } from '@/core/api/api';
import type { TaxGroup } from '@/modules/master-data/tax/types/tax-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_TAX_GROUPS } from '@/modules/master-data/mocks/data/taxMocks';

export const TaxGroupService = {
    getTaxGroups: async (): Promise<TaxGroup[]> => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Serving Tax Groups');
            return new Promise((resolve) => {
                setTimeout(() => resolve([...MOCK_TAX_GROUPS]), 500);
            });
        }
        try {
            type TaxGroupResponse = TaxGroup[] | { data?: TaxGroup[]; items?: TaxGroup[] };
            const response = await api.get<TaxGroupResponse>('/tax-group');

            if (Array.isArray(response)) {
                return response;
            } else if (response && 'data' in response && Array.isArray(response.data)) {
                return response.data;
            } else if (response && 'items' in response && Array.isArray(response.items)) {
                return response.items;
            }
            return [];
        } catch (error) {
            logger.error('[TaxGroupService] getTaxGroups error:', error);
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
            return await api.get<TaxGroup>(`/tax-group/${id}`);
        } catch (error) {
            logger.error('[TaxGroupService] getTaxGroupById error:', error);
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
            return await api.post<TaxGroup>('/tax-group', data);
        } catch (error) {
            logger.error('[TaxGroupService] createTaxGroup error:', error);
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
            return await api.put<TaxGroup>(`/tax-group/${id}`, data);
        } catch (error) {
            logger.error('[TaxGroupService] updateTaxGroup error:', error);
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
            await api.delete(`/tax-group/${id}`);
            return true;
        } catch (error) {
            logger.error('[TaxGroupService] deleteTaxGroup error:', error);
            return false;
        }
    },
};
