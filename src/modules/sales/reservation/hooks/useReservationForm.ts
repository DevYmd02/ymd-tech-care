import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '@master-data';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { UnitService } from '@inventory/services/unit.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import { WarehouseService } from '@inventory/services/warehouse.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { SaleAreaService } from '@sales-master/pages/area/services/area.service';

import { QuotationService } from '@sales/quotation/services/quotation.service';
import type { QuotationFormData } from '@sales/quotation/types/quotation.types';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { toast } from 'react-hot-toast';
import { logger } from '@utils/logger';
import { 
    calculateDiscountAmount, 
    calculateVatAmount, 
    calculateNetTotal, 
    calculateLineTotal 
} from '@sales/shared/utils/sales-calculations';

import type { Currency } from '@master-data/types/master-data-types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem, UnitListItem } from '@inventory/types/product-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';
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



export const useReservationForm = (isOpen: boolean, id?: string, initialData?: Partial<ReservationFormValues>) => {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
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

    const { setValue, reset, control, getValues, handleSubmit } = methods;
    const formData = useWatch({ control }) as ReservationFormValues;

    // Initialization Guard
    const lastInitializedId = useRef<string | null | 'new'>(null);
    const defaultValues = useMemo(() => getReservationDefaultValues(), []);


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

    const { data: saleAreas = [] } = useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => SaleAreaService.getList(),
        enabled: isOpen
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['master-employees'],
        queryFn: MasterDataService.getEmployees,
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
    const warehouses = useMemo(() => warehouseResponse?.items || [], [warehouseResponse]);

    const { data: locationResponse } = useQuery({
        queryKey: ['master-locations'],
        queryFn: () => LocationService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const locations = useMemo(() => locationResponse?.items || [], [locationResponse]);

    const { data: priceLevelNames = [] } = useQuery({
        queryKey: ['master-price-level-names'],
        queryFn: MasterDataService.getPriceLevelNames,
        enabled: isOpen
    });

    // 🏗️ Initialization Guard: Wait for critical master data
    useEffect(() => {
        const currentTarget = id || 'new';

        const isMasterDataReady = (
            (branches?.length > 0 || !isOpen) && 
            (taxCodes?.length > 0 || !isOpen) && 
            (uoms?.length > 0 || !isOpen)
        );

        if (isOpen && !isMasterDataReady) {
            logger.debug('⏳ [ReservationForm] Waiting for master data...', {
                branches: branches?.length,
                taxCodes: taxCodes?.length,
                uoms: uoms?.length
            });
            return;
        }

        if (isOpen && lastInitializedId.current !== currentTarget) {
            reset(initialData ? { ...defaultValues, ...initialData } : defaultValues);
            lastInitializedId.current = currentTarget;
        } else if (!isOpen) {
            lastInitializedId.current = null;
        }
    }, [
        isOpen, 
        initialData, 
        reset, 
        defaultValues, 
        id, 
        branches?.length, 
        taxCodes?.length, 
        uoms?.length,
        currencies?.length
    ]);

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
    const watchedLines = useWatch({ control, name: 'lines' });
    const lines = useMemo(() => watchedLines || [], [watchedLines]);
    const watchedDiscountInput = useWatch({ control, name: 'discount_input' });
    const discountInput = watchedDiscountInput || '';
    const taxCodeId = useWatch({ control, name: 'tax_code_id' });

    useEffect(() => {
        const calculatedSubTotal = lines.reduce((sum: number, line: ReservationLineValues) => sum + (line.line_total || 0), 0);
        if (getValues('sub_total') !== calculatedSubTotal) {
            setValue('sub_total', calculatedSubTotal);
        }

        const calculatedDiscount = calculateDiscountAmount(calculatedSubTotal, discountInput);
        if (getValues('discount_amount') !== calculatedDiscount) {
            setValue('discount_amount', calculatedDiscount);
        }

        const amountAfterDiscount = calculatedSubTotal - calculatedDiscount;
        const safeTaxCodes = Array.isArray(taxCodes) ? taxCodes : [];
        const selectedTaxCode = safeTaxCodes.find(t => String(t.tax_code_id) === String(taxCodeId));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        
        // VAT should be calculated AFTER discount
        const vatAmountValue = calculateVatAmount(amountAfterDiscount, taxRate);
        if (getValues('vat_amount') !== vatAmountValue) {
            setValue('vat_amount', vatAmountValue);
        }

        const totalAmountValue = calculateNetTotal(calculatedSubTotal, calculatedDiscount, vatAmountValue);
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
        setValue('lines', (getValues('lines') || []).filter((_: unknown, i: number) => i !== index));
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
            
            const calculatedLD = calculateDiscountAmount(qty * price, ldInput);
            
            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = calculateLineTotal(qty, price, calculatedLD);
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
            const safeUoms = Array.isArray(uoms) ? uoms : [];
            const foundUom = safeUoms.find((u: UnitListItem) => 
                (productUomId && (String(u.id) === String(productUomId) || String(u.unit_id) === String(productUomId))) ||
                (productUomName && (u.unit_name?.trim() === productUomName?.trim() || u.uom_name?.trim() === productUomName?.trim()))
            );

            line.uom_id = foundUom ? String(foundUom.id || foundUom.unit_id) : String(productUomId || productUomName || 'PCS');
            line.unit_price = Number(product.standard_cost || 0);
            line.qty_reserved = 1; 
            line.line_discount_input = '';
            line.line_discount = 0;
            line.line_total = calculateLineTotal(line.qty_reserved, line.unit_price, line.line_discount);
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
        }
        setIsProductSearchOpen(false);
    }, [activeLineIndex, getValues, setValue, uoms]);

    const handleSelectLot = useCallback((lot: LotNo) => {
        if (activeLotLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeLotLineIndex]) return;

            const newLines = [...currentLines];
            const line = { ...newLines[activeLotLineIndex] };
            
            line.lot_id = lot.lot_no_id ? Number(lot.lot_no_id) : (lot.id ? Number(lot.id) : null);
            line.lot_no = lot.code || '';
            line.reserve_policy = 'MANUAL';

            // 💡 Auto-fill Warehouse/Location if they are empty
            if (!line.warehouse_id && lot.warehouse_id) {
                line.warehouse_id = String(lot.warehouse_id);
            }
            if (!line.location_id && lot.location_id) {
                line.location_id = String(lot.location_id);
            }

            newLines[activeLotLineIndex] = line;
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            setIsLotSearchOpen(false);
        }
    }, [activeLotLineIndex, getValues, setValue]);

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




    const handleFetchQuotation = useCallback(async (type: 'SQ' | 'AQ', overrideId?: string) => {
        const field = type === 'SQ' ? 'sq_id' : 'aq_id';
        const val = overrideId || getValues(field);

        
        if (!val) {
            toast.error(`กรุณาระบุเลขที่ ${type}`);
            return;
        }

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
                toast.error(`ไม่พบข้อมูล ${type} เลขที่ ${val}`);
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
                toast.error(`ไม่สามารถดึงข้อมูลรายละเอียดของ ${val} ได้`);
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

            // 3. Populate Header Fields
            if (detail.customer_id) setValue('customer_id', String(detail.customer_id), { shouldDirty: true });
            if (detail.branch_id) setValue('branch_id', String(detail.branch_id), { shouldDirty: true });
            
            // 5. Multicurrency & Currency Sync (Aggressive Discovery)
            const d = detail as unknown as DiscoveryLine;
            const ad = aqDetail as unknown as DiscoveryAQLine;
            const rd = ((detail as unknown) as Record<string, unknown>).rawData as Record<string, unknown> || {}; 

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
                        uom_id: String(qLine.uom_id || qLine.unit_id || 'PCS'),
                        unit_price: price,
                        lot_no: '',
                        line_discount_input: ldInput,
                        line_discount: calculatedLD,
                        reserve_policy: 'AUTO' as const,
                        line_total: calculateLineTotal(qtyToUse, price, calculatedLD),
                        tax_code_id: qLine.tax_code_id ? Number(qLine.tax_code_id) : (detail.tax_code_id ? Number(detail.tax_code_id) : undefined),
                        note: String(qLine.note || ''),
                        price_source: qLine.price_source !== undefined ? Number(qLine.price_source) : undefined,
                        price_source_name: String(qLine.price_source_name || ''),
                        price_level_priority: qLine.price_level_priority !== undefined ? Number(qLine.price_level_priority) : (qLine.priority !== undefined ? Number(qLine.priority) : undefined),
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
                
                setValue('lines', finalLines, { shouldDirty: true, shouldValidate: true });
            }

            toast.success(`ซิงค์ข้อมูลจาก ${val} สำเร็จ`);
        } catch {
            toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setIsSubmitting(false);
        }
    }, [getValues, setValue, setIsSubmitting]);

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
        saleAreas,
        employees,
        uoms,
        warehouses,
        locations,
        priceLevelNames,
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
    };
};
