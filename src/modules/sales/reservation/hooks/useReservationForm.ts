import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '@/modules/master-data';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';
import { SaleAreaService } from '@/modules/master-data/sales/pages/area/services/area.service';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { ItemListItem, UnitListItem } from '@/modules/master-data/inventory/types/product-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { LotNo } from '@/modules/master-data/inventory/types/inventory-master.types';
import type { EstimateHeader } from '@/modules/sales/estimate/services/estimate.service';
import { 
    ReservationFormSchema, 
    type ReservationFormValues, 
    type ReservationLineValues, 
    getReservationDefaultValues 
} from '../schemas/reservation-schemas';

export const useReservationForm = (isOpen: boolean, id?: string, initialData?: Partial<ReservationFormValues>) => {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search Modals State
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [isLeadSearchOpen, setIsLeadSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [activeLotLineIndex, setActiveLotLineIndex] = useState<number | null>(null);
    
    // React Hook Form Setup
    const methods = useForm<ReservationFormValues>({
        resolver: zodResolver(ReservationFormSchema) as Resolver<ReservationFormValues>,
        defaultValues: initialData ? { ...getReservationDefaultValues(), ...initialData } : getReservationDefaultValues(),
        mode: 'onBlur',
    });

    const { setValue, reset, control, getValues, handleSubmit } = methods;
    const formData = useWatch({ control }) as ReservationFormValues;

    // Initialization Guard
    const lastInitializedId = useRef<string | null | 'new'>(null);
    const defaultValues = useMemo(() => getReservationDefaultValues(), []);

    useEffect(() => {
        const currentTarget = id || 'new';
        if (isOpen && lastInitializedId.current !== currentTarget) {
            reset(initialData ? { ...defaultValues, ...initialData } : defaultValues);
            lastInitializedId.current = currentTarget;
        } else if (!isOpen) {
            lastInitializedId.current = null;
        }
    }, [isOpen, initialData, reset, defaultValues, id]);

    // Data Fetching
    const { data: branches = [] } = useQuery({
        queryKey: ['master-branches'],
        queryFn: MasterDataService.getBranches,
        enabled: isOpen
    });

    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen
    });

    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 100 }),
        enabled: isOpen
    });
    const customers = customerResponse?.data || [];

    const { data: taxCodes = [] } = useQuery<TaxCode[]>({
        queryKey: ['master-tax-codes'],
        queryFn: TaxCodeService.getTaxCodes,
        enabled: isOpen
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['master-departments'],
        queryFn: MasterDataService.getDepartments,
        enabled: isOpen
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['master-projects'],
        queryFn: MasterDataService.getProjects,
        enabled: isOpen
    });

    const { data: itemTypes = [] } = useQuery({
        queryKey: ['master-item-types'],
        queryFn: MasterDataService.getItemTypes,
        enabled: isOpen
    });

    const { data: saleAreas = [] } = useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => SaleAreaService.getList(),
        enabled: isOpen
    });

    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const uoms = useMemo(() => uomResponse?.items || [], [uomResponse]);

    const { data: warehouseResponse } = useQuery({
        queryKey: ['master-warehouses'],
        queryFn: () => WarehouseService.getAll(),
        enabled: isOpen
    });
    const warehouses = warehouseResponse?.items || [];

    const { data: locationResponse } = useQuery({
        queryKey: ['master-locations'],
        queryFn: () => LocationService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const locations = locationResponse?.items || [];

    // Exchange Rate Sync Logic
    const isMulti = useWatch({ control, name: 'isMulticurrency' });
    const sourceCurrency = useWatch({ control, name: 'base_currency_code' });
    const targetCurrency = useWatch({ control, name: 'quote_currency_code' });

    useEffect(() => {
        if (!sourceCurrency || !isMulti) return;
        
        if (sourceCurrency === 'THB' || sourceCurrency === targetCurrency) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            return;
        }

        const sourceObj = currencies?.find((c: Currency) => c.currency_code === sourceCurrency);
        const targetObj = currencies?.find((c: Currency) => c.currency_code === targetCurrency);

        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || (targetCurrency === 'THB' ? 1 : 1);

        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulti]);

    // Header Totals Logic
    const watchedLines = useWatch({ control, name: 'lines' });
    const lines = useMemo(() => watchedLines || [], [watchedLines]);
    const watchedDiscountInput = useWatch({ control, name: 'discount_input' });
    const discountInput = watchedDiscountInput || '';
    const taxCodeId = useWatch({ control, name: 'tax_code_id' });

    useEffect(() => {
        const calculatedSubTotal = lines.reduce((sum, line) => sum + (line.line_total || 0), 0);
        if (getValues('sub_total') !== calculatedSubTotal) {
            setValue('sub_total', calculatedSubTotal);
        }

        let calculatedDiscount = 0;
        if (discountInput.endsWith('%')) {
            const percent = parseFloat(discountInput.replace('%', '')) || 0;
            calculatedDiscount = calculatedSubTotal * (percent / 100);
        } else {
            calculatedDiscount = parseFloat(discountInput) || 0;
        }
        if (getValues('discount_amount') !== calculatedDiscount) {
            setValue('discount_amount', calculatedDiscount);
        }

        const selectedTaxCode = taxCodes.find(t => String(t.tax_code_id) === String(taxCodeId));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        const vatAmountValue = taxCodeId ? (calculatedSubTotal * (taxRate / 100)) : 0;
        if (getValues('vat_amount') !== vatAmountValue) {
            setValue('vat_amount', vatAmountValue);
        }

        const totalAmountValue = (calculatedSubTotal + vatAmountValue) - calculatedDiscount;
        if (getValues('total_amount') !== totalAmountValue) {
            setValue('total_amount', totalAmountValue);
        }
    }, [lines, discountInput, taxCodeId, taxCodes, setValue, getValues]);
    
    // --------------------------------------------------------
    // Tax Propagation Logic
    // --------------------------------------------------------
    useEffect(() => {
        if (taxCodeId !== undefined) {
             const currentLines = getValues('lines') || [];
             const needsUpdate = currentLines.some(l => Number(l.tax_code_id) !== Number(taxCodeId));
             if (needsUpdate) {
                 const updatedLines = currentLines.map(l => ({
                     ...l,
                     tax_code_id: taxCodeId
                 }));
                 setValue('lines', updatedLines as ReservationLineValues[], { shouldDirty: true });
             }
        }
    }, [taxCodeId, setValue, getValues]);

    // Event Handlers
    const handleAddLine = useCallback(() => {
        const newLine: ReservationLineValues = { 
            item_id: '', 
            item_code: '', 
            item_name: '', 
            qty_reserved: 0, 
            warehouse_id: '',
            location_id: '',
            uom_id: 'PCS', 
            unit_price: 0, 
            lot_no: '',
            line_discount_input: '',
            line_discount: 0, 
            reserve_policy: 'AUTO',
            line_total: 0, 
            note: '',
            tax_code_id: taxCodeId || undefined,
        };
        setValue('lines', [...(getValues('lines') || []), newLine]);
    }, [setValue, getValues, taxCodeId]);

    const handleRemoveLine = useCallback((index: number) => {
        setValue('lines', (getValues('lines') || []).filter((_, i) => i !== index));
    }, [setValue, getValues]);

    const handleLineChange = useCallback((index: number, field: keyof ReservationLineValues, value: string | number) => {
        const currentLines = getValues('lines') || [];
        if (!currentLines[index]) return;

        const newLines = [...currentLines];
        const updatedLine = { ...newLines[index], [field]: value };
        
        if (field === 'qty_reserved' || field === 'unit_price' || field === 'line_discount_input') {
            const qty = Number(field === 'qty_reserved' ? value : updatedLine.qty_reserved) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            
            const ldInput = (field === 'line_discount_input' ? (value as string) : updatedLine.line_discount_input) || '';
            let calculatedLD = 0;
            if (ldInput.endsWith('%')) {
                const percent = parseFloat(ldInput.replace('%', '')) || 0;
                calculatedLD = (qty * price) * (percent / 100);
            } else {
                calculatedLD = parseFloat(ldInput) || 0;
            }
            
            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = (qty * price) - calculatedLD;
        }
        
        newLines[index] = updatedLine;
        setValue('lines', newLines, { shouldValidate: true });
    }, [setValue, getValues]);

    const handleSelectCustomer = useCallback((customer: CustomerMaster) => {
        setValue('customer_id', String(customer.customer_id || customer.id || ''));
        setIsCustomerSearchOpen(false);
    }, [setValue]);

    const handleSelectLead = useCallback((estimate: EstimateHeader) => {
        setValue('lead_id', estimate.estimate_no || '');
        setIsLeadSearchOpen(false);
    }, [setValue]);

    const handleSelectProduct = useCallback((product: ItemListItem) => {
        if (activeLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeLineIndex]) return;

            const newLines = [...currentLines];
            const line = newLines[activeLineIndex];
            
            line.item_id = String(product.item_id || product.id || '');
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            const productUomId = product.uom_id || product.unit_id;
            const productUomName = product.uom_name || product.base_uom_name || product.unit_name;
            const foundUom = uoms.find((u: UnitListItem) => 
                (productUomId && (u.id === productUomId || u.unit_id === productUomId)) ||
                (productUomName && (u.unit_name === productUomName || u.uom_name === productUomName))
            );

            line.uom_id = foundUom ? String(foundUom.id || foundUom.unit_id) : String(productUomId || productUomName || 'PCS');
            line.unit_price = Number(product.standard_cost || 0);
            line.qty_reserved = 1; 
            line.line_discount_input = '';
            line.line_discount = 0;
            line.line_total = line.unit_price; 
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
        }
        setIsProductSearchOpen(false);
    }, [activeLineIndex, getValues, setValue, uoms]);

    const handleSelectLot = useCallback((lot: LotNo) => {
        if (activeLotLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeLotLineIndex]) return;

            const newLines = [...currentLines];
            newLines[activeLotLineIndex] = {
                ...newLines[activeLotLineIndex],
                lot_no: lot.code || '',
                reserve_policy: 'MANUAL'
            };
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            setIsLotSearchOpen(false);
        }
    }, [activeLotLineIndex, getValues, setValue]);

    return {
        isEdit,
        isSubmitting,
        setIsSubmitting,
        methods,
        formData,
        // Master Data
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        itemTypes,
        saleAreas,
        uoms,
        warehouses,
        locations,
        // Search Modals State
        isCustomerSearchOpen,
        setIsCustomerSearchOpen,
        isProductSearchOpen,
        setIsProductSearchOpen,
        isLotSearchOpen,
        setIsLotSearchOpen,
        isLeadSearchOpen,
        setIsLeadSearchOpen,
        activeLineIndex,
        setActiveLineIndex,
        activeLotLineIndex,
        setActiveLotLineIndex,
        // Handlers
        handleSubmit,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectLot,
        handleSelectLead,
    };
};
