import { useState, useEffect } from 'react';
import { Save, FileBox, Printer, Loader2 } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { WindowFormLayout } from '@ui';
import { MasterDataService } from '@/modules/master-data';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { TaxGroupService } from '@/modules/master-data/tax/services/tax-group.service';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';
import { SaleAreaService } from '@/modules/master-data/sales/pages/area/services/area.service';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { ReservationFormData, ReservationLineData } from '../types/reservation.types';
import { ReservationHeaderForm } from './ReservationHeaderForm';
import { ReservationLineTable } from './ReservationLineTable';
import { ReservationSummary } from './ReservationSummary';
import { CustomerSearchModal } from '@/modules/sales/quotation/components/CustomerSearchModal';
import { ProductSearchModal } from '@/modules/sales/quotation/components/ProductSearchModal';
import { LotSearchModal } from './LotSearchModal';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import type { LotNo } from '@/modules/master-data/inventory/types/inventory-master.types';

interface ReservationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: Partial<ReservationFormData>;
    onSuccess?: () => void;
}

const DEFAULT_FORM_DATA: ReservationFormData = {
    reservation_no: 'RS-AUTO',
    reservation_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    lead_id: '',
    branch_id: '',
    sq_id: '',
    currency_code: 'THB',
    isMulticurrency: false,
    base_currency_code: 'THB',
    quote_currency_code: 'THB',
    exchange_rate: 1,
    exchange_rate_date: new Date().toISOString().split('T')[0],
    ship_days: 0,
    status: 'DRAFT',
    remarks: '',
    payment_term_days: 0,
    sub_total: 0,
    discount_amount: 0,
    discount_input: '',
    vat_amount: 0,
    total_amount: 0,
    onhold: 'N',
    tax_group_id: '',
    item_id: '',
    emp_area_id: '',
    emp_dept_id: '',
    job_id: '',
    status_remark: '',
    ship_date: new Date().toISOString().split('T')[0],
    lines: []
};

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export function ReservationFormModal({ isOpen, onClose, id, initialData, onSuccess }: ReservationFormModalProps) {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search Modals State
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [activeLotLineIndex, setActiveLotLineIndex] = useState<number | null>(null);
    
    // React Hook Form Setup
    const methods = useForm<ReservationFormData>({
        defaultValues: initialData ? { ...DEFAULT_FORM_DATA, ...initialData } : DEFAULT_FORM_DATA,
        mode: 'onBlur',
    });

    const { setValue, handleSubmit, reset, control, getValues } = methods;
    const formData = (useWatch({ control }) || {}) as ReservationFormData;

    // Reset form when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            reset(initialData ? { ...DEFAULT_FORM_DATA, ...initialData } : DEFAULT_FORM_DATA);
        }
    }, [isOpen, initialData, reset]);

    // Data Fetching
    const { data: branches = [] } = useQuery({
        queryKey: ['master-branches'],
        queryFn: MasterDataService.getBranches,
        enabled: isOpen
    });

    const { data: currencies = [] } = useQuery({
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

    const { data: taxGroups = [] } = useQuery({
        queryKey: ['master-tax-groups'],
        queryFn: TaxGroupService.getTaxGroups,
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

    // Exchange Rate Sync Logic
    const sourceCurrency = useWatch({ control, name: 'base_currency_code' }) as string;
    const targetCurrency = useWatch({ control, name: 'quote_currency_code' }) as string;

    useEffect(() => {
        if (!sourceCurrency || !formData?.isMulticurrency) return;
        
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
    }, [currencies, sourceCurrency, targetCurrency, setValue, formData?.isMulticurrency]);
    
    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const uoms = uomResponse?.items || [];

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

    // Form Event Handlers
    const handleAddLine = () => {
        const newLine: ReservationLineData = { 
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
            note: '' 
        };
        setValue('lines', [...(getValues('lines') || []), newLine]);
    };

    const handleRemoveLine = (index: number) => {
        setValue('lines', (getValues('lines') || []).filter((_, i) => i !== index));
    };

    const handleLineChange = (index: number, field: keyof ReservationLineData, value: string | number) => {
        const newLines = [...(getValues('lines') || [])];
        const updatedLine = { ...newLines[index], [field]: value };
        
        // Auto-calculate line total
        if (field === 'qty_reserved' || field === 'unit_price' || field === 'line_discount_input') {
            const qty = Number(field === 'qty_reserved' ? value : updatedLine.qty_reserved) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            
            // Parse line discount
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
        setValue('lines', newLines);
    };

    const handleSelectCustomer = (customer: CustomerMaster) => {
        setValue('customer_id', String(customer.customer_id || customer.id || ''));
        setIsCustomerSearchOpen(false);
    };

    const handleSelectProduct = (product: ItemListItem) => {
        if (activeLineIndex !== null) {
            const newLines = [...(getValues('lines') || [])];
            const line = newLines[activeLineIndex];
            
            if (line) {
                line.item_id = String(product.item_id || product.id || '');
                line.item_code = product.item_code || '';
                line.item_name = product.item_name || '';
                
                // Map UOM
                const productUomId = product.uom_id || product.unit_id;
                const foundUom = uoms.find(u => String(u.id || u.unit_id) === String(productUomId));
                line.uom_id = foundUom ? String(foundUom.id || foundUom.unit_id) : 'PCS';
                
                line.unit_price = Number(product.standard_cost || 0);
                line.qty_reserved = 1; 
                line.line_total = line.unit_price;
                
                setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            }
        }
        setIsProductSearchOpen(false);
    };

    const handleSelectLot = (lot: LotNo) => {
        if (activeLotLineIndex !== null) {
            const newLines = [...(getValues('lines') || [])];
            if (newLines[activeLotLineIndex]) {
                newLines[activeLotLineIndex] = {
                    ...newLines[activeLotLineIndex],
                    lot_no: lot.code || '',
                    reserve_policy: 'MANUAL'
                };
                setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            }
            setIsLotSearchOpen(false);
        }
    };

    // Calculate Totals
    const subTotal = (formData.lines || []).reduce((sum, line) => sum + (line.line_total || 0), 0);
    
    // Parse Overall Discount
    const dInput = formData.discount_input || '';
    let calculatedDiscount = 0;
    if (dInput.endsWith('%')) {
        const percent = parseFloat(dInput.replace('%', '')) || 0;
        calculatedDiscount = subTotal * (percent / 100);
    } else {
        calculatedDiscount = dInput === '' ? 0 : (parseFloat(dInput) || 0);
    }

    const selectedTaxGroup = taxGroups.find(t => String(t.tax_group_id) === String(formData.tax_group_id));
    const taxRate = selectedTaxGroup ? (Number(selectedTaxGroup.tax_rate) || 0) : 0;
    const vatAmount = formData.tax_group_id ? (subTotal * (taxRate / 100)) : 0;
    const totalAmount = (subTotal + vatAmount) - calculatedDiscount;

    const onFormSubmit = async (data: ReservationFormData) => {
        setIsSubmitting(true);
        const finalData = { 
            ...data, 
            discount_amount: calculatedDiscount,
            sub_total: subTotal, 
            vat_amount: vatAmount, 
            total_amount: totalAmount 
        };
        logger.debug('Submitting Reservation:', finalData);
        
        await new Promise(r => setTimeout(r, 1000));
        
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
    };

    // Modal Footer
    const ModalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-4">
                {isEdit && (
                    <button 
                        type="button" 
                        className="h-10 px-6 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-sm font-bold flex items-center gap-2 border border-purple-200 dark:border-purple-800 transition-all"
                    >
                        <Printer size={18} />
                        พิมพ์ใบสั่งจอง
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                <button 
                    type="submit" 
                    form="reservation-form"
                    disabled={isSubmitting}
                    className="h-10 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างใบจอง'}
                </button>
            </div>
        </div>
    );

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'รายละเอียดใบสั่งจองสินค้า (Sales Reservation)' : 'สร้างใบสั่งจองใหม่ (Create Sales Reservation)'}
            headerColor="bg-purple-600"
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <FileBox size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
                    <form id="reservation-form" onSubmit={handleSubmit(onFormSubmit)} className="max-w-[1400px] mx-auto space-y-6">
                        
                        {/* 1. Header Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationHeaderForm 
                                    branches={branches}
                                    currencies={currencies}
                                    customers={customers}
                                    taxGroups={taxGroups}
                                    departments={departments}
                                    projects={projects}
                                    itemTypes={itemTypes}
                                    saleAreas={saleAreas}
                                    onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                />
                            </div>
                        </div>

                        {/* 2. Line Items Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationLineTable 
                                    lines={formData.lines} 
                                    uoms={uoms}
                                    warehouses={warehouses}
                                    locations={locations}
                                    onAddLine={handleAddLine} 
                                    onRemoveLine={handleRemoveLine}
                                    onLineChange={handleLineChange}
                                    onSearchProduct={(index) => {
                                        setActiveLineIndex(index);
                                        setIsProductSearchOpen(true);
                                    }}
                                    onSearchLot={(index) => {
                                        setActiveLotLineIndex(index);
                                        setIsLotSearchOpen(true);
                                    }}
                                />
                            </div>
                        </div>

                        {/* 3. Summary Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationSummary 
                                    subTotal={subTotal}
                                    discountInput={formData.discount_input}
                                    discountAmount={formData.discount_amount}
                                    taxRate={taxRate}
                                    vatAmount={vatAmount}
                                    totalAmount={totalAmount}
                                    currencySymbol={formData.isMulticurrency ? (formData.base_currency_code || 'บาท') : 'บาท'}
                                    lineCount={formData.lines.length}
                                    onDiscountChange={(val) => setValue('discount_input', val, { shouldDirty: true })}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </FormProvider>

            {/* Reuse search modals from Quotation module */}
            <CustomerSearchModal 
                isOpen={isCustomerSearchOpen}
                onClose={() => setIsCustomerSearchOpen(false)}
                onSelect={handleSelectCustomer}
            />

            <ProductSearchModal 
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={handleSelectProduct}
            />

            <LotSearchModal
                isOpen={isLotSearchOpen}
                onClose={() => setIsLotSearchOpen(false)}
                onSelect={handleSelectLot}
                itemId={activeLotLineIndex !== null ? getValues(`lines.${activeLotLineIndex}.item_id`) : undefined}
            />
        </WindowFormLayout>
    );
}
