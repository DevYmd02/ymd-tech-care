import { useEffect, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    DeliveryFormSchema,
    type DeliveryFormValues,
    type DeliveryLineValues,
    getDeliveryDefaultValues,
} from '../schemas/delivery.schemas';
import { logger } from '@/shared/utils';
import type { ItemListItem } from '@inventory/types/product-types';
import type { UnitListItem } from '@master-data/types/master-data-types';
import { DeliveryService } from '../services/delivery.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import type { CustomerAddress } from '@customer/customer-master/types/customer-types';

interface UseDeliveryFormProps {
    isOpen: boolean;
    id?: string;
    initialData?: Partial<DeliveryFormValues>;
    uoms: UnitListItem[];
}

export function useDeliveryForm({ isOpen, id, initialData, uoms }: UseDeliveryFormProps) {
    const methods = useForm<DeliveryFormValues>({
        resolver: zodResolver(DeliveryFormSchema) as Resolver<DeliveryFormValues>,
        defaultValues: {
            ...getDeliveryDefaultValues(),
            ...(initialData || {}),
        } as DeliveryFormValues,
        mode: 'onBlur',
    });

    const { setValue, control, reset, getValues } = methods;

    // 💡 Performance Optimization: Watch only 'lines' instead of the entire form object.
    // This prevents the entire modal from re-rendering when typing in header fields.
    const lines = useWatch({ control, name: 'lines' }) || [];

    const isInitializedRef = useRef(false);

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (!isOpen) {
            isInitializedRef.current = false;
            return;
        }

        const isEditing = !!id;
        const hasData = initialData && Object.keys(initialData).length > 0;

        if (!isInitializedRef.current) {
            if (!isEditing || hasData) {
                reset({
                    ...getDeliveryDefaultValues(),
                    ...(initialData || {}),
                });
                if (hasData) {
                    isInitializedRef.current = true;
                }
            }
        } else if (hasData) {
            // 🔄 Re-sync if data updates (e.g. after background refetch)
            reset({
                ...getDeliveryDefaultValues(),
                ...(initialData || {}),
            });
        }
    }, [isOpen, initialData, reset, id]);

    // --------------------------------------------------------
    // Line Item Actions
    // --------------------------------------------------------
    const handleAddLine = () => {
        const newLine: DeliveryLineValues = {
            item_id: '',
            item_code: '',
            item_name: '',
            qty_shipped: 0,
            uom_id: '',
            uom_name: '',
            warehouse_id: '',
            location_id: '',
            lot_id: '',
            lot_no: '',
            serial_no: '',
            remarks: '',
        };
        const currentLines = getValues('lines') || [];
        setValue('lines', [...currentLines, newLine]);
    };

    const handleRemoveLine = (index: number) => {
        const currentLines = getValues('lines') || [];
        setValue('lines', currentLines.filter((_, i) => i !== index));
    };

    const handleLineChange = (
        index: number,
        field: keyof DeliveryLineValues,
        value: string | number | boolean | undefined
    ) => {
        const currentLines = getValues('lines') || [];
        const newLines = [...currentLines];
        const updatedLine = { ...newLines[index], [field]: value };
        newLines[index] = updatedLine as DeliveryLineValues;
        setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
    };

    // --------------------------------------------------------
    // Selection Handlers
    // --------------------------------------------------------
    const handleSelectProduct = (index: number, product: ItemListItem) => {
        const currentLines = getValues('lines') || [];
        const newLines = [...currentLines];
        const line = newLines[index];
        if (line) {
            line.item_id = String(product.item_id || product.id || '');
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';

            const productUomId = product.uom_id || product.unit_id || product.sale_uom_id || product.base_uom_id;
            if (productUomId) {
                line.uom_id = String(productUomId);
            } else {
                const foundByName = uoms.find(u =>
                    (u.unit_name && u.unit_name === product.unit_name) ||
                    (u.uom_name && u.uom_name === product.uom_name)
                );
                line.uom_id = foundByName ? String(foundByName.id || foundByName.unit_id) : '';
            }

            line.qty_shipped = 1;
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleSelectSalesOrder = async (
        soId: string,
        soNo: string,
        customerId: string,
        customerName: string,
        branchId: string
    ) => {
        setValue('so_id', soId, { shouldValidate: true, shouldDirty: true });
        setValue('so_no', soNo, { shouldDirty: true });
        if (customerId) setValue('customer_id', customerId, { shouldDirty: true });
        if (customerName) setValue('customer_name', customerName, { shouldDirty: true });
        if (branchId) setValue('branch_id', branchId, { shouldDirty: true });
        logger.debug('[useDeliveryForm] Selected SO:', soNo);

        // 🏠 Auto fetch customer default address
        if (customerId) {
            try {
                const customer = await CustomerService.getById(Number(customerId));
                if (customer) {
                    const addresses: CustomerAddress[] = customer.customerAddresses || customer.addresses || [];
                    const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
                    if (defaultAddr) {
                        const formattedAddress = [
                            defaultAddr.address,
                            defaultAddr.sub_district,
                            defaultAddr.district,
                            defaultAddr.province,
                            defaultAddr.postal_code,
                        ]
                            .filter(Boolean)
                            .join(' ');

                        setValue('ship_to_address', formattedAddress, { shouldDirty: true });
                        logger.debug('[useDeliveryForm] Auto-populated ship_to_address:', formattedAddress);
                    }
                }
            } catch (error) {
                logger.error('[useDeliveryForm] Failed to fetch customer address:', error);
            }
        }

        // Auto fetch lines
        try {
            const detail = await DeliveryService.getPendingDeliveryDetail(soId);
            if (detail && detail.lines && detail.lines.length > 0) {
                setValue('lines', detail.lines as DeliveryLineValues[], {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                logger.debug('[useDeliveryForm] Auto-populated lines from SO:', detail.lines.length);
            }
        } catch (error) {
            logger.error('[useDeliveryForm] Failed to fetch SO pending details:', error);
        }
    };

    return {
        methods,
        lines,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectProduct,
        handleSelectSalesOrder,
    };
}
