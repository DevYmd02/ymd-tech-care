import React, { useState, useEffect } from 'react';
import { Check, Users } from 'lucide-react';
import { DialogFormLayout } from '@ui';


interface RFQVendorSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendors: { 
        vendor_id: number; 
        vendor_code?: string; 
        vendor_name?: string; 
        tax_id?: string; 
        status?: string;
        hasVQ?: boolean;
    }[];
    onSelect: (vendorId: number) => void;
}

export const RFQVendorSelectorModal: React.FC<RFQVendorSelectorModalProps> = ({ 
    isOpen, 
    onClose, 
    vendors = [], 
    onSelect 
}) => {
    const [searchCode, setSearchCode] = useState('');
    const [searchName, setSearchName] = useState('');
    const [filteredData, setFilteredData] = useState(vendors);

    // 🔍 @Agent_Filter_Operator: Client-Side filtering only
    useEffect(() => {
        let result = [...vendors];

        if (searchCode.trim()) {
            const term = searchCode.toLowerCase();
            result = result.filter(v => 
                v.vendor_code?.toLowerCase().includes(term)
            );
        }

        if (searchName.trim()) {
            const term = searchName.toLowerCase();
            result = result.filter(v => 
                v.vendor_name?.toLowerCase().includes(term)
            );
        }

        setFilteredData(result);
    }, [vendors, searchCode, searchName]);

    useEffect(() => {
        if (isOpen) {
            setSearchCode('');
            setSearchName('');
        }
    }, [isOpen]);

    const handleSelect = (vendorId: number) => {
        onSelect(vendorId);
        onClose();
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกผู้ขายจากใบขอราคาสินค้า (RFQ Vendors)"
            titleIcon={<Users size={24} />}
            width="max-w-6xl"
        >
            <div className="flex flex-col h-full max-h-[75vh]">
                {/* 🔍 ==================== SEARCH & FILTER SECTION ==================== */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                รหัสผู้ขาย / เลขผู้เสียภาษี
                            </label>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="ค้นหารหัสผู้ขาย..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                ชื่อผู้ขาย
                            </label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="ค้นหาชื่อผู้ขาย..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 📊 ==================== DATA TABLE ==================== */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-28">เลือก</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-28">สถานะ</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-32">รหัสผู้ขาย</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ชื่อผู้ขาย</th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredData.length > 0 ? (
                                filteredData.map((vendor) => {
                                    const isCreated = vendor.hasVQ === true;
                                    
                                    return (
                                        <tr key={vendor.vendor_id} className={`transition-colors group ${isCreated ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'hover:bg-purple-50 dark:hover:bg-gray-700/50'}`}>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => !isCreated && handleSelect(vendor.vendor_id)}
                                                    disabled={isCreated}
                                                    title={isCreated ? 'สร้างใบ VQ ไปแล้ว' : 'เลือกผู้ขาย'}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1 mx-auto ${
                                                        isCreated 
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300' 
                                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                                    }`}
                                                >
                                                    {isCreated ? <Check size={14} className="text-gray-400" /> : <Check size={14} />}
                                                    {isCreated ? 'สร้างแล้ว' : 'เลือก'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isCreated ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                                        สร้างแล้ว
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                                        รอดำเนินการ
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                                    {vendor.vendor_code || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                                                {vendor.vendor_name || '-'}
                                            </td>

                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-lg font-medium">ไม่พบผู้ขาย</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 🧾 ==================== FOOTER ==================== */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        พบ <span className="font-bold text-purple-600">{filteredData.length}</span> รายการ
                    </span>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors">
                        ปิด
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
};
