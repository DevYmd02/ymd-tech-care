export interface TaxCode {
    tax_id?: string;
    tax_code_id?: number | string;
    tax_code: string;
    tax_name: string;
    tax_type: 'SALES' | 'PURCHASE' | 'EXEMPT' | 'NONE' | string; // ภาษีขาย, ภาษีซื้อ, ยกเว้น, ไม่คิดอะไร
    tax_rate: number | string;
    description?: string;
    is_active: boolean;
    created_at: string;
    created_by?: string;
    updated_at: string;
    updated_by?: string;
}

export interface TaxGroup {
    tax_group_id: string;
    tax_group_code: string;
    description?: string;
    tax_type: 'TAX_CODE' | 'LUMP_SUM' | 'NONE'; // รหัสภาษี, เหมาภาษี, ไม่คิดอะไร
    tax_rate: number;
    is_active: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string;
}

export interface TaxOption {
    value: string;
    label: string;
}
