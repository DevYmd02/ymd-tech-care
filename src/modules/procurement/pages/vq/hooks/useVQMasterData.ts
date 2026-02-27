import { useState, useEffect } from 'react';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { logger } from '@/shared/utils/logger';

export interface MappedOption<T> {
    value: string;
    label: string;
    original?: T;
}

export const useVQMasterData = () => {
    const [purchaseTaxOptions, setPurchaseTaxOptions] = useState<MappedOption<TaxCode>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTaxCodes = async () => {
            try {
                setIsLoading(true);
                const taxCodes = await TaxCodeService.getTaxCodes();
                
                // Define expected response shapes without using any
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
                
                // Filter active codes
                const filtered = taxArray.filter((t: TaxCode) => {
                    if (t.is_active === undefined || t.is_active === null) return true;
                    if (typeof t.is_active === 'boolean') return t.is_active;
                    return String(t.is_active).toUpperCase() === 'Y' || String(t.is_active) === '1' || String(t.is_active).toLowerCase() === 'true';
                });

                setPurchaseTaxOptions(filtered.map((t: TaxCode) => ({
                    value: String(t.tax_code_id || t.tax_id),
                    label: `${t.tax_code} (${t.tax_rate}%)`,
                    original: t
                })));
            } catch (err) {
                logger.error('[useVQMasterData] Failed to fetch tax codes:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTaxCodes();
    }, []);

    return {
        purchaseTaxOptions,
        isLoading
    };
};
