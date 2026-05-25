import { useState, useCallback } from 'react';
import type { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { PricingService } from '@sales/quotation/services/pricing.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import { 
    calculateDiscountAmount, 
    calculateLineTotal 
} from '@sales/shared/utils/sales-calculations';
import type { QuotationFormValues, QuotationLineValues } from '@sales/quotation/schemas/quotation-schemas';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem, UOMListItem } from '@inventory/types/product-types';

interface UseQuotationActionsProps {
    setValue: UseFormSetValue<QuotationFormValues>;
    getValues: UseFormGetValues<QuotationFormValues>;
    tax_code_id?: number;
    uoms?: UOMListItem[];
}

export function useQuotationActions({
    setValue,
    getValues,
    tax_code_id,
    uoms,
}: UseQuotationActionsProps) {
    const [loadingPriceLines, setLoadingPriceLines] = useState<Set<number>>(new Set());

    const handleAddLine = useCallback(() => {
        const newLine: QuotationLineValues = { 
            item_id: 0, 
            item_code: '', 
            item_name: '', 
            qty: 0, 
            uom_id: 0, 
            unit_price: 0, 
            discount_expression: '',
            line_discount: 0, 
            line_total: 0, 
            tax_code_id: tax_code_id || undefined,
            note: '',
        };
        const currentLines = getValues('lines') || [];
        setValue('lines', [...currentLines, newLine], { shouldDirty: true });
    }, [setValue, getValues, tax_code_id]);

    const handleRemoveLine = useCallback((index: number) => {
        const currentLines = getValues('lines') || [];
        setValue('lines', currentLines.filter((_, i) => i !== index), { shouldDirty: true });
    }, [setValue, getValues]);

    const handleLinePriceSync = useCallback(async (index: number) => {
        const currentLines = getValues('lines') || [];
        const line = currentLines[index];
        const { branch_id, customer_id } = getValues();

        if (!line?.item_id || !line.qty || !branch_id || !customer_id) return;
        if (line.price_source_name === 'MANUAL' || line.price_source === 3) return;

        setLoadingPriceLines(prev => new Set(prev).add(index));

        try {
            const resolvedPrice = await PricingService.calculatePrice({
                itemId: line.item_id,
                qty: Number(line.qty),
                branchId: Number(branch_id),
                customerId: Number(customer_id),
                uomId: Number(line.uom_id)
            });

            if (resolvedPrice) {
                const updatedLines = [...(getValues('lines') || [])];
                if (!updatedLines[index]) return;
                
                const updatedLine = { ...updatedLines[index] };
                const newPrice = Number(resolvedPrice.unitPrice);
                
                updatedLine.unit_price = newPrice;
                updatedLine.price_source = resolvedPrice.source;
                updatedLine.price_source_name = resolvedPrice.sourceName;
                updatedLine.price_level_priority = resolvedPrice.priority;

                const qty = Number(updatedLine.qty) || 0;
                const discExpr = updatedLine.discount_expression || '';
                const calculatedLD = calculateDiscountAmount(qty * newPrice, discExpr);
                
                updatedLine.line_discount = calculatedLD;
                updatedLine.line_total = calculateLineTotal(qty, newPrice, calculatedLD);

                updatedLines[index] = updatedLine;
                setValue('lines', updatedLines, { shouldValidate: true, shouldDirty: true });
            }
        } finally {
            setLoadingPriceLines(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    }, [getValues, setValue]);

    const handleLineChange = useCallback((index: number, field: keyof QuotationLineValues, value: string | number) => {
        const path = `lines.${index}.${field}` as const;
        const currentLine = getValues(`lines.${index}`);
        const prevValue = currentLine ? currentLine[field] : undefined;

        setValue(path as never, value as never, { 
            shouldValidate: true, 
            shouldDirty: true,
            shouldTouch: true
        });

        if (field === 'qty' || field === 'unit_price' || field === 'discount_expression') {
            const line = getValues(`lines.${index}`);
            if (!line) return;

            const qty = Number(field === 'qty' ? value : line.qty) || 0;
            const price = Number(field === 'unit_price' ? value : line.unit_price) || 0;
            const ldInput = (field === 'discount_expression' ? (value as string) : line.discount_expression) || '';
            
            const calculatedLD = calculateDiscountAmount(qty * price, ldInput);
            const lineTotal = calculateLineTotal(qty, price, calculatedLD);

            setValue(`lines.${index}.line_discount`, calculatedLD);
            setValue(`lines.${index}.line_total`, lineTotal);

            if (field === 'unit_price') {
                const hasChanged = Number(prevValue) !== Number(value);
                if (hasChanged) {
                    setValue(`lines.${index}.price_source`, 3);
                    setValue(`lines.${index}.price_source_name`, 'MANUAL');
                }
            }
        }

        if (field === 'uom_id') {
            void handleLinePriceSync(index);
        }
    }, [setValue, getValues, handleLinePriceSync]);

    const handleSelectCustomer = useCallback((customer: CustomerMaster) => {
        setValue('customer_id', Number(customer.customer_id || customer.id || 0), { shouldValidate: true, shouldDirty: true });
        if (customer.credit_term_days || customer.credit_days) {
            setValue('payment_term_days', Number(customer.credit_term_days || customer.credit_days || 0));
        }
    }, [setValue]);

    const handleSelectProduct = useCallback((index: number, product: ItemListItem) => {
        const lines = getValues('lines') || [];
        const newLines = [...lines];
        const line = newLines[index];

        if (line) {
            line.item_id = Number(product.item_id || product.id || 0);
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            // 🎯 Phase 1: Deep extract UOM ID
            const rawProduct = product as unknown as Record<string, unknown>;
            const uomData = rawProduct.uom as Record<string, unknown> | undefined;
            const saleUomData = rawProduct.sale_uom as Record<string, unknown> | undefined;
            const baseUomData = rawProduct.base_uom as Record<string, unknown> | undefined;
            
            let resolvedUomId = 
                product.uom_id || 
                (uomData?.uom_id as number) || 
                (uomData?.id as number) || 
                product.sale_uom_id || 
                (saleUomData?.uom_id as number) ||
                (saleUomData?.id as number) ||
                product.base_uom_id ||
                (baseUomData?.uom_id as number) ||
                (baseUomData?.id as number);

            // 🎯 Phase 2: Name-based recovery
            if (!resolvedUomId && product.uom_name && uoms) {
                const matchedUom = uoms.find((u: UOMListItem) => 
                    String(u.uom_name || '').trim().toLowerCase() === String(product.uom_name).trim().toLowerCase()
                );
                if (matchedUom) {
                    resolvedUomId = matchedUom.uom_id || matchedUom.id;
                }
            }
                
            line.uom_id = resolvedUomId ? Number(resolvedUomId) : 0;

            // 🎯 Phase 3: Resolve item_uom_id (conversion_id) for backend FK
            if (line.item_id && line.uom_id) {
                UOMConversionService.getByItemId(Number(line.item_id)).then(response => {
                    const convs = response?.items || [];
                    const matchedConv = 
                        convs.find(c => Number(c.from_unit_id) === Number(line.uom_id)) ||
                        convs.find(c => Number(c.conversion_factor) === 1); // fallback to base unit
                    if (matchedConv) {
                        setValue(`lines.${index}.item_uom_id` as never, Number(matchedConv.conversion_id) as never, { shouldDirty: true });
                    }
                }).catch(() => { /* silently continue — UOM picker can fix later */ });
            }

            line.unit_price = Number(product.standard_cost || product.price || 0);
            line.qty = 1;
            line.line_total = line.unit_price;
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            handleLinePriceSync(index);
        }
    }, [getValues, setValue, handleLinePriceSync, uoms]);

    return {
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleLinePriceSync,
        handleSelectCustomer,
        handleSelectProduct,
        loadingPriceLines
    };
}
