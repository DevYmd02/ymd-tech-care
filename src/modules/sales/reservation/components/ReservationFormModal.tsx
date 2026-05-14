import { useState } from 'react';
import { Save, FileBox, Printer, Loader2 } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { WindowFormLayout } from '@ui';
import { ReservationHeaderForm } from './form/ReservationHeaderForm';
import { ReservationLineTable } from './form/ReservationLineTable';
import { ReservationSummary } from './form/ReservationSummary';
import { CustomerSearchModal } from './search-modals/CustomerSearchModal';
import { ProductSearchModal } from './search-modals/ProductSearchModal';
import { LeadSearchModal } from './search-modals/LeadSearchModal';
import { LotSearchModal } from './search-modals/LotSearchModal';
import { AQSearchModal } from './search-modals/AQSearchModal';
import { WarehouseSearchModal } from '@sales/shared/components/search-modals/WarehouseSearchModal';
import { LocationSearchModal } from '@sales/shared/components/search-modals/LocationSearchModal';
import { ConfirmationModal } from '@system/ConfirmationModal';

import { useReservationForm } from '../hooks/useReservationForm';
import { ReservationService } from '../services/reservation.service';
import type { ReservationFormData } from '../types/reservation.types';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@utils';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';

import { SalesFormSkeleton } from '@sales/shared/components/SalesFormSkeleton';

