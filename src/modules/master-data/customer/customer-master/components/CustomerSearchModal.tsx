/**
 * @file CustomerSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกลูกค้า (Customer)
 * 
 * @architecture
 * - UI: DialogFormLayout with rich full-width table (original premium design)
 * - Data: React Query + useDebounce for Server-side search (optimized)
 * - Performance: React.memo to prevent unnecessary re-renders
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Search, User, Check } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';

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

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    excludeIds = [],
    title = 'ค้นหาลูกค้า - Find Customer'
}) => {
    // Local search states (for multi-field UI filtering)
    const [searchCode, setSearchCode] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchTaxId, setSearchTaxId] = useState('');

    // Use first non-empty field as the server search term
    const serverSearchTerm = searchCode || searchName || searchTaxId;
    const debouncedSearch = useDebounce(serverSearchTerm, 400);

    // Fetch customers using Server-side search (React Query handles caching)
    const { data: response, isLoading } = useQuery({
        queryKey: ['customers-lookup', debouncedSearch],
        queryFn: () => CustomerService.getList({
            search: debouncedSearch,
            limit: 100
        }),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    // Client-side filter for multi-field local refinement
    const filteredData = useMemo(() => {
        const customers = response?.data || [];

        let result = customers;

        // Exclude IDs if specified
        if (excludeIds.length > 0) {
            result = result.filter(c => !excludeIds.includes(c.id || c.customer_id));
        }

        // Additional local multi-field filter (runs on already-searched server data)
        if (searchCode.trim()) {
            const term = searchCode.toLowerCase();
            result = result.filter(c =>
                (c.customer_code || c.code || '').toLowerCase().includes(term) ||
                (c.tax_id || '').toLowerCase().includes(term)
            );
        }
        if (searchName.trim()) {
            const term = searchName.toLowerCase();
            result = result.filter(c =>
                (c.customer_name_th || c.name_th || c.customer_name || '').toLowerCase().includes(term) ||
                (c.customer_name_en || c.name_en || c.customer_nameeng || '').toLowerCase().includes(term)
            );
        }
        if (searchTaxId.trim()) {
            const term = searchTaxId.toLowerCase();
            result = result.filter(c => (c.tax_id || '').toLowerCase().includes(term));
        }

        return result;
    }, [response?.data, excludeIds, searchCode, searchName, searchTaxId]);

    const handleSelect = useCallback((customer: CustomerMaster) => {
        onSelect(customer);
        onClose();
    }, [onSelect, onClose]);

    const handleClearFilters = useCallback(() => {
        setSearchCode('');
        setSearchName('');
        setSearchTaxId('');
    }, []);

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
            width="max-w-[1800px]"
        >
            <div className="flex flex-col h-full max-h-[75vh]">

                {/* ==================== SEARCH SECTION ==================== */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wide">
                                รหัสลูกค้า / เลขผู้เสียภาษี
                            </label>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="C001 / 0105..."
                                autoFocus
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wide">
                                ชื่อลูกค้า (ไทย / English)
                            </label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="ค้นหาตามชื่อลูกค้า..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-1.5 uppercase tracking-wide">
                                เลขผู้เสียภาษี (Tax ID)
                            </label>
                            <input
                                type="text"
                                value={searchTaxId}
                                onChange={(e) => setSearchTaxId(e.target.value)}
                                placeholder="0105XXXXXXXXX"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* ==================== TABLE SECTION ==================== */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                            <span className="ml-4 text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลลูกค้า...</span>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-24">จัดการ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-[60px]">ลำดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">รหัสลูกค้า</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ชื่อลูกค้า</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-40">เลขผู้เสียภาษี</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-36">วงเงิน (บาท)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-28">เครดิต (วัน)</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-36">วิธีชำระ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filteredData.length > 0 ? (
                                    filteredData.map((customer, index) => {
                                        const isExcluded = excludeIds.includes(customer.id || customer.customer_id);
                                        const isSelectable = customer.is_active && !isExcluded;
                                        const nameTh = customer.customer_name_th || customer.name_th || customer.customer_name;
                                        const nameEn = customer.customer_name_en || customer.name_en || customer.customer_nameeng;
                                        const creditDays = customer.credit_term_days ?? customer.credit_days;

                                        return (
                                            <tr
                                                key={customer.customer_id || customer.id || index}
                                                className={`transition-colors text-sm ${
                                                    !isSelectable
                                                        ? 'bg-gray-50/50 dark:bg-gray-900/30 opacity-60'
                                                        : 'hover:bg-blue-50/60 dark:hover:bg-blue-900/10 cursor-pointer'
                                                }`}
                                                onDoubleClick={() => isSelectable && handleSelect(customer)}
                                            >
                                                {/* Action */}
                                                <td className="px-4 py-2.5 text-center">
                                                    <button
                                                        onClick={() => handleSelect(customer)}
                                                        disabled={!isSelectable}
                                                        title={isExcluded ? 'เลือกแล้ว' : !customer.is_active ? 'ลูกค้าไม่ได้ใช้งาน' : 'เลือกลูกค้านี้'}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                                                            isExcluded
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
                                                                : isSelectable
                                                                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm'
                                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isExcluded ? <><Check size={12} />เลือกแล้ว</> : 'เลือก'}
                                                    </button>
                                                </td>

                                                {/* Index */}
                                                <td className="px-4 py-2.5 text-center text-gray-400 dark:text-gray-500 text-xs">
                                                    {index + 1}
                                                </td>

                                                {/* Code */}
                                                <td className="px-4 py-2.5">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        {customer.customer_code || customer.code}
                                                    </span>
                                                </td>

                                                {/* Name */}
                                                <td className="px-4 py-2.5">
                                                    <div className="font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                                                        {nameTh}
                                                    </div>
                                                    {nameEn && (
                                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium mt-0.5 truncate max-w-[280px]" title={nameEn}>
                                                            {nameEn}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Tax ID */}
                                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                                    {customer.tax_id || '-'}
                                                </td>

                                                {/* Credit Limit */}
                                                <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                    {Number(customer.credit_limit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>

                                                {/* Credit Days */}
                                                <td className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-300">
                                                    {creditDays !== undefined && creditDays !== null ? `${creditDays} วัน` : '-'}
                                                </td>

                                                {/* Payment method */}
                                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                                    {customer.payment_method_default || customer.payment_method || '-'}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-2.5 text-center">
                                                    <CustomerStatusBadge status={customer.status} isActive={customer.is_active} />
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-20 text-center text-gray-400 dark:text-gray-500">
                                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-base font-medium">ไม่พบข้อมูลลูกค้า</p>
                                            <p className="text-sm mt-1 opacity-70">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ==================== FOOTER SECTION ==================== */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        พบ <span className="font-bold text-blue-600 dark:text-blue-400">{filteredData.length.toLocaleString()}</span> รายการ
                        {(searchCode || searchName || searchTaxId) && (
                            <button
                                onClick={handleClearFilters}
                                className="ml-3 text-xs text-red-500 hover:text-red-700 underline transition-colors"
                            >
                                ล้างตัวกรอง
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
