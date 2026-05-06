/**
 * @file EmployeeSearchModal.tsx
 * @description Modal for searching and selecting employees
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Search, UserCircle, Check } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/ui/layout/DialogFormLayout';
import { EmployeeService } from '../services/employee.service';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { cn } from '@/shared/utils';

export interface EmployeeSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (employee: IEmployee) => void;
    title?: string;
    headerColor?: string;
}

export const EmployeeSearchModal: React.FC<EmployeeSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาพนักงาน - Find Employee',
    headerColor
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['employees-lookup'],
        queryFn: () => EmployeeService.getAll(),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const filteredData = useMemo(() => {
        if (!debouncedSearch.trim()) return employees;
        const term = debouncedSearch.toLowerCase();
        return employees.filter(emp => 
            emp.employee_code.toLowerCase().includes(term) ||
            emp.employee_firstname_th.toLowerCase().includes(term) ||
            emp.employee_lastname_th.toLowerCase().includes(term) ||
            (emp.email && emp.email.toLowerCase().includes(term))
        );
    }, [employees, debouncedSearch]);

    const handleSelect = useCallback((employee: IEmployee) => {
        onSelect(employee);
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
                    "p-1.5 rounded-lg shadow-sm",
                    headerColor?.includes('indigo') ? "bg-white/20" :
                    headerColor ? "bg-white/20" : "bg-blue-600"
                )}>
                    <UserCircle size={20} className="text-white" />
                </div>
            }
            width="max-w-[1000px]"
        >
            <div className="flex flex-col h-[600px]">
                {/* Search Bar */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาตามรหัสพนักงาน หรือชื่อพนักงาน..."
                            className={cn(
                                "w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 outline-none transition-all focus:ring-2",
                                headerColor?.includes('indigo') ? "focus:ring-indigo-500" :
                                headerColor ? "focus:ring-emerald-500" : "focus:ring-blue-600"
                            )}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className={cn(
                                "animate-spin rounded-full h-10 w-10 border-b-2 mb-4",
                                headerColor?.includes('indigo') ? "border-indigo-600" :
                                headerColor ? "border-emerald-600" : "border-blue-600"
                            )} />
                            <p className="text-gray-500 font-medium text-sm">กำลังโหลดข้อมูลพนักงาน...</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide w-20">จัดการ</th>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide w-32">รหัสพนักงาน</th>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">ชื่อ-นามสกุล</th>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">แผนก</th>
                                    <th className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">ตำแหน่ง</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredData.length > 0 ? (
                                    filteredData.map((emp, index) => (
                                        <tr 
                                            key={emp.id || `emp-${index}`} 
                                            className={cn(
                                                "cursor-pointer transition-colors",
                                                headerColor?.includes('indigo') ? "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10" :
                                                headerColor ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10" : "hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                            )}
                                            onDoubleClick={() => handleSelect(emp)}
                                        >
                                            <td className="px-4 py-2.5">
                                                <button
                                                    onClick={() => handleSelect(emp)}
                                                    className={cn(
                                                        "text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm",
                                                        headerColor?.includes('indigo') ? "bg-indigo-600 hover:bg-indigo-700" :
                                                        headerColor ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                                                    )}
                                                >
                                                    <Check size={12} />
                                                    เลือก
                                                </button>
                                            </td>
                                            <td className={cn(
                                                "px-4 py-2.5 font-bold",
                                                headerColor?.includes('indigo') ? "text-indigo-600 dark:text-indigo-400" :
                                                headerColor ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                                            )}>
                                                {emp.employee_code}
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                                                {emp.employee_firstname_th} {emp.employee_lastname_th}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                                                {emp.department?.department_name || '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                                                {emp.position?.position_name || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr key="empty-row">
                                        <td colSpan={5} className="px-4 py-20 text-center text-gray-400">
                                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-medium text-base">ไม่พบข้อมูลพนักงาน</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-sm text-gray-500">พบ <span className={cn(
                        "font-bold",
                        headerColor?.includes('indigo') ? "text-indigo-600" :
                        headerColor ? "text-emerald-600" : "text-blue-600"
                    )}>{filteredData.length}</span> รายการ</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-all font-medium"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
