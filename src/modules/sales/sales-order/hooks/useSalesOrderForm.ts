import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    SalesOrderFormSchema, 
    type SalesOrderFormValues,
    type SalesOrderLineValues,
    getSalesOrderDefaultValues 
} from '../schemas/sales-order.schemas';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import type { Currency, UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';

interface UseSalesOrderFormProps {
    isOpen: boolean;
    initialData?: Partial<SalesOrderFormValues>;
    currencies: Currency[];
    taxCodes: TaxCode[];
    uoms: UnitListItem[];
}

export function useSalesOrderForm({
    isOpen,
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
    const formData = useWatch({ control }) as SalesOrderFormValues;

    // Guard for initial reset
    const isInitializedRef = useRef(false);

    // Reset form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && !isInitializedRef.current) {
            reset({
                ...getSalesOrderDefaultValues(),
                ...(initialData || {}),
            });
            isInitializedRef.current = true;
        } else if (!isOpen) {
            // Reset initialized flag when modal is closed
            isInitializedRef.current = false;
        }
    }, [isOpen, initialData, reset]);

    // --------------------------------------------------------
    // Currency & Exchange Rate Logic
    // --------------------------------------------------------
    const sourceCurrency = useWatch({ control, name: 'base_currency_code' });
    const targetCurrency = useWatch({ control, name: 'quote_currency_code' });
    const isMulticurrency = useWatch({ control, name: 'isMulticurrency' });

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
        const subTotal = (formData.lines || []).reduce((sum, line) => sum + (line.line_total || 0), 0);
        
        const dInput = formData.discount_input || '';
        let calculatedDiscount = 0;
        if (dInput.endsWith('%')) {
            const percent = parseFloat(dInput.replace('%', '')) || 0;
            calculatedDiscount = subTotal * (percent / 100);
        } else {
            calculatedDiscount = dInput === '' ? 0 : parseFloat(dInput) || 0;
        }

        const selectedTaxCode = taxCodes.find(
            (t) => String(t.tax_code_id) === String(formData.tax_code_id)
        );
        const taxRate = selectedTaxCode ? Number(selectedTaxCode.tax_rate) || 0 : 0;
        const vatAmount = formData.tax_code_id ? (subTotal - calculatedDiscount) * (taxRate / 100) : 0;
        const totalAmount = subTotal + vatAmount - calculatedDiscount;

        return {
            subTotal,
            discountAmount: calculatedDiscount,
            vatAmount,
            totalAmount,
            taxRate,
        };
    }, [formData.lines, formData.discount_input, formData.tax_code_id, taxCodes]);

    // Update form values when totals change
    useEffect(() => {
        const currentVals = getValues();
        
        if (currentVals.sub_total !== totals.subTotal) {
            setValue('sub_total', totals.subTotal, { shouldDirty: false });
        }
        if (currentVals.discount_amount !== totals.discountAmount) {
            setValue('discount_amount', totals.discountAmount, { shouldDirty: false });
        }
        if (currentVals.vat_amount !== totals.vatAmount) {
            setValue('vat_amount', totals.vatAmount, { shouldDirty: false });
        }
        if (currentVals.total_amount !== totals.totalAmount) {
            setValue('total_amount', totals.totalAmount, { shouldDirty: false });
        }
    }, [totals, setValue, getValues]);
    
    // --------------------------------------------------------
    // Tax Propagation Logic
    // --------------------------------------------------------
    const watchHeaderTaxCodeId = useWatch({ control, name: 'tax_code_id' });
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
        setValue('lines', [...(formData.lines || []), newLine]);
    };

    const handleRemoveLine = (index: number) => {
        setValue('lines', (formData.lines || []).filter((_, i) => i !== index));
    };

    const handleLineChange = (
        index: number,
        field: keyof SalesOrderLineValues,
        value: string | number | boolean | undefined
    ) => {
        const newLines = [...(formData.lines || [])];
        const updatedLine = { ...newLines[index], [field]: value };

        // Auto-calculate line total
        if (field === 'qty_ordered' || field === 'unit_price' || field === 'line_discount_input') {
            const qty = Number(field === 'qty_ordered' ? value : updatedLine.qty_ordered) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;

            const ldInput =
                (field === 'line_discount_input' ? (value as string) : updatedLine.line_discount_input) ||
                '';
            let calculatedLD = 0;
            if (ldInput.endsWith('%')) {
                const percent = parseFloat(ldInput.replace('%', '')) || 0;
                calculatedLD = qty * price * (percent / 100);
            } else {
                calculatedLD = parseFloat(ldInput) || 0;
            }

            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = qty * price - calculatedLD;
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
        const newLines = [...(formData.lines || [])];
        const line = newLines[index];
        if (line) {
            line.item_id = String(product.item_id || product.id || '');
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            const productUomId = product.uom_id || product.unit_id;
            const foundUom = uoms.find(
                (u) => String(u.id || u.unit_id) === String(productUomId)
            );
            line.uom_id = foundUom ? String(foundUom.id || foundUom.unit_id) : '';
            line.unit_price = Number(product.standard_cost || 0);
            line.qty_ordered = 1;
            line.line_total = line.unit_price;
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
        }
    };

    return {
        methods,
        formData,
        totals,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
    };
}
