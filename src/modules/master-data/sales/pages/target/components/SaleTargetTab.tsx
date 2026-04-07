/**
 * @file SaleTargetTab.tsx
 * @description Tab สำหรับจัดการข้อมูลเป้าการขายพนักงาน (Sale Target)
 */

import { useMemo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { SaleTargetMaster } from '../types/sale-target.types';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

interface Props {
    data: SaleTargetMaster[];
    isLoading: boolean;
    filters: TableFilters<string>;
    handlePageChange: (page: number) => void;
    handleEdit: (id: string | number) => void;
    handleDelete: (id: string | number) => void;
}

export function SaleTargetTab({
    data,
    isLoading,
    filters,
    handlePageChange,
    handleEdit,
    handleDelete,
}: Props) {
    
    const columns = useMemo<ColumnDef<SaleTargetMaster>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'employee_code',
            header: 'รหัสพนักงาน',
            cell: ({ getValue }) => (
                <span className="font-medium text-purple-600 dark:text-purple-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'employee_name',
            header: 'ชื่อพนักงาน',
        },
        {
            accessorKey: 'target_name',
            header: 'ช่วงเวลา',
            cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string}</span>,
        },
        {
            accessorKey: 'amount',
            header: 'เป้าการขาย',
            cell: ({ getValue }) => (getValue() as number).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete]);

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
            rowIdField="id"
            className="shadow-sm"
        />
    );
}
