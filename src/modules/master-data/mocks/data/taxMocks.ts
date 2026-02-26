import type { TaxCode, TaxGroup } from '@/modules/master-data/tax/types/tax-types';

export const MOCK_TAX_CODES: TaxCode[] = [
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

export const MOCK_TAX_GROUPS: TaxGroup[] = [
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
