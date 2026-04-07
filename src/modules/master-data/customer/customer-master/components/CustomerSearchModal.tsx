/**
 * @file CustomerSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกลูกค้า (Customer) - Redesigned UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Check } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/ui/layout/DialogFormLayout';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// PROPS
// ====================================================================================

export interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerMaster) => void;
    excludeIds?: number[];
    title?: string;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    excludeIds = [],
    title = 'ค้นหาลูกค้า - Find Customer'
}) => {
    const [customers, setCustomers] = useState<CustomerMaster[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filter states
    const [searchCode, setSearchCode] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchTaxId, setSearchTaxId] = useState('');
    const [filteredData, setFilteredData] = useState<CustomerMaster[]>([]);

    // Fetch customers when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await CustomerService.getList();
                if (response.data) {
                    setCustomers(response.data);
                }
            } catch (error) {
                logger.error('[CustomerSearchModal] fetchCustomers error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCustomers();
    }, [isOpen]);

    // Update filtered data
    useEffect(() => {
        let result = [...customers];

        if (searchCode.trim()) {
            const term = searchCode.toLowerCase();
            result = result.filter(v => 
                (v.customer_code || v.code || '').toLowerCase().includes(term) ||
                (v.tax_id || '').toLowerCase().includes(term)
            );
        }

        if (searchName.trim()) {
            const term = searchName.toLowerCase();
            result = result.filter(v => 
                (v.customer_name_th || v.name_th || v.customer_name || '').toLowerCase().includes(term) ||
                (v.customer_name_en || v.name_en || v.customer_nameeng || '').toLowerCase().includes(term)
            );
        }

        if (searchTaxId.trim()) {
            const term = searchTaxId.toLowerCase();
            result = result.filter(v => (v.tax_id || '').toLowerCase().includes(term));
        }

        setFilteredData(result);
    }, [customers, searchCode, searchName, searchTaxId]);

    // Reset filters when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchCode('');
            setSearchName('');
            setSearchTaxId('');
        }
    }, [isOpen]);

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
                <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm border border-blue-500/30">
                    <User size={20} className="text-white" />
                </div>
            }
            width="max-w-[1800px]" // Maximized for full-screen data entry experience
        >
            <div className="flex flex-col h-full max-h-[75vh]">
                {/* Search Section */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                                รหัสลูกค้า / เลขผู้เสียภาษี
                            </label>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="C001 / Tax ID..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                                ชื่อลูกค้า
                            </label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="ค้นหาตามชื่อลูกค้า..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase">
                                เลขผู้เสียภาษี (Tax ID)
                            </label>
                            <input
                                type="text"
                                value={searchTaxId}
                                onChange={(e) => setSearchTaxId(e.target.value)}
                                placeholder="01055XXXXXXXX"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                            <span className="ml-4 text-gray-500 font-medium">กำลังโหลดข้อมูลลูกค้า...</span>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-24">จัดการ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-[60px]">ลำดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-32">รหัสลูกค้า</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ชื่อลูกค้า</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-40">เลขผู้เสียภาษี</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-36">วงเงิน (บาท)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-28">เครดิต (วัน)</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-36">วิธีชำระ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase w-32">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((customer, index) => {
                                        const isExcluded = excludeIds.includes(customer.id || customer.customer_id);
                                        const isSelectable = customer.is_active && !isExcluded;

                                        return (
                                            <tr 
                                                key={customer.id || customer.customer_id}
                                                className={`transition-colors ${!isSelectable ? 'bg-gray-50/50 dark:bg-gray-900/50 opacity-60' : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}
                                            >
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleSelect(customer)}
                                                        disabled={!isSelectable}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto ${
                                                            isSelectable 
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isExcluded ? <Check size={14} /> : null}
                                                        {isExcluded ? 'เลือกแล้ว' : 'เลือก'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        {customer.customer_code || customer.code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-800 dark:text-gray-100">
                                                        {customer.customer_name_th || customer.name_th || customer.customer_name}
                                                    </div>
                                                    {(customer.customer_name_en || customer.name_en || customer.customer_nameeng) && (
                                                        <div className="text-xs text-gray-400 uppercase font-medium">
                                                            {customer.customer_name_en || customer.name_en || customer.customer_nameeng}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                    {customer.tax_id || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600">
                                                    {Number(customer.credit_limit || 0).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                                                    {customer.credit_term_days || customer.credit_days || 0} วัน
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 uppercase">
                                                    {customer.payment_method_default || customer.payment_method || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <CustomerStatusBadge status={customer.status} isActive={customer.is_active} />
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-20 text-center text-gray-400">
                                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-lg">ไม่พบข้อมูลลูกค้า</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Section */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between font-bold">
                    <div className="text-sm text-gray-500">
                        พบทั้งหมด <span className="text-blue-600">{filteredData.length}</span> รายการ
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
};