interface ReservationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: Partial<ReservationFormData>;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
    reservation_date: 'วันที่จอง',
    customer_id: 'ลูกค้า',
    branch_id: 'สาขา',
    currency_code: 'สกุลเงิน',
    emp_dept_id: 'แผนก',
    lines: 'รายการสินค้า'
};

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export function ReservationFormModal({ isOpen, onClose, id, initialData, onSuccess, readOnly }: ReservationFormModalProps) {
    const { toast } = useToast();
    const {
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
        // Search Modals State
        isCustomerSearchOpen,
        setIsCustomerSearchOpen,
        isProductSearchOpen,
        setIsProductSearchOpen,
        isLotSearchOpen,
        setIsLotSearchOpen,
        isLeadSearchOpen,
        setIsLeadSearchOpen,
        setActiveLineIndex,
        setActiveLotLineIndex,
        activeLotLineIndex,
        // Handlers
        handleSubmit,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectLot,
        handleSelectLead,
        handleSelectAQ,
        handleFetchQuotation,
        handleSelectWarehouse,
        handleSelectLocation,
        isAQSearchOpen,
        setIsAQSearchOpen,
        isWarehouseSearchOpen,
        setIsWarehouseSearchOpen,
        isLocationSearchOpen,
        setIsLocationSearchOpen,
        setActiveWarehouseLineIndex,
        setActiveLocationLineIndex,
        activeLocationLineIndex,
        activeWarehouseLineIndex,
        onClose: handleClose,
    } = useReservationForm(isOpen, id, initialData, onClose, readOnly);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<ReservationFormData | null>(null);
    const [searchType, setSearchType] = useState<'SQ' | 'AQ'>('AQ');


    const { setValue, watch } = methods;

    // Helper for search modals to avoid index errors
    const activeLotLine = activeLotLineIndex !== null ? (formData.lines || [])[activeLotLineIndex] : null;
    const activeLocationLine = activeLocationLineIndex !== null ? (formData.lines || [])[activeLocationLineIndex] : null;
    const activeWarehouseLine = activeWarehouseLineIndex !== null ? (formData.lines || [])[activeWarehouseLineIndex] : null;

    // Derived values for summary
    const selectedTaxCode = taxCodes.find(t => String(t.tax_code_id) === String(formData.tax_code_id));
    const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;

    const onFormSubmit = (data: ReservationFormData) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;
        setIsConfirmOpen(false);
        setIsSubmitting(true);
        logger.debug('Submitting Reservation:', pendingData);
        
        try {
            if (isEdit && id) {
                await ReservationService.update(id, pendingData);
                toast('อัปเดตใบสั่งจองสำเร็จ', 'success');
            } else {
                await ReservationService.create(pendingData);
                toast('สร้างใบสั่งจองสำเร็จ', 'success');
            }
            
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            logger.error('Submit reservation error:', error);
            
            let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง';
            const err = error as { response?: { data?: { message?: string | string[], error?: string } } };
            
            if (err?.response?.data?.message) {
                const backendMsg = err.response.data.message;
                if (Array.isArray(backendMsg)) {
                    errorMessage = `ข้อมูลไม่ถูกต้อง:\n${backendMsg.join('\n')}`;
                } else if (typeof backendMsg === 'string') {
                    errorMessage = `ข้อมูลไม่ถูกต้อง: ${backendMsg}`;
                }
            } else if (err?.response?.data?.error) {
                errorMessage = `เซิร์ฟเวอร์ปฏิเสธข้อมูล: ${err.response.data.error}`;
            }

            toast(
                <div className="whitespace-pre-line text-sm">{errorMessage}</div>,
                'error'
            );
        } finally {
            setIsSubmitting(false);
            setPendingData(null);
        }
    };


    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={isEdit ? 'แก้ไขรายละเอียดใบสั่งจองสินค้า (Sales Reservation)' : 'สร้างใบสั่งจองใหม่ (Create Sales Reservation)'}
            headerColor="bg-purple-600"
            footer={
                <ReservationFormFooter 
                    isEdit={isEdit}
                    isSubmitting={isSubmitting}
                    isLoading={isLoading}
                    readOnly={readOnly}
                    onClose={handleClose}
                />
            }
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <FileBox size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                {isLoading && !watch('reservation_no') ? (
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
                        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6 relative animate-form-fade-in">
                        <form 
                            id="reservation-form" 
                            onSubmit={handleSubmit(onFormSubmit, (errors) => {
                            logger.debug('Validation Errors:', errors);
                            const errorFields = Object.keys(errors)
                                .map(key => FIELD_LABELS[key] || key)
                                .join(', ');
                            toast(`กรุณาตรวจสอบข้อมูล: ${errorFields}`, 'error');
                        })} 
                        className="max-w-[1400px] mx-auto space-y-6"
                    >
                        
                        {/* 1. Header Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationHeaderForm 
                                     branches={branches}
                                     currencies={currencies}
                                     customers={customers}
                                     taxCodes={taxCodes}
                                     departments={departments}
                                     projects={projects}
                                     saleAreas={saleAreas}
                                     employees={employees}
                                     onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                     onSearchLead={() => setIsLeadSearchOpen(true)}
                                     onSearchSQ={() => { setSearchType('SQ'); setIsAQSearchOpen(true); }}
                                     onSearchAQ={() => { setSearchType('AQ'); setIsAQSearchOpen(true); }}
                                     onFetchQuotation={handleFetchQuotation}
                                     readOnly={readOnly}
                                 />

                            </div>
                        </div>

                        {/* 2. Line Items Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationLineTable 
                                    lines={formData.lines || []} 
                                    uoms={uoms}
                                    warehouses={warehouses}
                                    locations={locations}
                                    priceLevelNames={priceLevelNames}
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
                                    onSearchWarehouse={(index) => {
                                        setActiveWarehouseLineIndex(index);
                                        setIsWarehouseSearchOpen(true);
                                    }}
                                    onSearchLocation={(index) => {
                                        setActiveLocationLineIndex(index);
                                        setIsLocationSearchOpen(true);
                                    }}
                                    currencySymbol={formData.isMulticurrency ? (formData.base_currency_code || 'บาท') : 'บาท'}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>

                        {/* 3. Summary Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationSummary 
                                    subTotal={formData.sub_total}
                                    discountInput={formData.discount_input ?? undefined}
                                    discountAmount={formData.discount_amount}
                                    taxRate={taxRate}
                                    vatAmount={formData.vat_amount}
                                    totalAmount={formData.total_amount}
                                    currencySymbol={formData.isMulticurrency ? (formData.base_currency_code || 'บาท') : 'บาท'}
                                    lineCount={(formData.lines || []).length}
                                    onDiscountChange={(val) => setValue('discount_input', val, { shouldDirty: true })}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </form>
                    </div>
                </ErrorBoundary>
                )}
            {/* Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => !isSubmitting && setIsConfirmOpen(false)}
                onConfirm={handleConfirmSave}
                title="ยืนยันการบันทึก"
                description={`คุณต้องการยืนยันการ${isEdit ? 'อัปเดต' : 'สร้าง'}ใบสั่งจองนี้ใช่หรือไม่?`}
                confirmText="ยืนยันการบันทึก"
                cancelText="ยกเลิก"
                variant="info"
                isLoading={isSubmitting}
            />
            </FormProvider>

            {/* Modals */}
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

            <LeadSearchModal 
                isOpen={isLeadSearchOpen}
                onClose={() => setIsLeadSearchOpen(false)}
                onSelect={handleSelectLead}
            />

            <LotSearchModal
                isOpen={isLotSearchOpen}
                onClose={() => setIsLotSearchOpen(false)}
                onSelect={handleSelectLot}
                itemId={activeLotLine?.item_id}
                itemName={activeLotLine?.item_name || ''}
                itemCode={activeLotLine?.item_code || ''}
                warehouseId={activeLotLine?.warehouse_id || null}
                locationId={activeLotLine?.location_id || null}
            />

            <AQSearchModal 
                isOpen={isAQSearchOpen}
                onClose={() => setIsAQSearchOpen(false)}
                onSelect={handleSelectAQ}
                title={searchType === 'SQ' ? 'ค้นหาอ้างอิงใบเสนอราคา (SQ)' : 'ค้นหาใบเสนอราคาอนุมัติ (AQ) - Find Approved Quotation'}
                type={searchType}
            />

            <WarehouseSearchModal 
                isOpen={isWarehouseSearchOpen}
                onClose={() => setIsWarehouseSearchOpen(false)}
                onSelect={handleSelectWarehouse}
                warehouses={warehouses}
                itemId={activeWarehouseLine?.item_id}
                accentColor="purple"
            />

            <LocationSearchModal 
                isOpen={isLocationSearchOpen}
                onClose={() => setIsLocationSearchOpen(false)}
                warehouseId={activeLocationLine?.warehouse_id || null}
                onSelect={handleSelectLocation}
                locations={locations}
                itemId={activeLocationLine?.item_id}
                accentColor="purple"
            />

        </WindowFormLayout>
    );
}

interface ReservationFormFooterProps {
    isEdit: boolean;
    isSubmitting: boolean;
    isLoading: boolean;
    readOnly?: boolean;
    onClose: () => void;
}

function ReservationFormFooter({ isEdit, isSubmitting, isLoading, readOnly, onClose }: ReservationFormFooterProps) {
    return (
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
                    disabled={isSubmitting || isLoading}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                {!readOnly && (
                    <button 
                        type="submit" 
                        form="reservation-form"
                        disabled={isSubmitting || isLoading}
                        className="h-10 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {(isSubmitting || isLoading) ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างใบจอง'}
                    </button>
                )}
            </div>
        </div>
    );
}
