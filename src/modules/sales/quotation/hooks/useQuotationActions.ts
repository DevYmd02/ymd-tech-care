import { useState, useCallback } from 'react';
import type { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import { PricingService } from '@sales/quotation/services/pricing.service';
import { 
    calculateDiscountAmount, 
    calculateLineTotal 
} from '@sales/shared/utils/sales-calculations';
import type { QuotationFormValues, QuotationLineValues } from '@sales/quotation/schemas/quotation-schemas';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem } from '@inventory/types/product-types';

interface UseQuotationActionsProps {
    setValue: UseFormSetValue<QuotationFormValues>;
    getValues: UseFormGetValues<QuotationFormValues>;
    tax_code_id?: number;
}

export function useQuotationActions({
    setValue,
    getValues,
    tax_code_id,
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
                customerId: Number(customer_id)
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
                setValue(`lines.${index}.price_source`, 3);
                setValue(`lines.${index}.price_source_name`, 'MANUAL');
            }
        }
    }, [setValue, getValues]);

    const handleSelectCustomer = useCallback((customer: CustomerMaster) => {
        setValue('customer_id', Number(customer.customer_id || customer.id || 0), { shouldValidate: true, shouldDirty: true });
        if (customer.credit_term_days || customer.credit_days) {
            setValue('payment_term_days', Number(customer.credit_term_days || customer.credit_days || 0));
        }
    }, [setValue]);

    const handleSelectProduct = useCallback((index: number, product: ItemListItem) => {
        const currentLines = getValues('lines') || [];
        const newLines = [...currentLines];
        const line = newLines[index];
        if (line) {
            line.item_id = Number(product.item_id || product.id || 0);
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            const productUomId = product.uom_id || product.unit_id || product.sale_uom_id || product.base_uom_id || product.sales_unit_id;
            line.uom_id = Number(productUomId || 0);

            line.unit_price = Number(product.standard_cost || product.price || 0);
            line.qty = 1;
            line.line_total = line.unit_price;
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            handleLinePriceSync(index);
        }
    }, [getValues, setValue, handleLinePriceSync]);

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
