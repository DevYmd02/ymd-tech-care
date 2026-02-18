import React from 'react';
import { FileText, Info, MoreHorizontal, Star, AlignLeft, History, Search } from 'lucide-react';
import { useRFQForm } from '@/modules/procurement/hooks/useRFQForm';
import { RFQFormHeader } from './RFQFormHeader';
import { RFQFormLines } from './RFQFormLines';
import { RFQVendorSelection } from './RFQVendorSelection';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { WindowFormLayout, TabPanel, ModalLayout } from '@ui';
import type { PRHeader } from '@/modules/procurement/types/pr-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: string | null;
    initialPR?: PRHeader | null;
}

export const RFQFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialPR }) => {
    const {
        formData, isSaving, activeTab, setActiveTab,
        branches, units,
        
        isProductModalOpen, setIsProductModalOpen,
        productSearchTerm, setProductSearchTerm,
        filteredProducts,
        handleChange, handleLineChange, handleAddLine, handleRemoveLine,
        handleSave, 
        handleOpenProductSearch, handleProductSelect,

        // Vendor Props
        isVendorModalOpen, setIsVendorModalOpen,
        handleAddVendor, handleRemoveVendor,
        handleOpenVendorModal, handleVendorSelect
    } = useRFQForm(isOpen, onClose, initialPR, onSuccess);

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
            title="สร้างใบขอเสนอราคา (RFQ) - Request for Quotation"
            titleIcon={<div className="bg-white/20 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} /></div>}
            headerColor="bg-teal-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                        บันทึก
                    </button>
                </div>
            }
        >
            <div className="space-y-6 p-4">
                <div className={cardClass}>
                    <RFQFormHeader 
                        formData={formData} 
                        branches={branches} 
                        handleChange={handleChange} 
                    />
                </div>

                <div className={cardClass}>
                    <RFQFormLines 
                        lines={formData.lines} 
                        units={units} 
                        handleLineChange={handleLineChange}
                        handleAddLine={handleAddLine}
                        handleRemoveLine={handleRemoveLine}
                        handleOpenProductSearch={handleOpenProductSearch}
                    />
                </div>

                {/* Vendor Logic Restored */}
                <div className={cardClass}>
                    <RFQVendorSelection 
                        vendors={formData.vendors}
                        onAdd={handleAddVendor}
                        onRemove={handleRemoveVendor}
                        handleOpenVendorModal={handleOpenVendorModal}
                    />
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

            {/* Product Search Modal */}
            <ModalLayout
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                title="ค้นหาสินค้า"
                titleIcon={<Search className="text-teal-600" size={20} />}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            value={productSearchTerm} 
                            onChange={(e) => setProductSearchTerm(e.target.value)} 
                            placeholder="ค้นหาด้วยรหัส หรือชื่อสินค้า..." 
                            className="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            autoFocus 
                        />
                    </div>
                    
                    <div className="max-h-[400px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-inner">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-center w-20 font-bold text-gray-600 dark:text-gray-200">เลือก</th>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-200">รหัสสินค้า</th>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-200">ชื่อสินค้า</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((item) => (
                                        <tr key={item.item_id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-all duration-200 group">
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => handleProductSelect(item)} 
                                                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md shadow-sm text-xs font-semibold transform active:scale-95 transition-all"
                                                >
                                                    เลือก
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                {item.item_code}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                                                {item.item_name}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                                            ไม่พบข้อมูลสินค้าที่ท่านค้นหา
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </ModalLayout>

            {/* Vendor Search Modal */}
            <VendorSearchModal 
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
            />
        </WindowFormLayout>
    );
};

export { RFQFormModal as default };

