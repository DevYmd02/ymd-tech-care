import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import type { QuotationFormData } from '@sales/quotation/types/quotation.types';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@utils';
import { 
    calculateDiscountAmount, 
    calculateVatAmount, 
    calculateNetTotal, 
    calculateLineTotal 
} from '@sales/shared/utils/sales-calculations';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import { validateLineStock } from '@sales/shared/utils/stock-validation';
import { useBranchICOptions } from '@sales/shared/hooks/useBranchICOptions';
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';
import { useConfirmation } from '@hooks/useConfirmation';
import { SYSTEM_DOCUMENT_CODES } from '@/shared/constants/system-documents';

import type { Currency } from '@master-data/types/master-data-types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem, UOMListItem } from '@inventory/types/product-types';
import type { LotNo, Location as LocationItem } from '@inventory/types/inventory-master.types';
import type { EstimateHeader } from '@sales/estimate/services/estimate.service';
import type { WarehouseListItem } from '@master-data/types/master-data-types';
import { 
    ReservationFormSchema, 
    type ReservationFormValues, 
    type ReservationLineValues, 
    getReservationDefaultValues 
} from '../schemas/reservation-schemas';
import { ReservationService, type AvailableApproval } from '../services/reservation.service';
import type { AQLine } from '@sales/quotation-approve/types/quotation-approve.types';
import { useReservationMasterData } from './useReservationMasterData';

/**
 * 🕵️ Local interfaces for data discovery phase
 * Allows safe access to potential nested fields without using 'any'
 */
interface DiscoveryLine {
    sq_line_id?: string | number;
    item_id?: string | number | Record<string, unknown> | null;
    item_code?: string;
    item_name?: string;
    code?: string;
    name?: string;
    item_no?: string;
    item_description?: string;
    description?: string;
    qty?: number;
    unit_price?: number;
    discount_expression?: string;
    line_discount_input?: string;
    tax_code_id?: number | string;
    note?: string;
    id?: string | number;
    item?: Record<string, unknown>;
    item_master?: Record<string, unknown>;
    master_item?: Record<string, unknown>;
    master?: Record<string, unknown>;
    master_data?: Record<string, unknown>;
    [key: string]: unknown;
}

interface DiscoveryAQLine extends AQLine {
    item_code?: string;
    item_name?: string;
    [key: string]: unknown;
}

/**
 * 🕵️ Smart Recovery for Reservation: Automatically detect price sources if missing
 */
async function recoverReservationPriceSources(
    lines: ReservationLineValues[], 
    customerId: number, 
    branchId: number,
    setLines: (lines: ReservationLineValues[]) => void
) {
    if (!lines || lines.length === 0 || !customerId || !branchId) return;

    const updatedLines = [...lines];
    let hasChanges = false;

    const promises = updatedLines.map(async (line, index) => {
        // Skip if already has a source name
        if (line.price_source_name && line.price_source_name !== '') return;

        try {
            const result = await import('@sales/quotation/services/pricing.service').then(m => m.PricingService.calculatePrice({
                itemId: line.item_id,
                qty: line.qty_reserved,
                customerId,
                branchId,
                uomId: Number(line.uom_id)
            }));

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
        } catch {
            // Silent fail for recovery
        }
    });

    await Promise.all(promises);
    if (hasChanges) {
        setLines(updatedLines);
    }
}



