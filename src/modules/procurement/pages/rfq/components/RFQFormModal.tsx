import { FileText, Trash2, XCircle } from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { useRFQForm } from '@/modules/procurement/pages/rfq/hooks';
import { RFQFormHeader } from './RFQFormHeader';
import { RFQFormLines } from './RFQFormLines';
import { RFQVendorSelection } from './RFQVendorSelection';
import { VendorDispatchTable } from './VendorDispatchTable';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { PRSourceSelectionModal } from './PRSourceSelectionModal';
import { ApprovedPRSelectionModal } from './ApprovedPRSelectionModal';
import { WindowFormLayout } from '@ui';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import type { PRHeader } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { CancelVendorModal } from './CancelVendorModal';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: number | null;
    initialPR?: PRHeader | null;
    readOnly?: boolean;
    isInviteMode?: boolean;
}

export const RFQFormModal = ({ isOpen, onClose, onSuccess, initialPR, editId, readOnly = false, isInviteMode = false }: Props) => {
    const {
        methods, isSaving, activeTab, setActiveTab, trackingVendors,
        branches, currencies,
        
        onRequestSave, 
        isConfirmOpen, handleCancelConfirm, executeSave,

        // PR Logic
        isPRSelectionModalOpen, setIsPRSelectionModalOpen, handlePRSelect,
        isApprovedPRModalOpen, setIsApprovedPRModalOpen, handleApprovedPRSelect,

        // Vendor Props
        isVendorModalOpen, setIsVendorModalOpen,
        handleAddVendor, handleRemoveVendor,
        handleOpenVendorModal, handleVendorSelect,
        vendors,

        // Cancel Vendor
        isCancelModalOpen, setIsCancelModalOpen,
        cancelVendorIndex, setCancelVendorIndex,
        handleCancelVendor,

    } = useRFQForm(isOpen, onClose, initialPR, onSuccess, editId);

    const [isCancelling, setIsCancelling] = useState(false);

    const { watch, setValue } = methods;
    const formData = watch(); // Watch all for UI reactivity in modal wrapper

    // Setup safe sent list mapping
    const vendorsSentList = (trackingVendors || []).filter(
        v => v.sent_date || v.status === 'SENT' || v.status === 'RESPONDED'
    );

    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm';

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={readOnly ? "ดูใบขอเสนอราคา (View RFQ)" : (isInviteMode && editId ? `ส่งใบเสนอราคาเพิ่ม (${formData.rfq_no})` : (editId ? `แก้ไขใบขอเสนอราคา (${formData.rfq_no})` : "สร้างใบขอเสนอราคา (RFQ)"))}
            titleIcon={<div className="bg-white/20 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} /></div>}
            headerColor={readOnly ? "bg-gray-600" : (isInviteMode ? "bg-blue-600" : "bg-teal-600")}
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                    <div className="flex items-center gap-2">
                        {/* Destructive Actions - Hide in ReadOnly mode usually, or keep if relevant? Prompt implies ReadOnly is for View. */}
                        {!readOnly && !isInviteMode && formData.status === 'DRAFT' && editId && (
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                onClick={() => logger.warn('[RFQFormModal] Delete RFQ — not yet implemented:', editId)}
                                title="ลบเอกสาร"
                            >
                                <Trash2 size={16} />
                                <span className="hidden sm:inline">ลบเอกสาร</span>
                            </button>
                        )}
                        {!readOnly && !isInviteMode && (formData.status === 'SENT') && editId && (
                            <button
                                type="button"
                                className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm font-medium transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                onClick={() => logger.warn('[RFQFormModal] Cancel RFQ — not yet implemented:', editId)}
                                title="ยกเลิก RFQ"
                            >
                                <XCircle size={16} />
                                <span className="hidden sm:inline">ยกเลิก RFQ</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            ปิดหน้าต่าง
                        </button>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={onRequestSave}
                                disabled={isSaving || methods.formState.isSubmitting}
                                className={`px-6 py-2 text-white rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 ${isInviteMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                            >
                                {isInviteMode ? 'บันทึกผู้ขายที่ส่งเพิ่ม' : 'บันทึก'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <FormProvider {...methods}>
                <div className="space-y-6 p-4">
                    <div className={cardClass}>
                        <RFQFormHeader 
                            branches={branches} 
                            currencies={currencies}
                            onOpenPRModal={() => setIsPRSelectionModalOpen(true)}
                            onOpenApprovedPRModal={() => setIsApprovedPRModalOpen(true)}
                            readOnly={readOnly}
                            isInviteMode={isInviteMode}
                        />
                    </div>

                    <div className={cardClass}>
                        <RFQFormLines 
                            readOnly={readOnly}
                            isInviteMode={isInviteMode}
                        />
                    </div>

                    {/* Vendor Logic Restored */}
                    <div className={cardClass}>
                        {/* 1. Dispatch Summary Section (Only shows in View Mode if emails were sent) */}
                        {readOnly && vendorsSentList.length > 0 && (
                            <div className="mb-6">
                                <VendorDispatchTable vendors={vendorsSentList} />
                            </div>
                        )}

                        {/* 2. Standard Vendor List (ALWAYS visible) */}
                        <RFQVendorSelection  
                            vendors={vendors}
                            onAdd={handleAddVendor}
                            onRemove={handleRemoveVendor}
                            handleOpenVendorModal={handleOpenVendorModal}
                            isViewMode={readOnly}
                            onCancelVendor={(index: number) => {
                                setCancelVendorIndex(index);
                                setIsCancelModalOpen(true);
                            }}
                        />
                    </div>

                    <SharedRemarksTab
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        remarks={formData.remarks}
                        onRemarksChange={(val: string) => setValue('remarks', val)}
                        readOnly={readOnly}
                    />
                </div>
            </FormProvider>


            {/* Vendor Search Modal */}
            <VendorSearchModal 
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
                excludeIds={formData.vendors?.map(v => Number(v.vendor_id)).filter(id => !isNaN(id))}
            />

            {/* PR Selection Modal */}
            <PRSourceSelectionModal
                isOpen={isPRSelectionModalOpen}
                onClose={() => setIsPRSelectionModalOpen(false)}
                onSelect={handlePRSelect}
            />

            {/* Approved PR Selection Modal */}
            <ApprovedPRSelectionModal
                isOpen={isApprovedPRModalOpen}
                onClose={() => setIsApprovedPRModalOpen(false)}
                onSelect={handleApprovedPRSelect}
                prNo={formData.pr_no || null}
            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={handleCancelConfirm}
                onConfirm={executeSave}
                title="ยืนยันการบันทึก"
                description={editId ? "ต้องการบันทึกการแก้ไขเอกสารใช่หรือไม่?" : "ต้องการบันทึกการสร้างเอกสารใช่หรือไม่?"}
                confirmText="บันทึก"
                cancelText="ยกเลิก"
                variant="info"
                isLoading={isSaving}
            />

            <CancelVendorModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={async (remark) => {
                    if (cancelVendorIndex === null) return;
                    setIsCancelling(true);
                    const success = await handleCancelVendor(cancelVendorIndex, remark);
                    setIsCancelling(false);
                    if (success) {
                        setIsCancelModalOpen(false);
                    }
                }}
                isLoading={isCancelling}
            />
        </WindowFormLayout>
    );
};

export { RFQFormModal as default };