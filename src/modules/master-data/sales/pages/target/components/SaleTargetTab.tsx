/**
 * @file SaleTargetTab.tsx
 * @description Tab สำหรับจัดการข้อมูลเป้าการขายพนักงาน (Sale Target)
 */

import { useMemo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { SaleTargetMaster } from '../types/sale-target.types';
import type { SalePeriodMaster } from '../types/sale-period.types';
import type { EmployeeMaster } from '@/modules/master-data/company/types/employee.types';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

interface Props {
    data: SaleTargetMaster[];
    isLoading: boolean;
    filters: TableFilters<string>;
    handlePageChange: (page: number) => void;
    handleEdit: (id: string | number) => void;
    handleDelete: (id: string | number) => void;
    employees: EmployeeMaster[];
    periods: SalePeriodMaster[];
}

export function SaleTargetTab({
    data,
    isLoading,
    filters,
    handlePageChange,
    handleEdit,
    handleDelete,
    employees,
    periods,
}: Props) {
    
    const columns = useMemo<ColumnDef<SaleTargetMaster>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            id: 'employee_display',
            header: 'พนักงาน',
            cell: ({ row }) => {
                const item = row.original;
                const emp = employees.find(e => Number(e.employee_id || e.id) === Number(item.emp_id));
                const code = emp?.employee_code || item.employee_code || `ID: ${item.emp_id}`;
                const name = emp?.employee_name || 
                            (emp ? `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim() : '') || 
                            item.employee_name || '';
                
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">{code}</span>
                        {name && <span className="text-gray-600 dark:text-gray-400">| {name}</span>}
                    </div>
                );
            },
        },
        {
            id: 'period_display',
            header: 'ช่วงเวลา',
            cell: ({ row }) => {
                const item = row.original;
                const period = periods.find(p => Number(p.period_id) === Number(item.period_id));
                
                if (period) {
                    return (
                        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            <span>{`งวดวันที่ ${new Date(period.begin_date).toLocaleDateString('th-TH')}`}</span>
                            <span className="text-gray-400">ถึง</span>
                            <span>{`${new Date(period.end_date).toLocaleDateString('th-TH')}`}</span>
                        </div>
                    );
                }
                
                return <span className="text-gray-500">{item.target_name || `งวด ID: ${item.period_id}`}</span>;
            },
        },
        {
            id: 'target_amount',
            header: 'เป้าการขาย',
            cell: ({ row }) => {
                const amount = Number(row.original.period_target || row.original.amount || 0);
                return amount.toLocaleString('th-TH', { minimumFractionDigits: 2 });
            },
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.target_id || row.original.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.target_id || row.original.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete, employees, periods]);

    return (
        <SmartTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            pagination={{
                pageIndex: filters.page,
                pageSize: filters.limit,
                totalCount: data.length,
                onPageChange: handlePageChange,
                onPageSizeChange: () => {}, // Managed by parent now
            }}
            rowIdField="target_id"
            className="shadow-sm"
        />
    );
}
