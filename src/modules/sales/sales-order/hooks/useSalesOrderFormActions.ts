import { useCallback } from 'react';
import type { UseFormSetValue, UseFormGetValues, Path } from 'react-hook-form';
import type { SalesOrderFormValues, SalesOrderLineValues } from '../schemas/sales-order.schemas';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem } from '@inventory/types/product-types';
import type { UnitListItem } from '@master-data/types/master-data-types';
import type { ReservationHeader } from '@sales/reservation/services/reservation.service';
import { ReservationService } from '@sales/reservation/services/reservation.service';
import { OrgEmployeeService } from '@master-data/company/services/employee.service';
import { calculateDiscountAmount, calculateLineTotal } from '@sales/shared/utils/sales-calculations';
import { logger } from '@/shared/utils';

interface UseSalesOrderFormActionsProps {
    setValue: UseFormSetValue<SalesOrderFormValues>;
    getValues: UseFormGetValues<SalesOrderFormValues>;
    uoms: UnitListItem[];
    tax_code_id?: number;
    recoverPriceSources: (lines: SalesOrderLineValues[], customerId: number, branchId: number) => Promise<void>;
}

export function useSalesOrderFormActions({
    setValue,
    getValues,
    uoms,
    tax_code_id,
    recoverPriceSources
}: UseSalesOrderFormActionsProps) {
    
    const handleAddLine = useCallback(() => {
        const newLine: SalesOrderLineValues = {
            item_id: '',
            item_code: '',
            item_name: '',
            qty_ordered: 0,
            warehouse_id: '',
            location_id: '',
            uom_id: '',
            unit_price: 0,
            lot_no: '',
            line_discount_input: '',
            line_discount: 0,
            line_total: 0,
            note: '',
            tax_code_id: tax_code_id || undefined,
        };
        const currentLines = getValues('lines') || [];
        setValue('lines', [...currentLines, newLine], { shouldDirty: true });
    }, [getValues, setValue, tax_code_id]);

    const handleRemoveLine = useCallback((index: number) => {
        const currentLines = getValues('lines') || [];
        setValue('lines', currentLines.filter((_, i) => i !== index), { shouldDirty: true });
    }, [getValues, setValue]);

    const handleLinePriceSync = useCallback(async (index: number) => {
        const line = getValues(`lines.${index}`);
        const customerId = Number(getValues('customer_id') || 0);
        const branchId = Number(getValues('branch_id') || 0);

        if (!line?.item_id || !customerId || !branchId) return;

        try {
            const { PricingService } = await import('@sales/quotation/services/pricing.service');
            const result = await PricingService.calculatePrice({
                itemId: Number(line.item_id),
                qty: Number(line.qty_ordered) || 1,
                customerId,
                branchId
            });

            if (result) {
                const currentPrice = Number(line.unit_price || 0);
                const enginePrice = Number(result.unitPrice);
                const priceDiff = Math.abs(currentPrice - enginePrice);

                if (currentPrice === 0 || priceDiff < 0.01) {
                    setValue(`lines.${index}.unit_price`, enginePrice, { shouldValidate: true });
                    setValue(`lines.${index}.price_source`, result.source, { shouldValidate: true });
                    setValue(`lines.${index}.price_source_name`, result.sourceName, { shouldValidate: true });
                    setValue(`lines.${index}.price_level_priority`, result.priority, { shouldValidate: true });
                    
                    const qty = Number(line.qty_ordered) || 0;
                    const discExpr = line.line_discount_input || '';
                    const calcDisc = calculateDiscountAmount(qty * enginePrice, discExpr);
                    setValue(`lines.${index}.line_discount`, calcDisc);
                    setValue(`lines.${index}.line_total`, calculateLineTotal(qty, enginePrice, calcDisc));
                } else {
                    setValue(`lines.${index}.price_source`, 3);
                    setValue(`lines.${index}.price_source_name`, 'MANUAL');
                }
            }
        } catch (err) {
            logger.warn('[handleLinePriceSync] Failed:', err);
        }
    }, [getValues, setValue]);

    const handleLineChange = useCallback((
        index: number,
        field: keyof SalesOrderLineValues,
        value: unknown
    ) => {
        const currentLine = getValues(`lines.${index}`);
        if (!currentLine) return;
        
        const updatedLine = { ...currentLine, [field]: value };

        if (field === 'qty_ordered' || field === 'unit_price' || field === 'line_discount_input') {
            const qty = Number(field === 'qty_ordered' ? value : updatedLine.qty_ordered) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            const ldInput = (field === 'line_discount_input' ? (value as string) : updatedLine.line_discount_input) || '';
            
            const calculatedLD = calculateDiscountAmount(qty * price, ldInput);
            const calculatedTotal = calculateLineTotal(qty, price, calculatedLD);
            
            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = calculatedTotal;
        }

        setValue(`lines.${index}` as Path<SalesOrderFormValues>, updatedLine as never, { 
            shouldValidate: true, 
            shouldDirty: true 
        });

        if (field === 'unit_price') {
            setValue(`lines.${index}.price_source` as Path<SalesOrderFormValues>, 3 as never);
            setValue(`lines.${index}.price_source_name` as Path<SalesOrderFormValues>, 'MANUAL' as never);
        }
    }, [getValues, setValue]);

    const handleSelectCustomer = useCallback((customer: CustomerMaster) => {
        setValue('customer_id', String(customer.customer_id || customer.id || ''), { shouldValidate: true, shouldDirty: true });
        if (customer.credit_term_days || customer.credit_days) {
            setValue('payment_term_days', Number(customer.credit_term_days || customer.credit_days || 0));
        }
    }, [setValue]);

    const handleSelectProduct = useCallback((index: number, product: ItemListItem) => {
        const currentLines = getValues('lines') || [];
        const newLines = [...currentLines];
        const line = newLines[index];
        if (line) {
            line.item_id = String(product.item_id || product.id || '');
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            const productUomId = product.uom_id || product.unit_id || product.sale_uom_id || product.base_uom_id || product.sales_unit_id;
            
            if (productUomId) {
                line.uom_id = String(productUomId);
            } else {
                const foundByName = uoms.find(u => 
                    (u.unit_name && u.unit_name === product.unit_name) || 
                    (u.uom_name && u.uom_name === product.uom_name)
                );
                line.uom_id = foundByName ? String(foundByName.id || foundByName.unit_id) : '';
            }

            line.unit_price = Number(product.standard_cost || product.price || 0);
            line.qty_ordered = 1;
            line.line_total = line.unit_price;
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            handleLinePriceSync(index);
        }
    }, [getValues, setValue, uoms, handleLinePriceSync]);

    const handleSelectReservation = useCallback(async (reservation: ReservationHeader) => {
        setValue('reservation_id', String(reservation.reservation_id), { shouldValidate: true, shouldDirty: true });
        setValue('reservation_no', String(reservation.reservation_no || ''), { shouldValidate: true, shouldDirty: true });
        if (reservation.customer_id) {
            setValue('customer_id', String(reservation.customer_id), { shouldValidate: true, shouldDirty: true });
        }

        try {
            const rsData = await ReservationService.getById(String(reservation.reservation_id));
            if (rsData) {
                const rs = rsData as Record<string, unknown>;
                const headerMap: Record<string, keyof SalesOrderFormValues> = {
                    customer_id: 'customer_id',
                    branch_id: 'branch_id',
                    emp_dept_id: 'emp_dept_id',
                    emp_sale_id: 'emp_sale_id',
                    emp_sale_name: 'emp_sale_name',
                    job_id: 'job_id',
                    tax_code_id: 'tax_code_id',
                    payment_term_days: 'payment_term_days',
                    ship_days: 'ship_days',
                    remarks: 'remarks',
                    discount_input: 'discount_input',
                    currency_code: 'currency_code'
                };

                Object.entries(headerMap).forEach(([rsKey, soKey]) => {
                    const val = rs[rsKey];
                    if (val !== undefined && val !== null && val !== '') {
                        if (['tax_code_id', 'payment_term_days', 'ship_days'].includes(soKey)) {
                            setValue(soKey as never, Number(val) as never, { shouldValidate: true, shouldDirty: true });
                        } else {
                            setValue(soKey as never, String(val) as never, { shouldValidate: true, shouldDirty: true });
                        }
                    }
                });

                const areaId = rs.sale_area_id || rs.emp_area_id || rs.area_id;
                if (areaId) setValue('emp_area_id', String(areaId), { shouldValidate: true, shouldDirty: true });

                if (rsData.isMulticurrency) {
                    setValue('isMulticurrency', true, { shouldDirty: true });
                    if (rsData.base_currency_code) setValue('base_currency_code', rsData.base_currency_code, { shouldDirty: true });
                    if (rsData.quote_currency_code) setValue('quote_currency_code', rsData.quote_currency_code, { shouldDirty: true });
                    if (rsData.exchange_rate) setValue('exchange_rate', Number(rsData.exchange_rate), { shouldDirty: true });
                    if (rsData.exchange_rate_date) setValue('exchange_rate_date', rsData.exchange_rate_date, { shouldDirty: true });
                }

                if (rsData.emp_sale_id && !rs.emp_sale_name) {
                    try {
                        const empRes = await OrgEmployeeService.get(Number(rsData.emp_sale_id));
                        const emp = (empRes as { data?: unknown })?.data || empRes;
                        if (emp && typeof emp === 'object') {
                            const e = emp as Record<string, unknown>;
                            const empName = String(e.employee_fullname || e.employee_name || `${e.first_name || ''} ${e.last_name || ''}`.trim());
                            if (empName) setValue('emp_sale_name', empName, { shouldDirty: true });
                        }
                    } catch { /* ignore */ }
                }

                if (rsData.lines) {
                    const mappedLines: SalesOrderLineValues[] = rsData.lines.map((line) => ({
                        item_id: String(line.item_id || ''),
                        item_code: line.item_code || '',
                        item_name: line.item_name || '',
                        qty_ordered: Number(line.qty_reserved || 0),
                        warehouse_id: String(line.warehouse_id || ''),
                        location_id: String(line.location_id || ''),
                        uom_id: String(line.uom_id || ''),
                        unit_price: Number(line.unit_price || 0),
                        lot_id: line.lot_id ? String(line.lot_id) : undefined,
                        lot_no: line.lot_no || '',
                        line_discount_input: line.line_discount_input || '',
                        line_discount: Number(line.line_discount || 0),
                        line_total: Number(line.line_total || 0),
                        note: line.note || '',
                        tax_code_id: Number(rsData.tax_code_id || getValues('tax_code_id') || 0),
                        reservation_line_id: Number(line.id || 0),
                        price_source: line.price_source !== undefined ? Number(line.price_source) : undefined,
                        price_source_name: String(line.price_source_name || ''),
                        price_level_priority: line.price_level_priority !== undefined ? Number(line.price_level_priority) : undefined,
                    }));
                    
                    setValue('lines', mappedLines, { shouldValidate: true, shouldDirty: true });
                    if (rsData.customer_id && rsData.branch_id) {
                        void recoverPriceSources(mappedLines, Number(rsData.customer_id), Number(rsData.branch_id));
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to fetch reservation details:', error);
        }
    }, [setValue, getValues, recoverPriceSources]);

    return {
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleLinePriceSync,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectReservation
    };
}
