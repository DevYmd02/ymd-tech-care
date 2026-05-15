import { useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReset, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import { PricingService } from '@sales/quotation/services/pricing.service';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { logger } from '@utils';
import { getQuotationDefaultValues, type QuotationFormValues, type QuotationLineValues } from '@sales/quotation/schemas/quotation-schemas';
import type { QuotationFormData, QuotationHeader, RawQuotationLine } from '@sales/quotation/types/quotation.types';

interface UseQuotationHydrationProps {
    isOpen: boolean;
    id?: string;
    initialData?: QuotationHeader;
    reset: UseFormReset<QuotationFormValues>;
    setValue: UseFormSetValue<QuotationFormValues>;
    getValues: UseFormGetValues<QuotationFormValues>;
    isMasterDataReady: boolean;
}

export function useQuotationHydration({
    isOpen,
    id,
    initialData,
    reset,
    setValue,
    getValues,
    isMasterDataReady,
}: UseQuotationHydrationProps) {
    const lastInitializedId = useRef<string | null | 'new'>(null);
    const lastCustomerRef = useRef<number | null>(null);
    const lastBranchRef = useRef<number | null>(null);

    // Fetch Detail
    const { data: quotationDetail } = useQuery<QuotationFormData | null>({
        queryKey: ['quotation-detail', id],
        queryFn: () => id ? QuotationService.getById(id) : null,
        enabled: !!id && isOpen,
        staleTime: 1000 * 60 * 5,
    });

    const recoverMissingPriceSources = useCallback(async (lines: QuotationLineValues[], customerId: number, branchId: number) => {
        if (!lines || lines.length === 0 || !customerId || !branchId) return;

        const updatedLines = [...lines];
        let hasChanges = false;

        const promises = updatedLines.map(async (line, index) => {
            if (line.price_source_name && line.price_source_name !== '') return;

            try {
                const result = await PricingService.calculatePrice({
                    itemId: line.item_id,
                    qty: line.qty,
                    customerId,
                    branchId
                });

                if (result) {
                    const priceDiff = Math.abs(Number(result.unitPrice) - Number(line.unit_price));
                    if (priceDiff < 0.01) {
                        updatedLines[index] = {
                            ...line,
                            price_source: result.source,
                            price_source_name: result.sourceName,
                            price_level_priority: result.priority
                        };
                        hasChanges = true;
                    } else {
                        updatedLines[index] = {
                            ...line,
                            price_source: 3,
                            price_source_name: 'MANUAL'
                        };
                        hasChanges = true;
                    }
                }
            } catch (err) {
                logger.warn(`[useQuotationHydration] Price recovery failed for line ${index}`, err);
            }
        });

        await Promise.all(promises);
        if (hasChanges) {
            setValue('lines', updatedLines, { shouldDirty: false });
        }
    }, [setValue]);

    const enrichLinesWithItemData = useCallback(async (lines: QuotationLineValues[]) => {
        if (!lines || lines.length === 0) return;

        const missingIds = [...new Set(
            lines
                .filter(l => l.item_id && (!l.item_code || l.item_code === ''))
                .map(l => Number(l.item_id))
        )];

        if (missingIds.length === 0) return;
        
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const results = await Promise.allSettled(missingIds.map(itemId => ItemMasterService.getById(itemId)));

            const itemMap = new Map<number, { item_code: string; item_name: string }>();
            results.forEach((result, i) => {
                if (result.status === 'fulfilled' && result.value) {
                    itemMap.set(missingIds[i], {
                        item_code: result.value.item_code || '',
                        item_name: result.value.item_name || '',
                    });
                }
            });

            const currentLines = getValues('lines');
            currentLines.forEach((line: QuotationLineValues, idx: number) => {
                const itemId = Number(line.item_id);
                const found = itemMap.get(itemId);
                if (found) {
                    setValue(`lines.${idx}.item_code`, found.item_code, { shouldDirty: false });
                    setValue(`lines.${idx}.item_name`, found.item_name, { shouldDirty: false });
                }
            });
        } catch (err) {
            logger.error('[useQuotationHydration] Enrichment failed:', err);
        }
    }, [setValue, getValues]);

    const mapApiToForm = useCallback((apiData: QuotationFormData | QuotationHeader): QuotationFormValues => {
        const toFormDate = (dateStr?: string | null) => {
            if (!dateStr) return '';
            return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        };

        const baseCurr = String(apiData.base_currency_code || 'THB');
        const quoteCurr = String(apiData.quote_currency_code || (apiData as QuotationFormData).currency_code || (apiData as QuotationHeader).currency || 'THB');
        
        const isMulti = apiData.isMulticurrency === true || 
                        (baseCurr !== 'THB') || 
                        (quoteCurr !== 'THB' && quoteCurr !== '') ||
                        (baseCurr !== quoteCurr);

        // Safe property access for union types
        const rawDate = (apiData as QuotationFormData).sq_date || (apiData as QuotationHeader).date || '';
        const rawValidUntil = (apiData as QuotationFormData).valid_until || (apiData as QuotationHeader).expiry_date || '';
        const rawExchangeDate = apiData.exchange_rate_date || rawDate;

        return {
            sq_id: String(apiData.sq_id || ''),
            sq_no: String(apiData.sq_no || ''),
            sq_date: toFormDate(rawDate),
            lead_id: apiData.lead_id || null,
            customer_id: Number(apiData.customer_id || 0),
            branch_id: Number(apiData.branch_id || 0),
            currency_code: quoteCurr,
            isMulticurrency: isMulti,
            base_currency_code: baseCurr,
            quote_currency_code: quoteCurr,
            exchange_rate: Number(apiData.exchange_rate || 1),
            exchange_rate_date: toFormDate(String(rawExchangeDate || '')),
            status: ((apiData.status || '').toUpperCase() as QuotationFormValues['status']) || 'DRAFT',
            valid_until: toFormDate(rawValidUntil),
            sub_total: Number(apiData.sub_total || (apiData as Record<string, unknown>).quote_sub_total || (apiData as Record<string, unknown>).base_sub_total || 0),
            discount_expression: (() => {
                const r = apiData as Record<string, unknown>;
                const expr = String(r.discount_expression || r.discount_input || r.discount_rate || r.discount || r.header_discount || '');
                if (expr && expr !== '0' && expr !== 'null' && expr !== 'undefined') return expr;
                const amt = Number(apiData.discount_amount || r.quote_discount_amount || r.base_discount_amount || r.total_discount || 0);
                return amt > 0 ? String(amt) : '0';
            })(),
            discount_amount: Number(apiData.discount_amount || (apiData as Record<string, unknown>).quote_discount_amount || (apiData as Record<string, unknown>).base_discount_amount || (apiData as Record<string, unknown>).total_discount || 0),
            vat_amount: Number(apiData.vat_amount || (apiData as Record<string, unknown>).quote_tax_amount || (apiData as Record<string, unknown>).base_tax_amount || 0),
            total_amount: Number(apiData.total_amount || (apiData as Record<string, unknown>).quote_total_amount || (apiData as Record<string, unknown>).base_total_amount || 0),
            remarks: String(apiData.remarks || ''),
            payment_term_days: Number(apiData.payment_term_days || 0),
            onhold: (apiData.onhold === 'Y' ? 'Y' : 'N') as QuotationFormValues['onhold'],
            tax_code_id: apiData.tax_code_id ? Number(apiData.tax_code_id) : 0,
            item_id: apiData.item_id ? Number(apiData.item_id) : 0,
            sale_area_id: apiData.sale_area_id ? Number(apiData.sale_area_id) : 0,
            emp_sale_id: apiData.emp_sale_id ? Number(apiData.emp_sale_id) : 0,
            emp_dept_id: apiData.emp_dept_id ? Number(apiData.emp_dept_id) : 0,
            project_id: apiData.project_id ? Number(apiData.project_id) : 0,
            sq_status: String(apiData.sq_status || ''),
            status_remark: String(apiData.status_remark || ''),
            lines: (apiData.lines || (apiData as QuotationFormData).saleQuotationLines || []).map(line => {
                const lineRaw = line as RawQuotationLine;
                return {
                    sq_line_id: String(lineRaw.sq_line_id || ''),
                    sq_id: String(lineRaw.sq_id || ''),
                    item_id: Number(lineRaw.item_id || lineRaw.product_id || 0),
                    item_code: lineRaw.item_code || lineRaw.product_code || lineRaw.code || '',
                    item_name: lineRaw.item_name || lineRaw.product_name || lineRaw.name || '',
                    qty: Number(lineRaw.qty || 0),
                    uom_id: Number(lineRaw.uom_id || 0),
                    unit_price: Number(line.unit_price || 0),
                    discount_expression: line.line_discount_input || line.discount_expression || '0',
                    line_discount: Number(line.line_discount || 0),
                    tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : null,
                    line_total: Number(lineRaw.line_total || lineRaw.net_amount || lineRaw.total_amount || 0),
                    note: line.note || '',
                    price_source: line.price_source ? Number(line.price_source) : undefined,
                    price_source_name: line.price_source_name || '',
                    price_level_priority: line.price_level_priority ? Number(line.price_level_priority) : undefined,
                };
            })
        };
    }, []);

    useEffect(() => {
        if (!isOpen || !isMasterDataReady) return;

        const currentTarget = id || 'new';

        // 🎯 Mode 1: Data-Reuse Pattern (If initialData has lines, use it immediately)
        const hasInitialLines = !!(initialData && initialData.lines && initialData.lines.length > 0);
        
        if (hasInitialLines && !quotationDetail && lastInitializedId.current !== currentTarget) {
            const mappedData = mapApiToForm(initialData as unknown as QuotationFormData);
            reset(mappedData);
            lastInitializedId.current = currentTarget;
            void recoverMissingPriceSources(mappedData.lines, Number(mappedData.customer_id), Number(mappedData.branch_id));
            void enrichLinesWithItemData(mappedData.lines || []);
            return;
        }

        if (id && quotationDetail) {
            const detailId = 'detail-' + currentTarget;
            if (lastInitializedId.current === detailId) return;

            const mappedData = mapApiToForm(quotationDetail);
            reset(mappedData);
            lastInitializedId.current = detailId;
            
            lastCustomerRef.current = Number(mappedData.customer_id || 0);
            lastBranchRef.current = Number(mappedData.branch_id || 0);
            
            void recoverMissingPriceSources(mappedData.lines, Number(mappedData.customer_id), Number(mappedData.branch_id));
            void enrichLinesWithItemData(mappedData.lines || []);
        } else if (!id && lastInitializedId.current !== currentTarget) {
            reset(getQuotationDefaultValues());
            lastInitializedId.current = currentTarget;
        }
    }, [isOpen, isMasterDataReady, id, initialData, quotationDetail, reset, mapApiToForm, recoverMissingPriceSources, enrichLinesWithItemData]);

    useEffect(() => {
        if (!isOpen) {
            lastInitializedId.current = null;
        }
    }, [isOpen]);

    return {
        recoverMissingPriceSources,
        enrichLinesWithItemData,
        lastCustomerRef,
        lastBranchRef
    };
}
