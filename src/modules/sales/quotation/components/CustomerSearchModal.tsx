import React, { useState, useCallback, useMemo } from 'react';
import { Search, User, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { CustomerStatusBadge } from '@customer/customer-master/components/CustomerStatusBadge';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';

/**
 * @file CustomerSearchModal.tsx
 * @description Localized Search Modal for selecting Customers in Quotation module.
 */

export interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerMaster) => void;
    title?: string;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาลูกค้า - Find Customer'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Fetch customers using Server-side search
    const { data: response, isLoading } = useQuery({
        queryKey: ['customers-lookup', debouncedSearch],
        queryFn: () => CustomerService.getList({
            search: debouncedSearch,
            limit: 100
        }),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5, 
    });

    const customers = useMemo(() => response?.data || [], [response]);

    const handleSelect = useCallback((customer: CustomerMaster) => {
        onSelect(customer);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={
                <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                    <User size={20} className="text-white" />
                </div>
            }
            width="max-w-[1200px]"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหารหัสลูกค้า, ชื่อลูกค้า, หรือเลขผู้เสียภาษี..."
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
                            autoFocus
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-60">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลลูกค้า...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">รหัสลูกค้า</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">ชื่อลูกค้า</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขผู้เสียภาษี</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">สถานะ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {customers.length > 0 ? (
                                    customers.map((customer) => (
                                        <tr 
                                            key={customer.customer_id} 
                                            className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(customer)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform inline-block">
                                                    {customer.customer_code || customer.code || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {customer.customer_name_th || customer.customer_name || customer.name_th || '-'}
                                                </div>
                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium truncate max-w-[300px]">
                                                    {customer.customer_name_en || customer.customer_nameeng || customer.name_en || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                                                {customer.tax_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <CustomerStatusBadge status={customer.status} isActive={customer.is_active} />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(customer);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                >
                                                    เลือก
                                                    <Check size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center items-center justify-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Search size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบข้อมูลลูกค้า</p>
                                                <p className="text-sm opacity-80">ลองเปลี่ยนคำค้นหาอีกครั้ง</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        แสดงข้อมูล <span className="font-bold text-blue-600">{customers.length}</span> รายการ
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
