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
import type { UOMListItem } from '@master-data/types/master-data-types';
import { DeliveryService } from '../services/delivery.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import type { CustomerAddress } from '@customer/customer-master/types/customer-types';
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';

interface UseDeliveryFormProps {
    isOpen: boolean;
    id?: string;
    initialData?: Partial<DeliveryFormValues>;
    uoms: UOMListItem[];
    onClose: () => void;
    readOnly?: boolean;
}

export function useDeliveryForm({ isOpen, id, initialData, uoms, onClose, readOnly = false }: UseDeliveryFormProps) {
    const methods = useForm<DeliveryFormValues>({
        resolver: zodResolver(DeliveryFormSchema) as Resolver<DeliveryFormValues>,
        defaultValues: {
            ...getDeliveryDefaultValues(),
            ...(initialData || {}),
        } as DeliveryFormValues,
        mode: 'onBlur',
    });

    const { setValue, control, reset, getValues, formState: { isDirty } } = methods;

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !readOnly,
        enabled: isOpen,
        onSafeClose: onClose
    });

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

        // Only reset if not initialized
        // If we have an ID (Edit mode), wait for initialData to be loaded
        // If we don't have an ID (Create mode), we can initialize immediately
        const shouldInitialize = !isInitializedRef.current && (!id || (id && initialData));

        if (shouldInitialize) {
            reset({
                ...getDeliveryDefaultValues(),
                ...(initialData || {}),
            } as DeliveryFormValues);
            isInitializedRef.current = true;
            logger.debug('[useDeliveryForm] Form initialized:', id || 'new');
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
        
        if (field === 'uom_id') {
            if (updatedLine.item_id && value) {
                UOMConversionService.getByItemId(Number(updatedLine.item_id)).then(response => {
                    const convs = response?.items || [];
                    const matchedConv = convs.find(c => Number(c.from_unit_id) === Number(value)) ||
                                       convs.find(c => Number(c.conversion_factor) === 1);
                    if (matchedConv) {
                        setValue(`lines.${index}.item_uom_id` as never, Number(matchedConv.conversion_id) as never, { shouldDirty: true });
                    }
                }).catch(() => {});
            }
        }

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

            const productUomId = product.uom_id || product.uom_id || product.sale_uom_id || product.base_uom_id;
            if (productUomId) {
                line.uom_id = String(productUomId);
            } else {
                const foundByName = uoms.find(u =>
                    (u.uom_name && u.uom_name === product.uom_name) ||
                    (u.uom_name && u.uom_name === product.uom_name)
                );
                line.uom_id = foundByName ? String(foundByName.id || foundByName.uom_id) : '';
            }

            // Resolve item_uom_id conversion PK
            if (line.item_id && line.uom_id) {
                UOMConversionService.getByItemId(Number(line.item_id)).then(response => {
                    const convs = response?.items || [];
                    const matchedConv = convs.find(c => Number(c.from_unit_id) === Number(line.uom_id)) ||
                                       convs.find(c => Number(c.conversion_factor) === 1);
                    if (matchedConv) {
                        setValue(`lines.${index}.item_uom_id` as never, Number(matchedConv.conversion_id) as never, { shouldDirty: true });
                    }
                }).catch(() => {});
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

    const handleSelectEmployee = (emp: import('@master-data/company/types/employee-types').IEmployee) => {
        const empId = String(emp.id || '');
        const empName = `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim();
        
        
        setValue('ship_by_emp', empId, { shouldValidate: true, shouldDirty: true });
        setValue('ship_by_emp_name', empName, { shouldValidate: true, shouldDirty: true });
    };

    return {
        methods,
        lines,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectProduct,
        handleSelectSalesOrder,
        handleSelectEmployee,
        onClose: handleCloseAttempt,
        blocker
    };
}
