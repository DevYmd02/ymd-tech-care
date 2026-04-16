import { useState, useEffect } from 'react';
import { Save, FileText, Printer, Loader2 } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { MasterDataService } from '@/modules/master-data';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { TaxGroupService } from '@/modules/master-data/tax/services/tax-group.service';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { QuotationFormData, QuotationLineData } from '../types/quotation.types';
import { QuotationHeaderForm } from './QuotationHeaderForm';
import { QuotationLineTable } from './QuotationLineTable';
import { QuotationSummary } from './QuotationSummary';
import { CustomerSearchModal } from './CustomerSearchModal';
import { ProductSearchModal } from './ProductSearchModal';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';

interface QuotationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: Partial<QuotationFormData>;
    onSuccess?: () => void;
}

const DEFAULT_FORM_DATA: QuotationFormData = {
    sq_no: 'SQ2024-xxx',
    sq_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    lead_id: '',
    branch_id: '',
    currency_code: 'THB',
    isMulticurrency: false,
    base_currency_code: 'THB',
    quote_currency_code: 'THB',
    exchange_rate: 1,
    exchange_rate_date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    valid_until: '',
    payment_term_days: 0,
    ship_date: '',
    tax_group_id: '',
    item_id: '',
    emp_area_id: '',
    emp_dept_id: '',
    job_id: '',
    onhold: 'N',
    remarks: '',
    sq_status: '',
    status_remark: '',
    discount_input: '',
    discount_amount: 0,
    sub_total: 0,
    vat_amount: 0,
    total_amount: 0,
    lines: []
};

