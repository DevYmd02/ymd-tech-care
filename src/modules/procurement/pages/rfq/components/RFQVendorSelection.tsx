import React from 'react';
import { Users, Search } from 'lucide-react';

interface VendorSelection {
    vendor_code: string;
    vendor_name: string;
    vendor_name_display: string;
}

interface RFQVendorSelectionProps {
    selectedVendors: VendorSelection[];
    handleOpenVendorModal: (index: number) => void;
}

export const RFQVendorSelection: React.FC<RFQVendorSelectionProps> = ({ selectedVendors, handleOpenVendorModal }) => {
    const labelStyle = "text-sm font-medium text-teal-700 dark:text-teal-300 mb-1 block";
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all";

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                <Users size={18} />
                <span className="font-semibold">เลือกผู้ขาย - Vendor Selection for RFQ</span>
            </div>

            <div className="space-y-4">
                {selectedVendors.map((vendor, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyle}>รหัสผู้ขาย {index + 1}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="เลือกรหัสผู้ขาย"
                                        value={vendor.vendor_code}
                                        readOnly
                                        className={`${inputStyle} flex-1 bg-white dark:bg-gray-800`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleOpenVendorModal(index)}
                                        className="h-8 w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shrink-0 shadow-sm"
                                    >
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={labelStyle}>ชื่อผู้ขาย</label>
                                <input
                                    type="text"
                                    placeholder="ชื่อผู้ขายจะแสดงอัตโนมัติ"
                                    value={vendor.vendor_name_display}
                                    readOnly
                                    className={`${inputStyle} bg-gray-100 dark:bg-gray-700 cursor-not-allowed`}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
