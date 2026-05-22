import { useEffect, useRef, useCallback } from 'react';
import type { UseFormReset, UseFormSetValue } from 'react-hook-form';
import type { SalesOrderFormValues, SalesOrderLineValues } from '../schemas/sales-order.schemas';
import { getSalesOrderDefaultValues } from '../schemas/sales-order.schemas';
import { logger } from '@/shared/utils';

interface UseSalesOrderHydrationProps {
    isOpen: boolean;
    id?: string;
    initialData?: Partial<SalesOrderFormValues>;
    reset: UseFormReset<SalesOrderFormValues>;
    setValue: UseFormSetValue<SalesOrderFormValues>;
}

export function useSalesOrderHydration({
    isOpen,
    id,
    initialData,
    reset,
    setValue
}: UseSalesOrderHydrationProps) {
    const isInitializedRef = useRef(false);

    /**
     * 🕵️ Smart Recovery for Sales Order: Automatically detect price sources if missing
     */
    const recoverSalesOrderPriceSources = useCallback(async (
        lines: SalesOrderLineValues[], 
        customerId: number, 
        branchId: number
    ) => {
        if (!lines || lines.length === 0 || !customerId || !branchId) return;

        const updatedLines = [...lines];
        let hasChanges = false;

        const promises = updatedLines.map(async (line, index) => {
            if (line.price_source_name && line.price_source_name !== '') return;

            try {
                const { PricingService } = await import('@sales/quotation/services/pricing.service');
                const result = await PricingService.calculatePrice({
                    itemId: Number(line.item_id),
                    qty: Number(line.qty_ordered) || 1,
                    customerId,
                    branchId,
                    uomId: Number(line.uom_id)
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
                logger.warn('[recoverSalesOrderPriceSources] Failed for line', index, err);
            }
        });

        await Promise.all(promises);
        if (hasChanges) {
            setValue('lines', updatedLines as SalesOrderLineValues[]);
        }
    }, [setValue]);

    useEffect(() => {
        if (!isOpen) {
            isInitializedRef.current = false;
            return;
        }

        const isEditing = !!id;
        const hasActualData = initialData && (
            initialData.so_no || 
            initialData.customer_id || 
            (initialData.lines && initialData.lines.length > 0) ||
            initialData.reservation_id
        );

        if (!isEditing && !isInitializedRef.current) {
            reset({
                ...getSalesOrderDefaultValues(),
                ...(initialData || {}),
            } as SalesOrderFormValues);
            isInitializedRef.current = true;
            return;
        }

        if (isEditing && hasActualData && !isInitializedRef.current) {
            logger.debug('[useSalesOrderHydration] Initializing Edit Mode with data:', initialData.so_no);
            reset({
                ...getSalesOrderDefaultValues(),
                ...initialData,
            } as SalesOrderFormValues);
            isInitializedRef.current = true;

            if (initialData.customer_id && initialData.branch_id && initialData.lines) {
                void recoverSalesOrderPriceSources(
                    initialData.lines as SalesOrderLineValues[],
                    Number(initialData.customer_id),
                    Number(initialData.branch_id)
                );
            }
        }
    }, [isOpen, initialData, reset, id, recoverSalesOrderPriceSources]);

    return {
        recoverSalesOrderPriceSources
    };
}
