import { useState, useEffect } from 'react';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { Currency } from '@/modules/master-data/currency/types/currency-types';
import { logger } from '@/shared/utils/logger';

export interface MappedOption<T> {
    value: string;
    label: string;
    original?: T;
}

export const useVQMasterData = () => {
    const [purchaseTaxOptions, setPurchaseTaxOptions] = useState<MappedOption<TaxCode>[]>([]);
    const [currencyOptions, setCurrencyOptions] = useState<MappedOption<Currency>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                setIsLoading(true);
                const [taxCodes, currencies] = await Promise.all([
                    TaxCodeService.getTaxCodes(),
                    CurrencyService.getCurrencies()
                ]);
                
                // 1. Map Tax Codes
                interface TaxResponseObject {
                    data?: TaxCode[];
                    items?: TaxCode[];
                }

                let taxArray: TaxCode[] = [];
                if (Array.isArray(taxCodes)) {
                    taxArray = taxCodes;
                } else if (taxCodes && typeof taxCodes === 'object') {
                    const wrapped = taxCodes as TaxResponseObject;
                    taxArray = wrapped.data || wrapped.items || [];
                }
                
                const filteredTax = taxArray.filter((t: TaxCode) => {
                    if (t.is_active === undefined || t.is_active === null) return true;
                    if (typeof t.is_active === 'boolean') return t.is_active;
                    return String(t.is_active).toUpperCase() === 'Y' || String(t.is_active) === '1';
                });

                setPurchaseTaxOptions(filteredTax.map((t: TaxCode) => ({
                    value: String(t.tax_code_id || t.tax_id),
                    label: `${t.tax_code} (${t.tax_rate}%)`,
                    original: t
                })));

                // 2. Map Currencies
                const currArray = Array.isArray(currencies) ? currencies : (currencies?.items || []);
                
                let mappedCurrencies = currArray.map((c: Currency) => ({
                    value: String(c.currency_code),
                    label: `${c.currency_code} - ${c.name_th || c.name_en}`,
                    original: c
                }));

                // 📡 @Agent_Network_Optimizer: Fallback to THB if API fails or returns empty
                if (mappedCurrencies.length === 0) {
                    mappedCurrencies = [{ 
                        value: 'THB', 
                        label: 'THB - บาท',
                        original: { currency_code: 'THB', name_th: 'บาท', name_en: 'Baht' } as Currency 
                    }];
                }

                setCurrencyOptions(mappedCurrencies);

            } catch (err) {
                logger.error('[useVQMasterData] Failed to fetch master data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMasterData();
    }, []);

    return {
        purchaseTaxOptions,
        currencyOptions,
        isLoading
    };
};