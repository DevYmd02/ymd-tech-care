import { FileText, Printer, Save, Loader2 } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { QuotationHeaderForm } from './QuotationHeaderForm';
import { QuotationLineTable } from './QuotationLineTable';
import { QuotationSummary } from './QuotationSummary';
import { CustomerSearchModal } from './CustomerSearchModal';
import { ProductSearchModal } from './ProductSearchModal';
import { LeadSearchModal } from './LeadSearchModal';
import { useQuotationForm } from '@sales/quotation/hooks/useQuotationForm';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import { logger } from '@utils';
import { useToast } from '@ui/feedback/Toast';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import type { QuotationHeader } from '@sales/quotation/types/quotation.types';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';

interface QuotationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: QuotationHeader;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

import { SalesFormSkeleton } from '@sales/shared/components/SalesFormSkeleton';

export function QuotationFormModal({ isOpen, onClose, id, initialData, onSuccess, readOnly = false }: QuotationFormModalProps) {
    const { toast } = useToast();
    // 🏗️ Use custom hook for all business logic
    const {
        isEdit,
        isSubmitting,
        setIsSubmitting,
        methods,
        formData,
        // Master Data
        branches,
        currencies,
        customers,
        selectedCustomer,
        taxCodes,
        departments,
        projects,
        saleAreas,
        employees,
        uoms,
        // Search Modals State
        isCustomerSearchOpen,
        setIsCustomerSearchOpen,
        isLeadSearchOpen,
        setIsLeadSearchOpen,
        isProductSearchOpen,
        setIsProductSearchOpen,
        activeLineIndex,
        setActiveLineIndex,
        // Confirmation State
        isConfirmOpen,
        setIsConfirmOpen,
        pendingData,
        setPendingData,
        // Handlers
        handleSubmit,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectLead,
        handleSelectProduct,
        handleLinePriceSync,
        loadingPriceLines,
        isLoadingDetail,
        priceLevelNames,
        onInvalidSubmit,
        onClose: handleClose,
    } = useQuotationForm(isOpen, onClose, id, initialData, readOnly);

    const { setValue, watch } = methods;

    // 💾 Form Submission Handler
    const onFormSubmit = (data: QuotationFormValues) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;
        
        setIsSubmitting(true);
        try {
            logger.debug('💾 [QuotationForm] Submitting Data:', pendingData);
            
            // 🔄 Unified Flow: Automatically resubmit rejected quotations
            const finalData = { ...pendingData };
            if (finalData.status === 'REJECTED') {
                finalData.status = 'PENDING';
            }

            if (isEdit && id) {
                await QuotationService.update(id, finalData);
            } else {
                await QuotationService.create(finalData);
            }
            
            setIsConfirmOpen(false);
            onSuccess?.();
            toast(`บันทึกใบเสนอราคา ${isEdit ? 'สำเร็จ' : 'เรียบร้อยแล้ว'}`, 'success');
            onClose();
        } catch (error) {
            logger.error('💥 [QuotationForm] Save Failed:', error);
            toast('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาตรวจสอบอีกครั้ง', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 🎨 UI Logic for Calculations (to be passed to components)
    const selectedTaxCode = taxCodes.find(t => String(t.tax_code_id) === String(formData.tax_code_id));
    const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;

    // 🛠️ Modal Footer Component
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
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    {isEdit ? 'ปิด' : 'ยกเลิก'}
                </button>
                {!readOnly && (
                    <button 
                        type="submit" 
                        form="quotation-form"
                        disabled={isSubmitting}
                        className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEdit 
                            ? (formData.status === 'REJECTED' ? 'บันทึกและส่งอนุมัติใหม่' : 'บันทึกการแก้ไข') 
                            : 'บันทึกข้อมูล'
                        }
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={readOnly ? 'รายละเอียดใบเสนอราคา (VIEW Sales Quotation)' : (isEdit ? 'แก้ไขใบเสนอราคา (EDIT Sales Quotation)' : 'สร้างใบเสนอราคาใหม่ (CREATE Sales Quotation)')}
            headerColor={readOnly ? 'bg-slate-600' : 'bg-blue-600'}
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <FileText size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                {isLoadingDetail && !watch('sq_no') ? (
                    <SalesFormSkeleton />
                ) : (
                    <ErrorBoundary>
                        <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes formFadeIn {
                                from { opacity: 0; transform: translateY(8px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .animate-form-fade-in {
                                animation: formFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                            }
                        `}} />
                        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6 animate-form-fade-in">
                        <form id="quotation-form" onSubmit={handleSubmit(onFormSubmit, onInvalidSubmit)} className="w-full space-y-6">
                            
                            {/* 1. Header Section */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <QuotationHeaderForm 
                                    branches={branches}
                                    currencies={currencies}
                                    customers={customers}
                                    selectedCustomer={selectedCustomer}
                                    taxCodes={taxCodes}
                                    departments={departments}
                                    projects={projects}
                                    saleAreas={saleAreas}
                                    employees={employees}
                                    onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                    onSearchLead={() => setIsLeadSearchOpen(true)}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>

                        {/* 2. Line Items Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationLineTable 
                                    uoms={uoms}
                                    priceLevelNames={priceLevelNames}
                                    onAddLine={handleAddLine} 
                                    onRemoveLine={handleRemoveLine}
                                    onLineChange={handleLineChange}
                                    onQtyBlur={handleLinePriceSync}
                                    loadingPriceLines={loadingPriceLines}
                                    onSearchProduct={(index) => {
                                        setActiveLineIndex(index);
                                        setIsProductSearchOpen(true);
                                    }}
                                    readOnly={readOnly}
                                    currencySymbol={formData.base_currency_code || formData.currency_code || 'บาท'}
                                />
                            </div>
                        </div>

                        {/* 3. Summary Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <QuotationSummary 
                                    subTotal={watch('sub_total') || 0}
                                    discountInput={watch('discount_expression')}
                                    discountAmount={watch('discount_amount') || 0}
                                    taxRate={taxRate}
                                    vatAmount={watch('vat_amount') || 0}
                                    totalAmount={watch('total_amount') || 0}
                                    currencySymbol={watch('base_currency_code') || watch('currency_code') || 'บาท'}
                                    lineCount={watch('lines')?.length || 0}
                                    onDiscountChange={(val) => setValue('discount_expression', val, { shouldValidate: true, shouldDirty: true })}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                    </form>
                </div>
                </ErrorBoundary>
                )}
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
                onSelect={(product) => {
                    if (activeLineIndex !== null) {
                        handleSelectProduct(activeLineIndex, product);
                    }
                    setIsProductSearchOpen(false);
                }}
            />

            <LeadSearchModal 
                isOpen={isLeadSearchOpen}
                onClose={() => setIsLeadSearchOpen(false)}
                onSelect={handleSelectLead}
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