// ====================================================================================
// CONSTANTS
// ====================================================================================
const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export function QuotationFormModal({ isOpen, onClose, id, initialData, onSuccess }: QuotationFormModalProps) {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search Modals State
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    
    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<QuotationFormData | null>(null);
    
    // React Hook Form Setup
    const methods = useForm<QuotationFormData>({
        defaultValues: initialData ? { ...DEFAULT_FORM_DATA, ...initialData } : DEFAULT_FORM_DATA,
        mode: 'onBlur',
    });

    const { setValue, handleSubmit, reset, control } = methods;
    const formData = (useWatch({ control }) || {}) as QuotationFormData;

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
    
    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const uoms = uomResponse?.items || [];

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

    const handleAddLine = () => {
        const newLine: QuotationLineData = { 
            item_id: '', 
            item_code: '', 
            item_name: '', 
            qty: 0, 
            uom_id: 'PCS', 
            unit_price: 0, 
            line_discount_input: '',
            line_discount: 0, 
            line_total: 0, 
            tax_code_id: '',
            note: '' 
        };
        setValue('lines', [...(formData.lines || []), newLine]);
    };

    const handleRemoveLine = (index: number) => {
        setValue('lines', (formData.lines || []).filter((_, i) => i !== index));
    };

    const handleLineChange = (index: number, field: keyof QuotationLineData, value: string | number) => {
        const newLines = [...(formData.lines || [])];
        const updatedLine = { ...newLines[index], [field]: value };
        
        if (field === 'qty' || field === 'unit_price' || field === 'line_discount' || field === 'line_discount_input') {
            const qty = Number(field === 'qty' ? value : updatedLine.qty) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            
            // Parse line discount
            const ldInput = (field === 'line_discount_input' ? (value as string) : updatedLine.line_discount_input) || '';
            let calculatedLD = 0;
            if (ldInput.endsWith('%')) {
                const percent = parseFloat(ldInput.replace('%', '')) || 0;
                calculatedLD = (qty * price) * (percent / 100);
            } else {
                calculatedLD = parseFloat(ldInput) || Number(field === 'line_discount' ? value : updatedLine.line_discount) || 0;
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
            const newLines = [...(formData.lines || [])];
            const line = newLines[activeLineIndex];
            
            if (line) {
                line.item_id = String(product.item_id || product.id || '');
                line.item_code = product.item_code || '';
                line.item_name = product.item_name || '';
                
                // Map UOM: Find the correct ID from the uoms list
                const productUomId = product.uom_id || product.unit_id;
                const productUomName = product.uom_name || product.base_uom_name || product.unit_name;
                
                const foundUom = uoms.find(u => 
                    (productUomId && (u.id === productUomId || u.unit_id === productUomId)) ||
                    (productUomName && (u.unit_name === productUomName || u.uom_name === productUomName))
                );

                if (foundUom) {
                    line.uom_id = String(foundUom.id || foundUom.unit_id);
                } else {
                    line.uom_id = String(productUomId || productUomName || 'PCS');
                }
                
                line.unit_price = Number(product.standard_cost || 0);
                line.qty = 1; // Default to 1 on select
                line.line_discount_input = '';
                line.line_discount = 0;
                line.line_total = line.unit_price; // Initial total
                
                setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            }
        }
        setIsProductSearchOpen(false);
    };

    // Calculate Totals
    const subTotal = (formData.lines || []).reduce((sum, line) => sum + (line.line_total || 0), 0);
    
    // Parse Discount
    const dInput = formData.discount_input || '';
    let calculatedDiscount = 0;
    if (dInput.endsWith('%')) {
        const percent = parseFloat(dInput.replace('%', '')) || 0;
        calculatedDiscount = subTotal * (percent / 100);
    } else {
        calculatedDiscount = dInput === '' ? 0 : (parseFloat(dInput) || Number(formData.discount_amount) || 0);
    }

    const selectedTaxGroup = taxGroups.find(t => String(t.tax_group_id) === String(formData.tax_group_id));
    const taxRate = selectedTaxGroup ? (Number(selectedTaxGroup.tax_rate) || 0) : 0;
    
    // Calculate VAT only if a tax group is selected
    const vatAmount = formData.tax_group_id ? (subTotal * (taxRate / 100)) : 0;
    const totalAmount = (subTotal + vatAmount) - calculatedDiscount;

    const onFormSubmit = (data: QuotationFormData) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;
        
        setIsSubmitting(true);

        const finalData = { 
            ...pendingData, 
            discount_amount: calculatedDiscount,
            sub_total: subTotal, 
            vat_amount: vatAmount, 
            total_amount: totalAmount 
        };
        logger.debug('Submitting Quotation:', finalData);
        
        // Mock API Call
        await new Promise(r => setTimeout(r, 1000));
        
        setIsSubmitting(false);
        setIsConfirmOpen(false);
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
                        className="h-10 px-6 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm font-bold flex items-center gap-2 border border-blue-200 dark:border-blue-800 transition-all"
                    >
                        <Printer size={18} />
                        พิมพ์ใบเสนอราคา
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
                    {isEdit ? 'ปิด' : 'ยกเลิก'}
                </button>
                <button 
                    type="submit" 
                    form="quotation-form"
                    disabled={isSubmitting}
                    className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
            </div>
        </div>
    );

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'รายละเอียดใบเสนอราคา (VIEW Sales Quotation)' : 'สร้างใบเสนอราคาใหม่ (CREATE Sales Quotation)'}
            headerColor="bg-blue-600"
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <FileText size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
                    <form id="quotation-form" onSubmit={handleSubmit(onFormSubmit)} className="max-w-[1400px] mx-auto space-y-6">
                        
                        {/* 1. Header Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationHeaderForm 
                                    branches={branches}
                                    currencies={currencies}
                                    customers={customers}
                                    taxGroups={taxGroups}
                                    departments={departments}
                                    projects={projects}
                                    itemTypes={itemTypes}
                                    onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                />
                            </div>
                        </div>

                        {/* 2. Line Items Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationLineTable 
                                    lines={formData.lines} 
                                    uoms={uoms}
                                    onAddLine={handleAddLine} 
                                    onRemoveLine={handleRemoveLine}
                                    onLineChange={handleLineChange}
                                    onSearchProduct={(index) => {
                                        setActiveLineIndex(index);
                                        setIsProductSearchOpen(true);
                                    }}
                                />
                            </div>
                        </div>

                        {/* 3. Summary Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationSummary 
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

            {/* Local Search Modals */}
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

            <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => !isSubmitting && setIsConfirmOpen(false)}
                onConfirm={handleConfirmSave}
                title="ยืนยันการบันทึกข้อมูล"
                description="คุณต้องการบันทึกข้อมูลใบเสนอราคานี้ใช่หรือไม่?"
                confirmText="ยืนยันการบันทึก"
                cancelText="ยกเลิก"
                variant="info"
                isLoading={isSubmitting}
            />
        </WindowFormLayout>
    );
}
