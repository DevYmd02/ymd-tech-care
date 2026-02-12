
import type { TaxCode, TaxGroup } from '../types/tax-types';

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
        return new Promise((resolve) => {
            setTimeout(() => resolve([...MOCK_TAX_CODES]), 500);
        });
    },
    
    getTaxCodeById: async (id: string): Promise<TaxCode | undefined> => {
           return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_TAX_CODES.find(t => t.tax_id === id)), 300);
        });
    },

    createTaxCode: async (data: Partial<TaxCode>): Promise<TaxCode> => {
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
    },

    updateTaxCode: async (id: string, data: Partial<TaxCode>): Promise<TaxCode> => {
         return new Promise((resolve) => {
            setTimeout(() => {
                const index = MOCK_TAX_CODES.findIndex(t => t.tax_id === id);
                if (index !== -1) {
                    MOCK_TAX_CODES[index] = { ...MOCK_TAX_CODES[index], ...data, updated_at: new Date().toISOString() };
                    resolve(MOCK_TAX_CODES[index]);
                }
            }, 500);
        });
    },

    deleteTaxCode: async (id: string): Promise<boolean> => {
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
    },

    getDefaultTaxRate: async (): Promise<number> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const defaultTax = MOCK_TAX_CODES.find(t => t.tax_code === 'VAT-OUT-7');
                resolve(defaultTax ? defaultTax.tax_rate : 7);
            }, 300);
        });
    },

    // --- Tax Groups ---
     getTaxGroups: async (): Promise<TaxGroup[]> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve([...MOCK_TAX_GROUPS]), 500);
        });
    },
    
    getTaxGroupById: async (id: string): Promise<TaxGroup | undefined> => {
           return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_TAX_GROUPS.find(t => t.tax_group_id === id)), 300);
        });
    },

    createTaxGroup: async (data: Partial<TaxGroup>): Promise<TaxGroup> => {
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
    },

    updateTaxGroup: async (id: string, data: Partial<TaxGroup>): Promise<TaxGroup> => {
         return new Promise((resolve) => {
            setTimeout(() => {
                const index = MOCK_TAX_GROUPS.findIndex(t => t.tax_group_id === id);
                if (index !== -1) {
                    MOCK_TAX_GROUPS[index] = { ...MOCK_TAX_GROUPS[index], ...data, updated_at: new Date().toISOString() };
                    resolve(MOCK_TAX_GROUPS[index]);
                }
            }, 500);
        });
    },

    deleteTaxGroup: async (id: string): Promise<boolean> => {
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
    },
};
