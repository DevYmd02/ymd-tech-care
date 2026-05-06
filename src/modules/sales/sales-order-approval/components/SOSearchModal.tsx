import React, { useState, useCallback, useMemo } from 'react';
import { Search, ShoppingCart, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { cn } from '@/shared/utils';
import { AOService } from '../services/ao.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { SalesOrderService } from '@sales/sales-order/services/sales-order.service';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { format } from 'date-fns';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { SOForApproval } from '../types/sales-order-approval.types';

/**
 * @file SOSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกใบสั่งขาย (Sales Order) ที่รอการอนุมัติ
 */

export interface SOSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (so: SOForApproval) => void;
    title?: string;
    headerColor?: string;
}

export const SOSearchModal: React.FC<SOSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาใบสั่งขายรออนุมัติ - Find Sales Order for Approval',
    headerColor = 'bg-emerald-600'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // 1. Customer lookup
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers-lookup'],
        queryFn: () => CustomerService.getList({ limit: 1000 }),
        staleTime: 30 * 60 * 1000,
        enabled: isOpen,
    });

    const customerMap = useMemo(() => {
        const map = new Map<string | number, string>();
        const items = extractArrayFromResponse<CustomerMaster>(customerResponse as object);
        items.forEach((c) => {
            map.set(String(c.customer_id), c.customer_name_th || c.customer_name || '');
        });
        return map;
    }, [customerResponse]);

    // 2. SO Number lookup
    const { data: soResponse } = useQuery({
        queryKey: ['so-numbers-lookup'],
        queryFn: () => SalesOrderService.getList({ limit: 1000 }),
        staleTime: 10 * 60 * 1000,
        enabled: isOpen,
    });

    const soNoMap = useMemo(() => {
        const map = new Map<string | number, string>();
        const items = (soResponse as unknown as { data?: Record<string, unknown>[] })?.data || [];
        items.forEach((s) => {
            map.set(String(s.so_id), String(s.so_no || ''));
        });
        return map;
    }, [soResponse]);

    // 3. Fetch pending sales orders
    const { data: allSOs = [], isLoading } = useQuery({
        queryKey: ['pending-sales-orders-lookup', customerMap.size > 0, soNoMap.size > 0],
        queryFn: () => AOService.getPendingSOs(customerMap, soNoMap),
        enabled: isOpen,
        staleTime: 0, 
    });

    // Local filtering based on search term
    const filteredSOs = useMemo(() => {
        if (!debouncedSearch) return allSOs as SOForApproval[];
        const lowerSearch = debouncedSearch.toLowerCase();
        return (allSOs as SOForApproval[]).filter((so: SOForApproval) => 
            String(so.so_no || '').toLowerCase().includes(lowerSearch) ||
            String(so.customer_name || '').toLowerCase().includes(lowerSearch) ||
            String(so.customer_code || '').toLowerCase().includes(lowerSearch)
        );
    }, [allSOs, debouncedSearch]);

    const handleSelect = useCallback((so: SOForApproval) => {
        onSelect(so);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            headerColor={headerColor}
            titleIcon={
                <div className={cn(
                    "p-1.5 rounded-lg shadow-sm bg-white/20"
                )}>
                    <ShoppingCart size={20} className="text-white" />
                </div>
            }
            width="max-w-[1200px]"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขที่ใบสั่งขาย หรือ ชื่อลูกค้า..."
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลใบสั่งขาย...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขที่ใบสั่งขาย</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันที่</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">ลูกค้า</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">ยอดเงินรวม</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {filteredSOs.length > 0 ? (
                                    filteredSOs.slice(0, 100).map((so: SOForApproval) => (
                                        <tr 
                                            key={so.so_id} 
                                            className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(so)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform inline-block">
                                                    {so.so_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                                                {so.so_date ? format(new Date(so.so_date), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 dark:text-white line-clamp-1">{so.customer_name}</span>
                                                    <span className="text-[11px] text-gray-500">{so.customer_code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {(Number(so.total_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(so);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
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
                                                <p className="text-xl font-bold">ไม่พบข้อมูลใบสั่งขาย</p>
                                                <p className="text-sm opacity-80">ลองเปลี่ยนคำค้นหาอีกครั้ง หรือตรวจสอบสถานะใบสั่งขาย</p>
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
                        แสดงข้อมูล <span className="font-bold text-emerald-600">{filteredSOs.length}</span> รายการ
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
