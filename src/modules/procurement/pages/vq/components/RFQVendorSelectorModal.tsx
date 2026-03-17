import React from 'react';
import { Check, Users } from 'lucide-react';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';

interface RFQVendorSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendors: { vendor_id: number; vendor_code?: string; vendor_name?: string }[];
    onSelect: (vendorId: number) => void;
}

export const RFQVendorSelectorModal: React.FC<RFQVendorSelectorModalProps> = ({ 
    isOpen, 
    onClose, 
    vendors = [], 
    onSelect 
}) => {
    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกผู้ขายจากใบขอราคาสินค้า (RFQ Vendors)"
            titleIcon={<Users className="w-5 h-5 opacity-90" />}
            size="md"
            headerColor="bg-indigo-600"
        >
            <div className="flex flex-col h-full bg-gray-50/30 dark:bg-transparent p-1">
                <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm relative min-h-[200px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-5 py-3 font-semibold">รหัสผู้ขาย</th>
                                <th className="px-5 py-3 font-semibold">ชื่อผู้ขาย</th>
                                <th className="px-5 py-3 font-semibold text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {vendors.length > 0 ? (
                                vendors.map((vendor) => (
                                    <tr key={vendor.vendor_id} className="hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {vendor.vendor_code || '-'}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                                            {vendor.vendor_name || '-'}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onSelect(vendor.vendor_id);
                                                    onClose();
                                                }}
                                                className="inline-flex items-center justify-center px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors shadow-sm active:scale-95"
                                            >
                                                <Check size={16} className="mr-1 -ml-1" />
                                                เลือก
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                                        ไม่พบรายชื่อผู้ขาย
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModalLayout>
    );
};
