import { useState, useEffect } from 'react';
import { Save, FileText, Printer, Loader2 } from 'lucide-react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { WindowFormLayout } from '@ui';
import { MasterDataService } from '@/modules/master-data';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { TaxGroupService } from '@/modules/master-data/tax/services/tax-group.service';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { QuotationFormData, QuotationLineData } from '../types/quotation.types';
import { QuotationHeaderForm } from './QuotationHeaderForm';
import { QuotationLineTable } from './QuotationLineTable';
import { QuotationSummary } from './QuotationSummary';

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
            item_name: '', 
            qty: 0, 
            uom_id: 'PCS', 
            unit_price: 0, 
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
        
        if (field === 'qty' || field === 'unit_price' || field === 'line_discount') {
            const qty = Number(field === 'qty' ? value : updatedLine.qty) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            const disc = Number(field === 'line_discount' ? value : updatedLine.line_discount) || 0;
            updatedLine.line_total = (qty * price) - disc;
        }
        
        newLines[index] = updatedLine;
        setValue('lines', newLines);
    };

    // Calculate Totals
    const subTotal = (formData.lines || []).reduce((sum, line) => sum + (line.line_total || 0), 0);
    const vatAmount = subTotal * 0.07;
    const totalAmount = (subTotal + vatAmount) - (formData.discount_amount || 0);

    const onFormSubmit = async (data: QuotationFormData) => {
        setIsSubmitting(true);
        console.log('Submitting Quotation:', { ...data, sub_total: subTotal, vat_amount: vatAmount, total_amount: totalAmount });
        
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
                                />
                            </div>
                        </div>

                        {/* 2. Line Items Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationLineTable 
                                    lines={formData.lines} 
                                    onAddLine={handleAddLine} 
                                    onRemoveLine={handleRemoveLine}
                                    onLineChange={handleLineChange}
                                />
                            </div>
                        </div>

                        {/* 3. Summary Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationSummary 
                                    subTotal={subTotal}
                                    discountAmount={formData.discount_amount}
                                    vatAmount={vatAmount}
                                    totalAmount={totalAmount}
                                    lineCount={formData.lines.length}
                                    onDiscountChange={(val) => setValue('discount_amount', val)}
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </FormProvider>
        </WindowFormLayout>
    );
}
