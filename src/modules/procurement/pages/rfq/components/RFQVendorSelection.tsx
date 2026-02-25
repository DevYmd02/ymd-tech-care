import React from 'react';
import { Users, Search, Trash2, Plus } from 'lucide-react';
import type { RFQVendorFormData } from '@/modules/procurement/types';

interface RFQVendorSelectionProps {
    vendors: RFQVendorFormData[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    handleOpenVendorModal: (index: number) => void;
    isViewMode?: boolean;
    isInviteMode?: boolean;
}

export const RFQVendorSelection: React.FC<RFQVendorSelectionProps> = ({ 
    vendors, 
    onAdd, 
    onRemove, 
    handleOpenVendorModal,
    isViewMode = false,
    isInviteMode = false
}) => {
    const labelStyle = "text-sm font-medium text-teal-700 dark:text-teal-300 mb-1 block";
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all";

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <Users size={18} />
                    <span className="font-semibold">ผู้ขายที่ต้องการส่ง RFQ (Vendors)</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    รายการที่เลือก: {vendors.length}
                </span>
            </div>

            <div className="space-y-3">
                {vendors.length === 0 ? (
                    /* Empty State UI */
                    <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center min-h-[200px]">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-3">
                            <Users size={40} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-900 dark:text-gray-200 font-medium text-lg">ยังไม่มีผู้ขายที่เลือก</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">กรุณาเพิ่มผู้ขายเพื่อดำเนินการต่อ</p>
                        
                        <button
                            type="button"
                            onClick={onAdd}
                            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm font-medium transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            เพิ่มผู้ขาย (Add Vendor)
                        </button>
                    </div>
                ) : (
                    /* Vendor List */
                    <>
                        {vendors.map((vendor, index) => {
                            const isRowLocked = isViewMode || (isInviteMode && vendor.is_existing);
                            return (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Vendor Code */}
                            <div className="md:col-span-4">
                                <label className={labelStyle}>รหัสผู้ขาย / Vendor {index + 1}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="กดปุ่มค้นหา..."
                                        value={vendor.vendor_code}
                                        readOnly
                                        disabled={isRowLocked}
                                        className={`${inputStyle} flex-1 ${isRowLocked ? 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 cursor-not-allowed border-gray-200 dark:border-slate-700' : 'bg-white dark:bg-gray-900 cursor-pointer hover:border-teal-400'}`}
                                        onClick={() => !isRowLocked && handleOpenVendorModal(index)}
                                    />
                                    {!isRowLocked && (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenVendorModal(index)}
                                            className="h-8 w-10 flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shrink-0 shadow-sm"
                                            title="ค้นหาผู้ขาย"
                                        >
                                            <Search size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Vendor Name */}
                            <div className="md:col-span-7">
                                <label className={labelStyle}>ชื่อผู้ขาย</label>
                                <input
                                    type="text"
                                    placeholder="ชื่อผู้ขายจะแสดงอัตโนมัติ"
                                    value={vendor.vendor_name_display}
                                    readOnly
                                    disabled={isRowLocked}
                                    className={`${inputStyle} ${isRowLocked ? 'bg-gray-100 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 cursor-not-allowed border-gray-200 dark:border-slate-700' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 cursor-not-allowed'}`}
                                />
                            </div>

                            {/* Remove Button */}
                            <div className="md:col-span-1 flex justify-end">
                                {!isRowLocked && (
                                    <button
                                        type="button"
                                        onClick={() => onRemove(index)}
                                        className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        title="ลบรายการ"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                            );
                        })}

                        {/* Add Button (Below List) */}
                        {!isViewMode && (
                            <button
                                type="button"
                                onClick={onAdd}
                                className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 rounded-lg transition-all hover:bg-teal-50 dark:hover:bg-teal-900/20 group"
                            >
                                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-full group-hover:bg-teal-100 dark:group-hover:bg-teal-900 transition-colors">
                                    <Plus size={16} />
                                </div>
                                <span className="font-medium text-sm">เพิ่มผู้ขาย (Add Vendor)</span>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
