import { useMemo } from 'react';
import { useTaxCodes, useCurrencies } from '@/modules/master-data/hooks/useMasterData';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { Currency } from '@/modules/master-data/currency/types/currency-types';

export interface MappedOption<T> {
    value: string;
    label: string;
    original?: T;
}

export const useVQMasterData = (enabled = true) => {
    const { data: taxCodesResponse, isLoading: isLoadingTaxCodes } = useTaxCodes(enabled);
    const { data: currenciesResponse, isLoading: isLoadingCurrencies } = useCurrencies(enabled);

    const purchaseTaxOptions = useMemo(() => {
        const taxArray: TaxCode[] = (taxCodesResponse as any)?.data || (taxCodesResponse as any)?.items || (Array.isArray(taxCodesResponse) ? taxCodesResponse : []);
        
        const filteredTax = taxArray.filter((t: TaxCode) => {
            if (t.is_active === undefined || t.is_active === null) return true;
            if (typeof t.is_active === 'boolean') return t.is_active;
            return String(t.is_active).toUpperCase() === 'Y' || String(t.is_active) === '1';
        });

        return filteredTax.map((t: TaxCode) => ({
            value: String(t.tax_code_id || t.tax_id),
            label: `${t.tax_code} (${t.tax_rate}%)`,
            original: t
        }));
    }, [taxCodesResponse]);

    const currencyOptions = useMemo(() => {
        const currArray: Currency[] = (currenciesResponse as any)?.data || (currenciesResponse as any)?.items || (Array.isArray(currenciesResponse) ? currenciesResponse : []);
        
        let mapped = currArray.map((c: Currency) => ({
            value: String(c.currency_code),
            label: `${c.currency_code} - ${c.name_th || c.name_en}`,
            original: c
        }));

        if (mapped.length === 0) {
            mapped = [{ 
                value: 'THB', 
                label: 'THB - บาท',
                original: { currency_code: 'THB', name_th: 'บาท', name_en: 'Baht' } as Currency 
            }];
        }

        return mapped;
    }, [currenciesResponse]);

    return {
        purchaseTaxOptions,
        currencyOptions,
        isLoading: isLoadingTaxCodes || isLoadingCurrencies
    };
};