import { Save, FileBox, Printer, Loader2 } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { WindowFormLayout } from '@ui';
import { ReservationHeaderForm } from './ReservationHeaderForm';
import { ReservationLineTable } from './ReservationLineTable';
import { ReservationSummary } from './ReservationSummary';
import { CustomerSearchModal } from './CustomerSearchModal';
import { ProductSearchModal } from './ProductSearchModal';
import { LeadSearchModal } from './LeadSearchModal';
import { LotSearchModal } from './LotSearchModal';
import { AQSearchModal } from './AQSearchModal';
import { WarehouseSearchModal } from './WarehouseSearchModal';
import { LocationSearchModal } from './LocationSearchModal';

import { useReservationForm } from '../hooks/useReservationForm';
import type { ReservationFormData } from '../types/reservation.types';
import { logger } from '@utils/logger';

interface ReservationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: Partial<ReservationFormData>;
    onSuccess?: () => void;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export function ReservationFormModal({ isOpen, onClose, id, initialData, onSuccess }: ReservationFormModalProps) {
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
    } = useReservationForm(isOpen, id, initialData);


    const { setValue, getValues } = methods;

    // Derived values for summary
    const selectedTaxCode = taxCodes.find(t => String(t.tax_code_id) === String(formData.tax_code_id));
    const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;

    const onFormSubmit = async (data: ReservationFormData) => {
        setIsSubmitting(true);
        logger.debug('Submitting Reservation:', data);
        
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
                                    taxCodes={taxCodes}
                                    departments={departments}
                                    projects={projects}
                                    saleAreas={saleAreas}
                                    employees={employees}
                                    onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                    onSearchLead={() => setIsLeadSearchOpen(true)}
                                    onSearchAQ={() => setIsAQSearchOpen(true)}
                                    onFetchQuotation={handleFetchQuotation}
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
                                />
                            </div>
                        </div>

                        {/* 3. Summary Section */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <ReservationSummary 
                                    subTotal={formData.sub_total}
                                    discountInput={formData.discount_input}
                                    discountAmount={formData.discount_amount}
                                    taxRate={taxRate}
                                    vatAmount={formData.vat_amount}
                                    totalAmount={formData.total_amount}
                                    currencySymbol={formData.isMulticurrency ? (formData.base_currency_code || 'บาท') : 'บาท'}
                                    lineCount={(formData.lines || []).length}
                                    onDiscountChange={(val) => setValue('discount_input', val, { shouldDirty: true })}
                                />
                            </div>
                        </div>
                    </form>
                </div>
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
                itemId={activeLotLineIndex !== null ? getValues(`lines.${activeLotLineIndex}.item_id`) : undefined}
                warehouseId={activeLotLineIndex !== null ? getValues(`lines.${activeLotLineIndex}.warehouse_id`) : null}
                locationId={activeLotLineIndex !== null ? getValues(`lines.${activeLotLineIndex}.location_id`) : null}
            />

            <AQSearchModal 
                isOpen={isAQSearchOpen}
                onClose={() => setIsAQSearchOpen(false)}
                onSelect={handleSelectAQ}
            />

            <WarehouseSearchModal 
                isOpen={isWarehouseSearchOpen}
                onClose={() => setIsWarehouseSearchOpen(false)}
                onSelect={handleSelectWarehouse}
                warehouses={warehouses}
            />

            <LocationSearchModal 
                isOpen={isLocationSearchOpen}
                onClose={() => setIsLocationSearchOpen(false)}
                warehouseId={activeLocationLineIndex !== null ? getValues(`lines.${activeLocationLineIndex}.warehouse_id`) : null}
                onSelect={handleSelectLocation}
                locations={locations}
            />

        </WindowFormLayout>
    );
}
