import { FileText, Trash2, XCircle } from 'lucide-react';
import { useRFQForm } from '@/modules/procurement/pages/rfq/hooks';
import { RFQFormHeader } from './RFQFormHeader';
import { RFQFormLines } from './RFQFormLines';
import { RFQVendorSelection } from './RFQVendorSelection';
import { VendorDispatchTable } from './VendorDispatchTable';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { PRSourceSelectionModal } from './PRSourceSelectionModal';
import { WindowFormLayout } from '@ui';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import type { PRHeader } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: string | null;
    initialPR?: PRHeader | null;
    readOnly?: boolean;
    isInviteMode?: boolean;
}

export const RFQFormModal = ({ isOpen, onClose, onSuccess, initialPR, editId, readOnly = false, isInviteMode = false }: Props) => {
    const {
        formData, errors, isSaving, activeTab, setActiveTab, trackingVendors,
        branches,
        
        handleChange, handleLineChange, handleResetLines, handleRemoveLine,
        handleSave, 
        originalLinesCount,

        // PR Logic
        isPRSelectionModalOpen, setIsPRSelectionModalOpen, handlePRSelect,

        // Vendor Props
        isVendorModalOpen, setIsVendorModalOpen,
        handleAddVendor, handleRemoveVendor,
        handleOpenVendorModal, handleVendorSelect
    } = useRFQForm(isOpen, onClose, initialPR, onSuccess, editId);

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
                        {!readOnly && !isInviteMode && (formData.status === 'SENT' || formData.status === 'IN_PROGRESS') && editId && (
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
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-6 py-2 text-white rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50 ${isInviteMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                            >
                                {isInviteMode ? 'บันทึกผู้ขายที่ส่งเพิ่ม' : 'บันทึก'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-6 p-4">
                <div className={cardClass}>
                    <RFQFormHeader 
                        formData={formData} 
                        branches={branches} 
                        handleChange={handleChange}
                        errors={errors}
                        onOpenPRModal={() => setIsPRSelectionModalOpen(true)}
                        readOnly={readOnly}
                        isInviteMode={isInviteMode}
                    />
                </div>

                <div className={cardClass}>
                    <RFQFormLines 
                        lines={formData.lines} 
                        handleLineChange={handleLineChange}
                        handleRemoveLine={handleRemoveLine}
                        handleResetLines={handleResetLines}
                        originalLinesCount={originalLinesCount}
                        readOnly={readOnly}
                        isInviteMode={isInviteMode}
                    />
                </div>

                {/* Vendor Logic Restored */}
                <div className={cardClass}>
                    {(!!formData.status && formData.status !== 'DRAFT' && !isInviteMode) ? (
                        <VendorDispatchTable vendors={trackingVendors} />
                    ) : (
                        <RFQVendorSelection  
                            vendors={formData.vendors}
                            onAdd={handleAddVendor}
                            onRemove={handleRemoveVendor}
                            handleOpenVendorModal={handleOpenVendorModal}
                            isViewMode={readOnly}
                            isInviteMode={isInviteMode}
                        />
                    )}
                </div>

                <SharedRemarksTab
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    remarks={formData.remarks}
                    onRemarksChange={(val: string) => handleChange('remarks', val)}
                    readOnly={readOnly}
                />
            </div>


            {/* Vendor Search Modal */}
            <VendorSearchModal 
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
            />

            {/* PR Selection Modal */}
            <PRSourceSelectionModal
                isOpen={isPRSelectionModalOpen}
                onClose={() => setIsPRSelectionModalOpen(false)}
                onSelect={handlePRSelect}
            />
        </WindowFormLayout>
    );
};

export { RFQFormModal as default };