import React from 'react';
import { FileText, Info, MoreHorizontal, Star, AlignLeft, History, Search } from 'lucide-react';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { WindowFormLayout, TabPanel, SystemAlert } from '@ui';
import type { PRHeader } from '@/modules/procurement/types/pr-types';
import { useRFQForm } from '@/modules/procurement/hooks/useRFQForm';
import { RFQFormHeader } from './RFQFormHeader';
import { RFQFormLines } from './RFQFormLines';
import { RFQVendorSelection } from './RFQVendorSelection';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editId?: string | null;
    initialPR?: PRHeader | null;
}

export const RFQFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialPR }) => {
    const {
        formData, isSaving, activeTab, setActiveTab, alert, setAlert,
        branches, units, selectedVendors,
        isVendorModalOpen, setIsVendorModalOpen,
        isProductModalOpen, setIsProductModalOpen,
        productSearchTerm, setProductSearchTerm,
        filteredProducts,
        handleChange, handleLineChange, handleAddLine, handleRemoveLine,
        handleSave, handleOpenVendorModal, handleVendorSelect,
        handleOpenProductSearch, handleProductSelect
    } = useRFQForm(isOpen, onClose, initialPR, onSuccess);

    const tabs = [
        { id: 'detail', label: 'Detail', icon: <Info size={16} /> },
        { id: 'more', label: 'More', icon: <MoreHorizontal size={16} /> },
        { id: 'rate', label: 'Rate', icon: <Star size={16} /> },
        { id: 'description', label: 'Description', icon: <AlignLeft size={16} /> },
        { id: 'history', label: 'History', icon: <History size={16} /> },
    ];

    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';

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
            {alert.show && (
                <SystemAlert 
                    message={alert.message} 
                    onClose={() => setAlert({ ...alert, show: false })} 
                />
            )}

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

            <div className={cardClass}>
                <RFQVendorSelection 
                    selectedVendors={selectedVendors} 
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
                        {/* Other tabs simplified for brevity, following the original logic */}
                        {['more', 'rate', 'description', 'history'].includes(activeTab) && (
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                {tabs.find(t => t.id === activeTab)?.label} (พร้อมใช้งานเร็วๆ นี้)
                            </div>
                        )}
                    </TabPanel>
                </div>
            </div>

            {/* Product Search Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setIsProductModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Search className="text-teal-600" /> ค้นหาสินค้า
                                </h2>
                                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    value={productSearchTerm} 
                                    onChange={(e) => setProductSearchTerm(e.target.value)} 
                                    placeholder="ค้นหาด้วยรหัส หรือชื่อสินค้า..." 
                                    className="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    autoFocus 
                                />
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-center">เลือก</th>
                                        <th className="px-4 py-3">รหัสสินค้า</th>
                                        <th className="px-4 py-3">ชื่อสินค้า</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((item) => (
                                        <tr key={item.item_id} className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleProductSelect(item)} className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs">เลือก</button>
                                            </td>
                                            <td className="px-4 py-3">{item.item_code}</td>
                                            <td className="px-4 py-3">{item.item_name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <VendorSearchModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
            />
        </WindowFormLayout>
    );
};

export { RFQFormModal as default };

