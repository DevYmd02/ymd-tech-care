import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    SalesOrderFormSchema, 
    type SalesOrderFormValues,
    type SalesOrderLineValues,
    getSalesOrderDefaultValues 
} from '../schemas/sales-order.schemas';
import { logger } from '@/shared/utils';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem } from '@inventory/types/product-types';
import type { Currency, UnitListItem } from '@master-data/types/master-data-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';
import { ReservationService, type ReservationHeader } from '@sales/reservation/services/reservation.service';
import { OrgEmployeeService } from '@master-data/company/services/employee.service';
import { 
    calculateDiscountAmount, 
    calculateVatAmount, 
    calculateNetTotal, 
    calculateLineTotal 
} from '@sales/shared/utils/sales-calculations';

interface UseSalesOrderFormProps {
    isOpen: boolean;
    id?: string;
    initialData?: Partial<SalesOrderFormValues>;
    currencies: Currency[];
    taxCodes: TaxCode[];
    uoms: UnitListItem[];
}

export function useSalesOrderForm({
    isOpen,
    id,
    initialData,
    currencies,
    taxCodes,
    uoms,
}: UseSalesOrderFormProps) {
    const methods = useForm<SalesOrderFormValues>({
        resolver: zodResolver(SalesOrderFormSchema) as Resolver<SalesOrderFormValues>,
        defaultValues: {
            ...getSalesOrderDefaultValues(),
            ...(initialData || {}),
        } as SalesOrderFormValues,
        mode: 'onBlur',
    });

    const { setValue, control, reset, getValues } = methods;
    
    // 💡 Performance Optimization:
    // We use selective watches for calculation.
    const discount_input = useWatch({ control, name: 'discount_input' }) || '0';
    const tax_code_id = useWatch({ control, name: 'tax_code_id' });
    const isMulticurrency = useWatch({ control, name: 'isMulticurrency' });
    const base_currency_code = useWatch({ control, name: 'base_currency_code' });
    const quote_currency_code = useWatch({ control, name: 'quote_currency_code' });
    const status = useWatch({ control, name: 'status' });
    const discount_amount_watched = useWatch({ control, name: 'discount_amount' });

    // 🎯 Watch only fields that affect totals
    // We use a memoized array of names to avoid re-subscribing on every render
    const lineCount = (getValues('lines') || []).length;
    const lineTotalNames = useMemo(() => 
        Array.from({ length: lineCount }, (_, i) => `lines.${i}.line_total`),
    [lineCount]);

    const watchedLineTotals = useWatch({ 
        control, 
        name: lineTotalNames as Path<SalesOrderFormValues>[]
    }) as (string | number | undefined)[];

    // Guard for initial reset
    const isInitializedRef = useRef(false);

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (!isOpen) {
            isInitializedRef.current = false;
            return;
        }

        const isEditing = !!id;
        const hasData = initialData && Object.keys(initialData).length > 0;

        // Reset if not initialized AND (not editing OR data has arrived)
        if (!isInitializedRef.current) {
            if (!isEditing || hasData) {
                reset({
                    ...getSalesOrderDefaultValues(),
                    ...(initialData || {}),
                });
                isInitializedRef.current = true;
            }
        }
    }, [isOpen, initialData, reset, id]);

    // --------------------------------------------------------
    // Currency & Exchange Rate Logic
    // --------------------------------------------------------
    const sourceCurrency = base_currency_code;
    const targetCurrency = quote_currency_code;

    useEffect(() => {
        if (!sourceCurrency || !isMulticurrency) return;
        if (sourceCurrency === 'THB' || sourceCurrency === targetCurrency) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            return;
        }
        const sourceObj = currencies?.find((c) => c.currency_code === sourceCurrency);
        const targetObj = currencies?.find((c) => c.currency_code === targetCurrency);
        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || 1;
        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulticurrency]);

    // --------------------------------------------------------
    // Totals Calculation
    // --------------------------------------------------------
    const totals = useMemo(() => {
        const isExisting = !!id;
        const currentLines = getValues('lines') || [];
        const hasLines = currentLines.length > 0;

        // 🛑 Fix Loop: Use initialData (stable) for fallback
        if (isExisting && !hasLines && initialData) {
            return {
                subTotal: Number((initialData as Record<string, unknown>).sub_total || 0),
                discountAmount: Number((initialData as Record<string, unknown>).discount_amount || 0),
                vatAmount: Number((initialData as Record<string, unknown>).vat_amount || 0),
                totalAmount: Number((initialData as Record<string, unknown>).total_amount || 0),
                taxRate: 0, 
                isStatic: true 
            };
        }

        const subTotal = (watchedLineTotals || []).reduce((sum: number, val: number | string | undefined | null) => sum + (Number(val) || 0), 0);
        
        const calculatedDiscount = calculateDiscountAmount(subTotal, discount_input);

        const selectedTaxCode = taxCodes.find(
            (t) => String(t.tax_code_id) === String(tax_code_id)
        );
        const taxRate = selectedTaxCode ? Number(selectedTaxCode.tax_rate) || 0 : 0;
        const vatAmount = calculateVatAmount(subTotal - calculatedDiscount, taxRate);
        const totalAmount = calculateNetTotal(subTotal, calculatedDiscount, vatAmount);

        return {
            subTotal,
            discountAmount: calculatedDiscount,
            vatAmount,
            totalAmount,
            taxRate,
            isStatic: false
        };
    }, [watchedLineTotals, discount_input, tax_code_id, taxCodes, id, initialData, getValues]);

    // Update form values when totals change (ONLY if calculated from lines)
    useEffect(() => {
        if (totals.isStatic) return;

        const currentVals = getValues();
        
        if (Number(currentVals.sub_total) !== totals.subTotal) {
            setValue('sub_total', totals.subTotal, { shouldDirty: false });
        }
        if (Number(currentVals.discount_amount) !== totals.discountAmount) {
            setValue('discount_amount', totals.discountAmount, { shouldDirty: false });
        }
        if (Number(currentVals.vat_amount) !== totals.vatAmount) {
            setValue('vat_amount', totals.vatAmount, { shouldDirty: false });
        }
        if (Number(currentVals.total_amount) !== totals.totalAmount) {
            setValue('total_amount', totals.totalAmount, { shouldDirty: false });
        }
    }, [totals, setValue, getValues]);
    
    // --------------------------------------------------------
    // Tax Propagation Logic
    // --------------------------------------------------------
    const watchHeaderTaxCodeId = tax_code_id;
    useEffect(() => {
        if (watchHeaderTaxCodeId !== undefined) {
             const currentLines = getValues('lines') || [];
             const needsUpdate = currentLines.some(l => Number(l.tax_code_id) !== Number(watchHeaderTaxCodeId));
             if (needsUpdate) {
                 const updatedLines = currentLines.map(l => ({
                     ...l,
                     tax_code_id: watchHeaderTaxCodeId
                 }));
                 setValue('lines', updatedLines as SalesOrderLineValues[], { shouldDirty: true });
             }
        }
    }, [watchHeaderTaxCodeId, setValue, getValues]);

    // --------------------------------------------------------
    // Line Item Actions
    // --------------------------------------------------------
    const handleAddLine = () => {
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
            tax_code_id: watchHeaderTaxCodeId || undefined,
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
        field: keyof SalesOrderLineValues,
        value: string | number | boolean | undefined
    ) => {
        const currentLines = getValues('lines') || [];
        const newLines = [...currentLines];
        const updatedLine = { ...newLines[index], [field]: value };

        // Auto-calculate line total
        if (field === 'qty_ordered' || field === 'unit_price' || field === 'line_discount_input') {
            const qty = Number(field === 'qty_ordered' ? value : updatedLine.qty_ordered) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            const ldInput = (field === 'line_discount_input' ? (value as string) : updatedLine.line_discount_input) || '';
            
            const calculatedLD = calculateDiscountAmount(qty * price, ldInput);
            
            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = calculateLineTotal(qty, price, calculatedLD);
        }

        newLines[index] = updatedLine as SalesOrderLineValues;
        setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
    };

    // --------------------------------------------------------
    // Selection Handlers
    // --------------------------------------------------------
    const handleSelectCustomer = (customer: CustomerMaster) => {
        setValue('customer_id', String(customer.customer_id || customer.id || ''), { shouldValidate: true, shouldDirty: true });
        // Optionally auto-set payment terms or tax groups from customer data if available
        if (customer.credit_term_days || customer.credit_days) {
            setValue('payment_term_days', Number(customer.credit_term_days || customer.credit_days || 0));
        }
    };

    const handleSelectProduct = (index: number, product: ItemListItem) => {
        const currentLines = getValues('lines') || [];
        const newLines = [...currentLines];
        const line = newLines[index];
        if (line) {
            line.item_id = String(product.item_id || product.id || '');
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            // 💡 Robust UOM Mapping: Try all possible ID fields
            const productUomId = product.uom_id || product.unit_id || product.sale_uom_id || product.base_uom_id || product.sales_unit_id;
            
            if (productUomId) {
                line.uom_id = String(productUomId);
            } else {
                // Fallback: search in uoms list by name if ID is missing
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
        }
    };

    const handleSelectReservation = async (reservation: ReservationHeader) => {
        setValue('reservation_id', String(reservation.reservation_id), { shouldValidate: true, shouldDirty: true });
        setValue('reservation_no', String(reservation.reservation_no || ''), { shouldValidate: true, shouldDirty: true });
        if (reservation.customer_id) {
            setValue('customer_id', String(reservation.customer_id), { shouldValidate: true, shouldDirty: true });
        }

        try {
            const rsData = await ReservationService.getById(String(reservation.reservation_id));
            if (rsData) {
                // Populate Header Fields (Robust Mapping)
                const headerMap: Record<string, keyof SalesOrderFormValues> = {
                    customer_id: 'customer_id',
                    branch_id: 'branch_id',
                    emp_dept_id: 'emp_dept_id',
                    emp_sale_id: 'emp_sale_id',
                    emp_sale_name: 'emp_sale_name',
                    sale_area_id: 'emp_area_id',
                    job_id: 'job_id',
                    tax_code_id: 'tax_code_id',
                    payment_term_days: 'payment_term_days',
                    ship_days: 'ship_days',
                    remarks: 'remarks',
                    discount_input: 'discount_input',
                    currency_code: 'currency_code'
                };

                const rs = rsData as Record<string, unknown>;
                Object.entries(headerMap).forEach(([rsKey, soKey]) => {
                    const val = rs[rsKey];
                    if (val !== undefined && val !== null && val !== '') {
                        if (['tax_code_id', 'payment_term_days', 'ship_days', 'exchange_rate'].includes(soKey)) {
                            setValue(soKey as keyof SalesOrderFormValues, Number(val) as never, { shouldValidate: true, shouldDirty: true });
                        } else {
                            setValue(soKey as keyof SalesOrderFormValues, String(val) as never, { shouldValidate: true, shouldDirty: true });
                        }
                    }
                });
                
                // Multicurrency Mapping
                if (rsData.isMulticurrency !== undefined) {
                    setValue('isMulticurrency', !!rsData.isMulticurrency, { shouldDirty: true });
                    if (rsData.isMulticurrency) {
                        if (rsData.base_currency_code) setValue('base_currency_code', rsData.base_currency_code, { shouldDirty: true });
                        if (rsData.quote_currency_code) setValue('quote_currency_code', rsData.quote_currency_code, { shouldDirty: true });
                        if (rsData.exchange_rate) setValue('exchange_rate', Number(rsData.exchange_rate), { shouldDirty: true });
                        if (rsData.exchange_rate_date) setValue('exchange_rate_date', rsData.exchange_rate_date, { shouldDirty: true });
                    }
                }

                // Special Case: If emp_sale_id is present but emp_sale_name is missing, try to fetch it
                const empId = rsData.emp_sale_id || rs.emp_id;
                let empName = String(rs.emp_sale_name || rs.emp_name || '');
                
                if (empId && !empName) {
                    try {
                        const empRes = await OrgEmployeeService.get(Number(empId));
                        // Handle potential API wrapper { data: ... } or direct response
                        const emp = (empRes as unknown as Record<string, unknown>)?.data as Record<string, unknown> || empRes;
                        if (emp) {
                            empName = String(emp.employee_fullname || emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim());
                            if (empName) setValue('emp_sale_name', empName, { shouldDirty: true });
                        }
                    } catch { /* ignore */ }
                }

                // Populate Lines (Override existing lines)
                if (rsData.lines && rsData.lines.length > 0) {
                    const mappedLines: SalesOrderLineValues[] = rsData.lines.map((line) => ({
                        item_id: String(line.item_id || ''),
                        item_code: line.item_code || '',
                        item_name: line.item_name || '',
                        qty_ordered: Number(line.qty_reserved || 0),
                        warehouse_id: String(line.warehouse_id || ''),
                        location_id: String(line.location_id || ''),
                        uom_id: String(line.uom_id || ''),
                        unit_price: Number(line.unit_price || 0),
                        lot_no: line.lot_no || '',
                        line_discount_input: line.line_discount_input || '',
                        line_discount: Number(line.line_discount || 0),
                        line_total: Number(line.line_total || 0),
                        note: line.note || '',
                        tax_code_id: Number(rsData.tax_code_id || getValues('tax_code_id') || 0),
                        reservation_line_id: Number(line.id || 0),
                    }));
                    
                    setValue('lines', mappedLines, { shouldValidate: true, shouldDirty: true });
                }
            }
        } catch (error) {
            logger.error('Failed to fetch reservation details:', error);
        }
    };

    return {
        methods,
        discount_input,
        discount_amount: discount_amount_watched,
        tax_code_id,
        isMulticurrency,
        base_currency_code,
        status,
        totals,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectReservation,
    };
}