// =============================================================================
// 🎛️ SECTION 1: HOOK DECLARATION & LOCAL UI STATE
// =============================================================================
export const useReservationForm = (isOpen: boolean, id?: string, initialData?: Partial<ReservationFormValues>, onClose?: () => void, readOnly: boolean = false) => {
    const { toast } = useToast();
    const { confirm } = useConfirmation();
    const isEdit = !!id;
    const queryClient = useQueryClient();
    const isFetchingRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Search Modals State
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [isLeadSearchOpen, setIsLeadSearchOpen] = useState(false);
    const [isAQSearchOpen, setIsAQSearchOpen] = useState(false);
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);

    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [activeLotLineIndex, setActiveLotLineIndex] = useState<number | null>(null);
    const [activeWarehouseLineIndex, setActiveWarehouseLineIndex] = useState<number | null>(null);
    const [activeLocationLineIndex, setActiveLocationLineIndex] = useState<number | null>(null);

    // React Hook Form Setup
    const methods = useForm<ReservationFormValues>({
        resolver: zodResolver(ReservationFormSchema) as Resolver<ReservationFormValues>,
        defaultValues: initialData ? { ...getReservationDefaultValues(), ...initialData } : getReservationDefaultValues(),
        mode: 'onBlur',
    });

    const { setValue, reset, control, getValues, handleSubmit, formState: { isDirty } } = methods;

    const watchedStatus = useWatch({ control, name: 'status' });
    const watchedSoNo = useWatch({ control, name: 'so_no' });
    const watchedSoId = useWatch({ control, name: 'so_id' });

    const isReadOnly = useMemo(() => {
        return readOnly || (watchedStatus !== 'DRAFT' && watchedStatus !== 'CONFIRMED') || !!watchedSoNo || !!watchedSoId;
    }, [readOnly, watchedStatus, watchedSoNo, watchedSoId]);

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !isReadOnly,
        enabled: isOpen,
        onSafeClose: onClose || (() => {})
    });

    const watchedFields = useWatch({
        control,
        name: [
            'branch_id',
            'isMulticurrency',
            'base_currency_code',
            'quote_currency_code',
            'lines',
            'discount_input',
            'tax_code_id',
            'sub_total',
            'discount_amount',
            'vat_amount',
            'total_amount'
        ]
    });

    const [
        branchId,
        isMulti,
        sourceCurrency,
        targetCurrency,
        watchedLines,
        watchedDiscountInput,
        taxCodeId,
        subTotal,
        discountAmount,
        vatAmount,
        totalAmount
    ] = watchedFields;

    const formData = useMemo(() => ({
        branch_id: branchId,
        isMulticurrency: isMulti,
        base_currency_code: sourceCurrency,
        quote_currency_code: targetCurrency,
        lines: watchedLines || [],
        discount_input: watchedDiscountInput,
        tax_code_id: taxCodeId,
        sub_total: subTotal || 0,
        discount_amount: discountAmount || 0,
        vat_amount: vatAmount || 0,
        total_amount: totalAmount || 0
    }), [
        branchId,
        isMulti,
        sourceCurrency,
        targetCurrency,
        watchedLines,
        watchedDiscountInput,
        taxCodeId,
        subTotal,
        discountAmount,
        vatAmount,
        totalAmount
    ]);

    // 🛡️ Centralized IC Option Resolution (Document-specific → Branch General → Global Default)
    const { icOptions: branchIcOptions } = useBranchICOptions(
        branchId,
        SYSTEM_DOCUMENT_CODES.SALES_RESERVATION
    );

    // =============================================================================
    // 🔄 SECTION 2: DATA HYDRATION & LIFECYCLE EFFECTS
    // =============================================================================
    // Initialization Guard
    const lastInitializedId = useRef<string | null | 'new'>(null);
    const defaultValues = useMemo(() => getReservationDefaultValues(), []);

    // Load Data Effect
    useEffect(() => {
        if (!isOpen) {
            lastInitializedId.current = null;
            return;
        }

        let active = true;

        const loadData = async () => {
            if (id && lastInitializedId.current !== id) {
                setIsLoading(true);
                try {
                    const data = await ReservationService.getById(id);
                    if (!active) return; // 🛡️ Guard against stale updates after unmount
                    if (data) {
                        // 🎯 Dynamically resolve conversion IDs to global UOM IDs on load (PRE-HYDRATION)
                        if (data.lines && data.lines.length > 0) {
                            const allItemIds = [...new Set(data.lines.map(l => Number(l.item_id)).filter(id => id > 0))];
                            if (allItemIds.length > 0) {
                                try {
                                    const convsList = await Promise.all(allItemIds.map(itemId => 
                                        queryClient.fetchQuery({
                                            queryKey: ['uom-conversions', itemId],
                                            queryFn: () => UOMConversionService.getByItemId(itemId),
                                            staleTime: 10 * 60 * 1000,
                                        }).then(res => ({ itemId, items: res?.items || [] }))
                                    ));
                                    const conversionMap = new Map<number, import('@/modules/master-data/types/master-data-types').UOMConversionListItem[]>();
                                    convsList.forEach(c => { if (c) conversionMap.set(c.itemId, c.items); });

                                    data.lines = data.lines.map(line => {
                                        const itemId = Number(line.item_id);
                                        const convs = conversionMap.get(itemId) || [];
                                        const currentUomVal = Number(line.uom_id);
                                        const matchedConv = convs.find(c => Number(c.conversion_id) === currentUomVal);
                                        if (matchedConv) {
                                            return {
                                                ...line,
                                                uom_id: String(matchedConv.from_unit_id),
                                                item_uom_id: Number(matchedConv.conversion_id)
                                            };
                                        }
                                        return line;
                                    });
                                } catch (err) {
                                    logger.error('Failed to pre-hydrate UOMs:', err);
                                }
                            }
                        }

                        reset({
                            ...getReservationDefaultValues(),
                            ...data,
                            reservation_id: data.reservation_id || id,
                        });
                        // 🕵️ Trigger Smart Recovery for missing sources in Edit mode
                        if (data.customer_id && data.branch_id) {
                            void recoverReservationPriceSources(
                                data.lines || [],
                                Number(data.customer_id),
                                Number(data.branch_id),
                                (newLines) => setValue('lines', newLines)
                            );
                        }
                        lastInitializedId.current = id;
                    }
                } catch (error) {
                    if (!active) return;
                    logger.error('Failed to load reservation data:', error);
                    toast('ไม่สามารถโหลดข้อมูลได้', 'error');
                } finally {
                    if (active) setIsLoading(false);
                }
            } else if (!id && lastInitializedId.current !== 'new') {
                reset({ ...getReservationDefaultValues(), ...(initialData || {}) });
                lastInitializedId.current = 'new';
            }
        };

        loadData();
        return () => { active = false; };
    }, [isOpen, id, reset, initialData, toast, setValue, getValues, queryClient]);


    // Master Data Hook
    const {
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        saleAreas,
        employees,
        uoms,
        warehouses,
        locations,
        priceLevelNames,
        isMasterDataReady
    } = useReservationMasterData(isOpen);

    // Initialization Guard: Reset when ID changes or Master Data becomes ready
    useEffect(() => {
        if (!isOpen) {
            lastInitializedId.current = null;
            return;
        }

        const currentTarget = id || 'new';

        if (!isMasterDataReady) {
            logger.debug('⏳ [ReservationForm] Waiting for master data...');
            return;
        }

        if (lastInitializedId.current !== currentTarget) {
            reset(initialData ? { ...defaultValues, ...initialData } : defaultValues);
            lastInitializedId.current = currentTarget;
        }
    }, [isOpen, isMasterDataReady, id, initialData, reset, defaultValues]);

    // =============================================================================
    // 🧮 SECTION 3: EXCHANGE RATE & TAX & TOTAL CALCULATIONS
    // =============================================================================
    // Exchange Rate Sync Logic

    useEffect(() => {
        if (!sourceCurrency || !isMulti) return;
        
        if (sourceCurrency === 'THB' || sourceCurrency === targetCurrency) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            return;
        }

        const safeCurrencies = Array.isArray(currencies) ? currencies : [];
        const sourceObj = safeCurrencies.find((c: Currency) => c.currency_code === sourceCurrency);
        const targetObj = safeCurrencies.find((c: Currency) => c.currency_code === targetCurrency);

        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || (targetCurrency === 'THB' ? 1 : 1);

        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulti]);

    // Header Totals Logic
    const lines = useMemo(() => watchedLines || [], [watchedLines]);
    const discountInput = watchedDiscountInput || '';

    useEffect(() => {
        const calculatedSubTotal = lines.reduce((sum: number, line: ReservationLineValues) => sum + (line.line_total || 0), 0);
        const calculatedDiscount = calculateDiscountAmount(calculatedSubTotal, discountInput);
        const amountAfterDiscount = calculatedSubTotal - calculatedDiscount;
        
        const safeTaxCodes = Array.isArray(taxCodes) ? taxCodes : [];
        const selectedTaxCode = safeTaxCodes.find(t => String(t.tax_code_id) === String(taxCodeId));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        
        const vatAmountValue = calculateVatAmount(amountAfterDiscount, taxRate);
        const totalAmountValue = calculateNetTotal(calculatedSubTotal, calculatedDiscount, vatAmountValue);

        // 🛡️ Prevent overwriting backend's total_amount with frontend's recalculated rounding difference on initial load
        const currentTotal = getValues('total_amount') || 0;
        const currentSubTotal = getValues('sub_total') || 0;
        const currentVat = getValues('vat_amount') || 0;

        // If form is NOT dirty and the difference is less than 1 Baht (rounding discrepancy), DO NOT overwrite.
        const isRoundingDiff = !isDirty && currentTotal > 0 && Math.abs(currentTotal - totalAmountValue) < 1;

        if (!isRoundingDiff) {
            if (currentSubTotal !== calculatedSubTotal) setValue('sub_total', calculatedSubTotal, { shouldDirty: false });
            if (getValues('discount_amount') !== calculatedDiscount) setValue('discount_amount', calculatedDiscount, { shouldDirty: false });
            if (currentVat !== vatAmountValue) setValue('vat_amount', vatAmountValue, { shouldDirty: false });
            if (currentTotal !== totalAmountValue) setValue('total_amount', totalAmountValue, { shouldDirty: false });
        }
    }, [lines, discountInput, taxCodeId, taxCodes, setValue, getValues, isDirty]);
    
    // --------------------------------------------------------
    // Tax Propagation Logic
    // --------------------------------------------------------
    useEffect(() => {
        if (taxCodeId !== undefined) {
             const currentLines = getValues('lines') || [];
             const needsUpdate = currentLines.some((l: ReservationLineValues) => Number(l.tax_code_id) !== Number(taxCodeId));
             if (needsUpdate) {
                 const updatedLines = currentLines.map((l: ReservationLineValues) => ({
                     ...l,
                     tax_code_id: taxCodeId
                 }));
                 setValue('lines', updatedLines as ReservationLineValues[], { shouldDirty: true });
             }
        }
    }, [taxCodeId, setValue, getValues]);

    // =============================================================================
    // 📝 SECTION 4: LINE ITEMS MANAGEMENT HANDLERS (ADD / REMOVE / UPDATE)
    // =============================================================================
    // Event Handlers
    const handleAddLine = useCallback(() => {
        const newLine: ReservationLineValues = { 
            item_id: '', 
            item_code: '', 
            item_name: '', 
            qty_reserved: 0, 
            warehouse_id: '',
            location_id: '',
            uom_id: '', 
            unit_price: 0, 
            lot_id: 0,
            lot_no: '',
            lot_balance_id: 0,
            line_discount_input: '',
            line_discount: 0, 
            line_total: 0, 
            note: '',
            tax_code_id: taxCodeId || undefined,
        };
        setValue('lines', [...(getValues('lines') || []), newLine]);
    }, [setValue, getValues, taxCodeId]);

    const handleRemoveLine = useCallback((index: number) => {
        setValue('lines', (getValues('lines') || []).filter((_: unknown, i: number) => i !== index));
    }, [setValue, getValues]);

    const handleLineChange = useCallback((index: number, field: keyof ReservationLineValues, value: string | number) => {
        const currentLines = getValues('lines') || [];
        if (!currentLines[index]) return;

        const newLines = [...currentLines];
        const prevValue = newLines[index][field];
        const updatedLine = { ...newLines[index], [field]: value };
        
        if (field === 'qty_reserved' || field === 'unit_price' || field === 'line_discount_input') {
            const qty = Number(field === 'qty_reserved' ? value : updatedLine.qty_reserved) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            const ldInput = (field === 'line_discount_input' ? (value as string) : updatedLine.line_discount_input) || '';
            
            const calculatedLD = calculateDiscountAmount(qty * price, ldInput);
            
            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = calculateLineTotal(qty, price, calculatedLD);

            // If user manually changed the unit_price, mark as MANUAL (3)
            if (field === 'unit_price') {
                const hasChanged = Number(prevValue) !== Number(value);
                if (hasChanged) {
                    updatedLine.price_source = 3;
                    updatedLine.price_source_name = 'MANUAL';
                }
            }
        }
        
        if (field === 'uom_id') {
            if (updatedLine.item_id && value) {
                queryClient.fetchQuery({
                    queryKey: ['uom-conversions', Number(updatedLine.item_id)],
                    queryFn: () => UOMConversionService.getByItemId(Number(updatedLine.item_id)),
                    staleTime: 10 * 60 * 1000,
                }).then(response => {
                    const convs = response?.items || [];
                    const matchedConv = convs.find(c => Number(c.from_unit_id) === Number(value)) ||
                                       convs.find(c => Number(c.conversion_factor) === 1);
                    if (matchedConv) {
                        setValue(`lines.${index}.item_uom_id` as never, Number(matchedConv.conversion_id) as never, { shouldDirty: true });
                    }
                }).catch(() => {});
            }
        }

        newLines[index] = updatedLine;
        setValue('lines', newLines, { shouldValidate: true });
    }, [setValue, getValues, queryClient]);

    // =============================================================================
    // 🔍 SECTION 5: MODAL SEARCH SELECTION HANDLERS
    // =============================================================================
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
            
            const productUomId = product.uom_id || product.uom_id;
            const productUomName = product.uom_name || product.base_uom_name || product.uom_name;
            const safeUoms = Array.isArray(uoms) ? uoms : [];
            const foundUom = safeUoms.find((u: UOMListItem) => 
                (productUomId && (String(u.id) === String(productUomId) || String(u.uom_id) === String(productUomId))) ||
                (productUomName && (u.uom_name?.trim() === productUomName?.trim() || u.uom_name?.trim() === productUomName?.trim()))
            );

            line.uom_id = foundUom ? String(foundUom.id || foundUom.uom_id) : String(productUomId || productUomName || 'PCS');
            
            // Resolve item_uom_id conversion PK
            if (line.item_id && line.uom_id) {
                queryClient.fetchQuery({
                    queryKey: ['uom-conversions', Number(line.item_id)],
                    queryFn: () => UOMConversionService.getByItemId(Number(line.item_id)),
                    staleTime: 10 * 60 * 1000,
                }).then(response => {
                    const convs = response?.items || [];
                    const matchedConv = convs.find(c => Number(c.from_unit_id) === Number(line.uom_id)) ||
                                       convs.find(c => Number(c.conversion_factor) === 1);
                    if (matchedConv) {
                        setValue(`lines.${activeLineIndex}.item_uom_id` as never, Number(matchedConv.conversion_id) as never, { shouldDirty: true });
                    }
                }).catch(() => {});
            }

            line.unit_price = Number(product.standard_cost || 0);
            line.qty_reserved = 1; 
            line.line_discount_input = '';
            line.line_discount = 0;
            line.line_total = calculateLineTotal(line.qty_reserved, line.unit_price, line.line_discount);
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
        }
        setIsProductSearchOpen(false);
    }, [activeLineIndex, getValues, setValue, uoms, queryClient]);

    const handleSelectLot = useCallback(async (lot: LotNo) => {
        if (activeLotLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeLotLineIndex]) return;

            const newLines = [...currentLines];
            const line = { ...newLines[activeLotLineIndex] };
            
            const qtyReserved = Number(line.qty_reserved || 0);
            const lotAvailableQty = lot.qty_available ?? lot.sale_stock ?? 0;
            const lotWarehouseId = lot.warehouse_id || line.warehouse_id;
            const lotLocationId = lot.location_id || line.location_id;

            const stockValidation = validateLineStock(
                qtyReserved,
                lotAvailableQty,
                lotWarehouseId,
                lotLocationId,
                branchIcOptions
            );

            if (!stockValidation.isValid || stockValidation.type === 'warning') {
                if (stockValidation.code === 'NEGATIVE_STOCK_NOT_ALLOWED') {
                    // Hard error dialog (block selection completely)
                    await confirm({
                        title: 'สต็อกไม่เพียงพอ (ห้ามติดลบ)',
                        description: `ยอดจอง (${qtyReserved} ชิ้น) เกินกว่าจำนวนพร้อมใช้งานในล็อต (${lotAvailableQty} ชิ้น)\nไม่สามารถเลือกล็อตนี้ได้เนื่องจากนโยบายห้ามสต็อกติดลบ`,
                        confirmText: 'ตกลง',
                        hideCancel: true,
                        variant: 'danger',
                        width: 'max-w-lg'
                    });
                    return;
                } else if (stockValidation.code === 'NEGATIVE_STOCK_ALLOWED' || stockValidation.code === 'INSUFFICIENT_STOCK_WARNING') {
                    // Soft warning dialog (allow selection with user confirmation)
                    const isConfirmed = await confirm({
                        title: 'ยืนยันการเลือกล็อตสินค้า',
                        description: `ยอดจอง (${qtyReserved} ชิ้น) เกินกว่าจำนวนพร้อมใช้งานในล็อต (${lotAvailableQty} ชิ้น)\nคุณต้องการยืนยันที่จะเลือกล็อตนี้ใช่หรือไม่?`,
                        confirmText: 'ยืนยันเลือก',
                        cancelText: 'ยกเลิก',
                        variant: 'warning',
                        width: 'max-w-lg'
                    });
                    
                    if (!isConfirmed) return;
                }
            }

            line.lot_id = lot.lot_no_id ? Number(lot.lot_no_id) : (lot.id ? Number(lot.id) : 0);
            line.lot_no = lot.code || '';
            line.lot_available_qty = lotAvailableQty;
            // lot_balance_id = PK ของ item_lot_balance table (Backend ต้องการสำหรับ Stock Commit)
            // LotSearchModal map id = lot_balance_id, ส่วน lot_no_id = master lot_id
            line.lot_balance_id = lot.lot_balance_id 
                ? Number(lot.lot_balance_id) 
                : (lot.id ? Number(lot.id) : 0);

            // 💡 Ensure Warehouse/Location match the selected LOT
            // This is critical when selecting from "Show All Stock"
            if (lot.warehouse_id) {
                line.warehouse_id = String(lot.warehouse_id);
            }
            if (lot.location_id) {
                line.location_id = String(lot.location_id);
            }

            newLines[activeLotLineIndex] = line;
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            setIsLotSearchOpen(false);
        }
    }, [activeLotLineIndex, getValues, setValue, confirm, branchIcOptions]);

    const handleSelectWarehouse = useCallback((warehouse: WarehouseListItem) => {
        if (activeWarehouseLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeWarehouseLineIndex]) return;

            const newLines = [...currentLines];
            const line = { ...newLines[activeWarehouseLineIndex] };
            const newWarehouseId = String(warehouse.warehouse_id);
            
            line.warehouse_id = newWarehouseId;
            
            // Auto-select first location for this warehouse
            const firstLoc = locations.find(loc => String(loc.warehouse_id) === newWarehouseId);
            line.location_id = firstLoc ? String(firstLoc.location_id) : '';
            
            newLines[activeWarehouseLineIndex] = line;
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            setIsWarehouseSearchOpen(false);
        }
    }, [activeWarehouseLineIndex, getValues, setValue, locations]);

    const handleSelectLocation = useCallback((location: LocationItem) => {
        if (activeLocationLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeLocationLineIndex]) return;

            const newLines = [...currentLines];
            newLines[activeLocationLineIndex] = {
                ...newLines[activeLocationLineIndex],
                location_id: String(location.location_id)
            };
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            setIsLocationSearchOpen(false);
        }
    }, [activeLocationLineIndex, getValues, setValue]);




    // =============================================================================
    // 🔌 SECTION 6: EXTERNAL REFERENCE INTEGRATIONS (SQ/AQ QUOTATION FETCHING)
    // =============================================================================
    const handleFetchQuotation = useCallback(async (type: 'SQ' | 'AQ', overrideId?: string) => {
        if (isFetchingRef.current) return;
        const field = type === 'SQ' ? 'sq_id' : 'aq_id';
        const val = overrideId || getValues(field);

        
        if (!val) {
            toast(`กรุณาระบุเลขที่ ${type}`, 'error');
            return;
        }

        isFetchingRef.current = true;
        setIsSubmitting(true);
        try {
            let quotationId: string | number | undefined;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
            
            let foundAQRecord: AvailableApproval | undefined;

            if (isUUID) {
                quotationId = val;
            } else {
                // If fetching AQ, try to find the record first to get the linked SQ ID
                if (type === 'AQ') {
                    const aqsList = await ReservationService.getAvailableApprovals();
                    foundAQRecord = aqsList.find((a: AvailableApproval) => 
                        String(a.aq_no) === String(val) || 
                        String(a.aq_id) === String(val) ||
                        String(a.sq_no || a.sq?.sq_no) === String(val)
                    );
                    if (foundAQRecord) {
                        // Resolve sq_no from nested sq object if not at root level
                        if (!foundAQRecord.sq_no && foundAQRecord.sq?.sq_no) {
                            foundAQRecord = { ...foundAQRecord, sq_no: foundAQRecord.sq.sq_no, sq_date: foundAQRecord.sq.sq_date };
                        }
                        quotationId = foundAQRecord.sq_id;
                    }
                }

                // Primary or Fallback SQ search (if quotationId not yet found via AQ)
                if (!quotationId) {
                    const searchRes = await QuotationService.getList({ sq_no: val, limit: 10 }); // Get a few to be safe
                    const data = searchRes.data || [];
                    
                    // Strict matching by sq_no or id
                    const match = data.find(d => String(d.sq_no) === String(val) || String(d.sq_id || d.id) === String(val));
                    
                    if (match) {
                        quotationId = match.sq_id || match.id;
                    }
                }
            }

            if (!quotationId) {
                toast(`ไม่พบข้อมูล ${type} เลขที่ ${val}`, 'error');
                setIsSubmitting(false);
                return;
            }

            // 2. Fetch full detail
            let detail = await QuotationService.getById(quotationId);


            // 🚨 Fallback 1: If ID fetch failed, try searching by sq_no (from nested or root)
            if (!detail) {
                const resolvedSqNo = foundAQRecord?.sq_no || foundAQRecord?.sq?.sq_no || (type === 'SQ' ? val : undefined);
                if (resolvedSqNo) {
                    const searchRes = await QuotationService.getList({ q: resolvedSqNo, limit: 10 });
                    if (searchRes.data && searchRes.data.length > 0) {
                        const listMatch = searchRes.data.find(d => 
                            String(d.sq_no) === String(resolvedSqNo) || 
                            String(d.sq_id || d.id) === String(resolvedSqNo)
                        );

                        if (listMatch) {
                            const foundId = listMatch.sq_id || listMatch.id;
                            if (foundId && String(foundId) !== String(quotationId)) {
                                detail = await QuotationService.getById(foundId);
                            }
                            if (!detail) {
                                detail = listMatch as unknown as QuotationFormData;
                            }
                        }
                    }
                }
            }

            // 🚨 Fallback 2: When sq_no is unavailable but we have sq_id, search all SQs and match by sq_id
            if (!detail && foundAQRecord?.sq_id) {
                try {
                    const searchRes = await QuotationService.getList({ limit: 500 });
                    const match = (searchRes.data || []).find(d => 
                        String(d.sq_id || d.id) === String(foundAQRecord!.sq_id)
                    );
                    if (match) {
                        const foundId = match.sq_id || match.id;
                        detail = await QuotationService.getById(foundId ?? 0);
                        if (!detail) detail = match as unknown as QuotationFormData;
                    }
                } catch {
                    // Silently ignore sq_id-based fallback errors
                }
            }

            // 🚨 Ultimate Fallback: If we are fetching AQ and still have no detail, use the AQ record itself
            if (!detail && type === 'AQ' && foundAQRecord) {
                detail = foundAQRecord as unknown as QuotationFormData;
            }

            if (!detail) {
                toast(`ไม่สามารถดึงข้อมูลรายละเอียดของ ${val} ได้`, 'error');
                setIsSubmitting(false);
                return;
            }

            // 2.5 If type is AQ, use the record found in available-approvals list
            // 🕵️ No longer calling AQService.getApprovalById to avoid 404 errors (endpoint not supported).
            // We rely on data from foundAQRecord (from available-approvals API) or fallback to SQ details.
            let aqDetail: AvailableApproval | null = foundAQRecord || null;
            
            if (type === 'AQ' && !aqDetail) {
                try {
                    const aqs = await ReservationService.getAvailableApprovals();
                    aqDetail = aqs.find((a: AvailableApproval) => 
                        String(a.aq_no) === String(val) || 
                        String(a.aq_id) === String(val) ||
                        String(a.sq_no) === String(val)
                    ) || null;
                } catch {
                    // Fail silently for available approvals fetch
                }
            }

            // 5. Multicurrency & Currency Sync (Aggressive Discovery)
            const d = detail as unknown as DiscoveryLine;
            const ad = aqDetail as unknown as DiscoveryAQLine;
            const rd = ((detail as unknown) as Record<string, unknown>).rawData as Record<string, unknown> || {}; 

            // 3. Populate Header Fields
            const resolvedCustomerId = detail.customer_id || aqDetail?.customer_id || rd.customer_id || d.customer_id;
            if (resolvedCustomerId) {
                setValue('customer_id', String(resolvedCustomerId), { shouldValidate: true, shouldDirty: true });
            }
            
            const resolvedBranchId = detail.branch_id || aqDetail?.branch_id || rd.branch_id || d.branch_id;
            if (resolvedBranchId) {
                setValue('branch_id', String(resolvedBranchId), { shouldValidate: true, shouldDirty: true });
            } 

            // Set SQ/AQ Numbers and IDs
            if (type === 'SQ') {
                setValue('sq_id', String(detail.sq_id || d.id || ''), { shouldDirty: true });
                setValue('sq_no', String(detail.sq_no || ''), { shouldDirty: true });
            } else {
                setValue('aq_id', String(aqDetail?.aq_id || d.aq_id || ''), { shouldDirty: true });
                setValue('aq_no', String(aqDetail?.aq_no || d.aq_no || ''), { shouldDirty: true });
                setValue('sq_id', String(aqDetail?.sq_id || detail.sq_id || d.id || ''), { shouldDirty: true });
                // Robust sq_no extraction from aqDetail or detail
                const resolvedSqNo = String(
                    aqDetail?.sq_no || 
                    aqDetail?.sq?.sq_no || 
                    detail.sq_no || 
                    ''
                );
                setValue('sq_no', resolvedSqNo, { shouldDirty: true });
            }

            // 🛡️ Standard Alignment: Base is usually foreign (USD), Quote is local (THB)
            const baseCurrency = String(
                detail.base_currency_code ||
                rd.base_currency_code ||
                d.base_currency_code || 
                (d.currency_code && d.currency_code !== 'THB' ? d.currency_code : undefined) ||
                ad?.base_currency_code || 
                ad?.currency_code || 
                ad?.currency || 
                d.currency_code || 
                d.currency || 
                'THB'
            );
            
            const quoteCurrency = String(detail.quote_currency_code || rd.quote_currency_code || d.quote_currency_code || ad?.quote_currency_code || ad?.currency || 'THB');
            const exchangeRate = Number(detail.exchange_rate || rd.exchange_rate || d.exchange_rate || ad?.exchange_rate || 1);
            
            // 🛡️ User Request: Always enable Multicurrency by default (Auto Tick)
            // Even if it's THB, we want to show the currency fields.
            const isMulticurrency = true;

            // Get the most relevant date for exchange rate
            const rawDate = (
                (detail.exchange_rate_date && detail.exchange_rate_date !== 'null') ? detail.exchange_rate_date :
                (rd.exchange_rate_date && rd.exchange_rate_date !== 'null') ? rd.exchange_rate_date :
                (d.exchange_rate_date && d.exchange_rate_date !== 'null') ? d.exchange_rate_date : 
                (d.sq_date && d.sq_date !== 'null') ? d.sq_date : 
                (ad?.exchange_rate_date && String(ad.exchange_rate_date) !== 'null') ? String(ad.exchange_rate_date) : 
                (ad?.aq_date && String(ad.aq_date) !== 'null') ? String(ad.aq_date) : 
                new Date().toISOString().split('T')[0]
            );
            const exchangeRateDate = String(rawDate).split('T')[0];

            // Set Values for Multicurrency
            setValue('isMulticurrency', isMulticurrency, { shouldDirty: true }); 
            setValue('base_currency_code', baseCurrency, { shouldDirty: true });
            setValue('quote_currency_code', quoteCurrency, { shouldDirty: true });
            setValue('exchange_rate', exchangeRate, { shouldDirty: true });
            setValue('exchange_rate_date', exchangeRateDate, { shouldDirty: true });

            // 6. Header Field Mapping (Aggressive Fallback Discovery)
            // Priority: Detail from Service -> Explicit rawData rd -> Discovery Line 'd'
            
            // Payment Terms
            const paymentTerms = Number(detail.payment_term_days ?? rd.payment_term_days ?? d.payment_term_days ?? d.payment_term ?? d.credit_term ?? 0);
            setValue('payment_term_days', paymentTerms, { shouldDirty: true });

            if (detail.remarks || rd.remarks || d.remarks) setValue('remarks', String(detail.remarks || rd.remarks || d.remarks || ''), { shouldDirty: true });
            
            // Discount Mapping
            const discountInput = String(detail.discount_expression || detail.discount_input || rd.discount_expression || rd.discount_input || d.discount_input || d.discount_rate || '0');
            setValue('discount_input', discountInput, { shouldDirty: true });

            // Tax Code Discovery
            const taxCodeId = detail.tax_code_id ?? rd.tax_code_id ?? d.tax_code_id ?? d.tax_id ?? d.vat_id ?? d.id_tax;
            if (taxCodeId !== undefined && taxCodeId !== null) setValue('tax_code_id', Number(taxCodeId), { shouldDirty: true });

            // Sales Area
            const saleAreaId = detail.sale_area_id ?? rd.sale_area_id ?? d.sale_area_id ?? d.area_id ?? d.emp_area_id;
            if (saleAreaId !== undefined && saleAreaId !== null) setValue('sale_area_id', String(saleAreaId), { shouldDirty: true });

            // Sales Person Discovery
            const empSaleId = detail.emp_sale_id ?? rd.emp_sale_id ?? d.emp_sale_id ?? d.sale_id ?? d.emp_id_sale ?? d.id_sale;
            if (empSaleId !== undefined && empSaleId !== null) setValue('emp_sale_id', String(empSaleId), { shouldDirty: true });

            // Department
            const empDeptId = detail.emp_dept_id ?? rd.emp_dept_id ?? d.emp_dept_id ?? d.dept_id ?? d.id_dept;
            if (empDeptId !== undefined && empDeptId !== null) setValue('emp_dept_id', String(empDeptId), { shouldDirty: true });

            // Project / Job Discovery
            const projectId = detail.job_id ?? detail.project_id ?? rd.job_id ?? rd.project_id ?? d.job_id ?? d.project_id ?? d.id_project;
            if (projectId !== undefined && projectId !== null) setValue('job_id', String(projectId), { shouldDirty: true });

            // 4. Populate Line Items
            if (detail.lines && detail.lines.length > 0) {
                // If we have AQ detail, use its lines/quantities
                const aqLines: AQLine[] = (aqDetail?.aq_lines || aqDetail?.lines || []) as AQLine[];

                const mappedLines: ReservationLineValues[] = (detail.lines || []).map((qLineRaw: unknown) => {
                    const qLine = qLineRaw as DiscoveryLine;
                    


                    // Find matching line in AQ to get approved quantities and potentially item details
                    const matchingAQLine = (aqLines || []).find((al: AQLine) => {
                        const dal = al as DiscoveryAQLine;
                        return Number(dal.sq_line_id) === Number(qLine.sq_line_id) || 
                               Number(dal.item_id) === Number(qLine.item_id);
                    }) as DiscoveryAQLine | undefined;

                    // 🕵️ SUPER Aggressive Item Discovery: Extract code/name from any possible nested object
                    const qLineItemId = qLine.item_id;
                    const itemObj = (typeof qLineItemId === 'object' && qLineItemId !== null) 
                        ? (qLineItemId as Record<string, unknown>)
                        : ((qLine.item || qLine.item_master || qLine.master_item || qLine.master || qLine.master_data || {}) as Record<string, unknown>);
                    
                    const itemCode = String(
                        qLine.item_code || 
                        matchingAQLine?.item_code ||
                        itemObj.item_code || 
                        itemObj.code || 
                        itemObj.item_no ||
                        qLine.code || 
                        qLine.item_no ||
                        (typeof qLineItemId === 'string' && !qLineItemId.match(/^\d+$/) ? qLineItemId : '') ||
                        ''
                    ).trim();
                    
                    const itemName = String(
                        qLine.item_name || 
                        matchingAQLine?.item_name ||
                        itemObj.item_name || 
                        itemObj.name || 
                        itemObj.item_name_th || 
                        itemObj.item_description ||
                        itemObj.description ||
                        qLine.name || 
                        qLine.item_description || 
                        qLine.description ||
                        ''
                    ).trim();
                    
                    const itemId = typeof qLineItemId === 'object' && qLineItemId !== null
                        ? String(itemObj.item_id || itemObj.id || '')
                        : String(qLineItemId || qLine.id || matchingAQLine?.item_id || '');



                    // If it's an AQ fetch, we should prioritize approved_qty if available
                    const qtyToUse = (type === 'AQ' && matchingAQLine) 
                        ? Number(matchingAQLine.approved_qty ?? matchingAQLine.qty ?? qLine.qty ?? 0)
                        : Number(qLine.qty || 0);

                    // 🛠️ Recalculate Line Total during mapping to ensure UI consistency
                    const price = Number(qLine.unit_price || 0);
                    const ldInput = String(qLine.discount_expression || qLine.line_discount_input || '');
                    
                    const calculatedLD = calculateDiscountAmount(qtyToUse * price, ldInput);

                    return {
                        id: String(qLine.sq_line_id || ''),
                        sq_line_id: String(qLine.sq_line_id || ''),
                        item_id: itemId,
                        item_code: itemCode,
                        item_name: itemName,
                        qty_reserved: qtyToUse,
                        warehouse_id: '', 
                        location_id: '',  
                        uom_id: String(qLine.uom_id || qLine.uom_id || 'PCS'),
                        unit_price: price,
                        lot_id: 0,
                        lot_no: '',
                        lot_balance_id: 0,
                        line_discount_input: ldInput,
                        line_discount: calculatedLD,
                        line_total: calculateLineTotal(qtyToUse, price, calculatedLD),
                        tax_code_id: qLine.tax_code_id ? Number(qLine.tax_code_id) : (detail.tax_code_id ? Number(detail.tax_code_id) : undefined),
                        note: String(qLine.note || ''),
                        price_source: qLine.price_source !== undefined ? Number(qLine.price_source) : (matchingAQLine?.price_source !== undefined ? Number(matchingAQLine.price_source) : undefined),
                        price_source_name: (() => {
                            const name = String(qLine.price_source_name || matchingAQLine?.price_source_name || '').trim();
                            if (name && name !== 'null' && name !== 'undefined' && name !== '-') return name;
                            
                            const s = qLine.price_source !== undefined ? Number(qLine.price_source) : (matchingAQLine?.price_source !== undefined ? Number(matchingAQLine.price_source) : undefined);
                            if (s === 1) return 'PRICE_LIST';
                            if (s === 2) return 'PRICE_LEVEL';
                            if (s === 3) return 'MANUAL';
                            return '';
                        })(),
                        price_level_priority: qLine.price_level_priority !== undefined ? Number(qLine.price_level_priority) : (qLine.priority !== undefined ? Number(qLine.priority) : (matchingAQLine?.price_level_priority !== undefined ? Number(matchingAQLine.price_level_priority) : undefined)),
                    };
                });
                
                // 🕵️ ITEM ENRICHMENT: If names are still missing, fetch from master data
                const missingItemIds = mappedLines
                    .filter(l => !l.item_name || l.item_name === '-' || l.item_name === '')
                    .map(l => l.item_id)
                    .filter(id => id !== undefined && id !== null);

                if (missingItemIds.length > 0) {
                    try {
                        // Fetch only the missing items in parallel
                        const missingItemsData = await Promise.all(
                            missingItemIds.map(id => ItemMasterService.getById(Number(id)))
                        );

                        // Create a map for quick lookup
                        const itemMap = new Map();
                        missingItemsData.forEach(item => {
                            if (item) itemMap.set(String(item.item_id), item);
                        });
                        
                        mappedLines.forEach((l: ReservationLineValues) => {
                            if (!l.item_name || l.item_name === '-' || l.item_name === '') {
                                const match = itemMap.get(String(l.item_id));
                                if (match) {
                                    l.item_name = String(match.item_name || match.description || '');
                                    l.item_code = String(match.item_code || l.item_code);
                                }
                            }
                        });
                    } catch {
                        // Ignore enrichment errors silently
                    }
                }

                // Filter out lines with 0 qty if it was from AQ (rejected lines have 0 approved_qty)
                const finalLines = type === 'AQ' ? mappedLines.filter(l => l.qty_reserved > 0) : mappedLines;
                
                // 🎯 Dynamically resolve conversion IDs to global UOM IDs for fetched SQ/AQ lines
                const allLineItemIds = [...new Set(finalLines.map(l => Number(l.item_id)).filter(id => id > 0))];
                if (allLineItemIds.length > 0) {
                    Promise.all(allLineItemIds.map(itemId => 
                        queryClient.fetchQuery({
                            queryKey: ['uom-conversions', itemId],
                            queryFn: () => UOMConversionService.getByItemId(itemId),
                            staleTime: 10 * 60 * 1000,
                        }).then(res => ({ itemId, items: res?.items || [] }))
                    )).then(convsList => {
                        const conversionMap = new Map<number, import('@/modules/master-data/types/master-data-types').UOMConversionListItem[]>();
                        convsList.forEach(c => { if (c) conversionMap.set(c.itemId, c.items); });

                        const updatedLines = finalLines.map(line => {
                            const itemId = Number(line.item_id);
                            const convs = conversionMap.get(itemId) || [];
                            const currentUomVal = Number(line.uom_id);
                            const matchedConv = convs.find(c => Number(c.conversion_id) === currentUomVal);
                            if (matchedConv) {
                                return {
                                    ...line,
                                    uom_id: String(matchedConv.from_unit_id),
                                    item_uom_id: Number(matchedConv.conversion_id)
                                };
                            }
                            return line;
                        });
                        setValue('lines', updatedLines, { shouldDirty: true, shouldValidate: true });
                        
                        // 🕵️ Trigger Smart Recovery for missing sources in Reservation view
                        if (detail.customer_id && detail.branch_id) {
                            void recoverReservationPriceSources(
                                updatedLines, 
                                Number(detail.customer_id), 
                                Number(detail.branch_id),
                                (newLines) => setValue('lines', newLines)
                            );
                        }
                    }).catch(() => {
                        setValue('lines', finalLines, { shouldDirty: true, shouldValidate: true });
                        if (detail.customer_id && detail.branch_id) {
                            void recoverReservationPriceSources(
                                finalLines, 
                                Number(detail.customer_id), 
                                Number(detail.branch_id),
                                (newLines) => setValue('lines', newLines)
                            );
                        }
                    });
                } else {
                    setValue('lines', finalLines, { shouldDirty: true, shouldValidate: true });
                    if (detail.customer_id && detail.branch_id) {
                        void recoverReservationPriceSources(
                            finalLines, 
                            Number(detail.customer_id), 
                            Number(detail.branch_id),
                            (newLines) => setValue('lines', newLines)
                        );
                    }
                }
            }

            toast(`ซิงค์ข้อมูลจาก ${val} สำเร็จ`, 'success');
        } catch {
            toast('เกิดข้อผิดพลาดในการดึงข้อมูล', 'error');
        } finally {
            isFetchingRef.current = false;
            setIsSubmitting(false);
        }
    }, [getValues, setValue, setIsSubmitting, toast, queryClient]);

    const handleSelectAQ = useCallback((aq: AvailableApproval) => {
        // Correctly set both ID and NO fields
        setValue('aq_id', String(aq.aq_id));
        setValue('aq_no', String(aq.aq_no || ''));
        setValue('sq_id', String(aq.sq_id));
        // Use the robust sq_no from the record or nested sq object
        setValue('sq_no', String(aq.sq_no || aq.sq?.sq_no || ''));
        
        setIsAQSearchOpen(false);
        // Automatically fetch details after selection
        handleFetchQuotation('AQ', String(aq.aq_no || aq.aq_id));
    }, [setValue, handleFetchQuotation]);

    // =============================================================================
    // 📤 SECTION 7: HOOK EXPORTS / OUTPUT API
    // =============================================================================
    return {
        isEdit,
        isSubmitting,
        setIsSubmitting,
        isLoading,
        methods,
        formData,
        // Master Data
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        saleAreas,
        employees,
        uoms,
        warehouses,
        locations,
        priceLevelNames,
        branchIcOptions,
        // Search Modals State
        isCustomerSearchOpen,
        setIsCustomerSearchOpen,
        isProductSearchOpen,
        setIsProductSearchOpen,
        isLotSearchOpen,
        setIsLotSearchOpen,
        isLeadSearchOpen,
        setIsLeadSearchOpen,
        isAQSearchOpen,
        setIsAQSearchOpen,
        isWarehouseSearchOpen,
        setIsWarehouseSearchOpen,
        isLocationSearchOpen,
        setIsLocationSearchOpen,

        activeLineIndex,
        setActiveLineIndex,
        activeLotLineIndex,
        setActiveLotLineIndex,
        activeWarehouseLineIndex,
        setActiveWarehouseLineIndex,
        activeLocationLineIndex,
        setActiveLocationLineIndex,

        // Handlers
        handleSubmit,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectLot,
        handleSelectWarehouse,
        handleSelectLocation,
        handleSelectLead,
        handleSelectAQ,
        handleFetchQuotation,
        onClose: handleCloseAttempt,
        blocker,
        readOnly: isReadOnly
    };
};
