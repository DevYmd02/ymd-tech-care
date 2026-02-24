import { FileText, Info, MoreHorizontal, Star, AlignLeft, History, Trash2, XCircle } from 'lucide-react';
import { useRFQForm } from '@/modules/procurement/hooks/rfq';
import { RFQFormHeader } from './RFQFormHeader';
import { RFQFormLines } from './RFQFormLines';
import { RFQVendorSelection } from './RFQVendorSelection';
import { VendorDispatchTable } from './VendorDispatchTable';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { PRSelectionModal } from '@/modules/procurement/components/selector/PRSelectionModal';
import { WindowFormLayout, TabPanel } from '@ui';
import type { PRHeader } from '@/modules/procurement/types/pr-types';

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

    const tabs = [
        { id: 'detail', label: 'Detail', icon: <Info size={16} /> },
        { id: 'more', label: 'More', icon: <MoreHorizontal size={16} /> },
        { id: 'rate', label: 'Rate', icon: <Star size={16} /> },
        { id: 'description', label: 'Description', icon: <AlignLeft size={16} /> },
        { id: 'history', label: 'History', icon: <History size={16} /> },
    ];

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
                                onClick={() => console.log('Delete RFQ', editId)}
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
                                onClick={() => console.log('Cancel RFQ', editId)}
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

                <div className={cardClass}>
                    <div className="p-4">
                        <TabPanel tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} variant="underline">
                            {activeTab === 'detail' && (
                                <div className="space-y-3">
                                    <textarea
                                        placeholder="กรอกหมายเหตุเพิ่มเติม..."
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white resize-none"
                                        value={formData.remarks}
                                        onChange={(e) => handleChange('remarks', e.target.value)}
                                    />
                                </div>
                            )}
                            {['more', 'rate', 'description', 'history'].includes(activeTab) && (
                                <div className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                                    {tabs.find(t => t.id === activeTab)?.label} (พร้อมใช้งานเร็วๆ นี้)
                                </div>
                            )}
                        </TabPanel>
                    </div>
                </div>
            </div>


            {/* Vendor Search Modal */}
            <VendorSearchModal 
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
            />

            {/* PR Selection Modal */}
            <PRSelectionModal
                isOpen={isPRSelectionModalOpen}
                onClose={() => setIsPRSelectionModalOpen(false)}
                onSelect={handlePRSelect}
            />
        </WindowFormLayout>
    );
};

export { RFQFormModal as default };

