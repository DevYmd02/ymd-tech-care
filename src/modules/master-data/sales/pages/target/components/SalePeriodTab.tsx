/**
 * @file SalePeriodTab.tsx
 * @description Tab สำหรับจัดการข้อมูลช่วงเวลาการขาย (Sale Period)
 */

import { useMemo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { SalePeriodListItem } from '../types/sale-period.types';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

interface Props {
    data: SalePeriodListItem[];
    isLoading: boolean;
    filters: TableFilters<string>;
    handlePageChange: (page: number) => void;
    handleEdit: (id: string | number) => void;
    handleDelete: (id: string | number) => void;
}

export function SalePeriodTab({
    data,
    isLoading,
    filters,
    handlePageChange,
    handleEdit,
    handleDelete,
}: Props) {
    
    const columns = useMemo<ColumnDef<SalePeriodListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'period_id',
            header: 'รหัสเป้าการขาย',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'period_target',
            header: 'ยอดเป้าหมาย (บาท)',
            cell: ({ getValue }) => {
                const val = getValue() as string;
                return (Number(val) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
            },
        },
        {
            id: 'period',
            header: 'ช่วงเวลางวด',
            accessorFn: (row) => {
                const formatDate = (dateStr: string) => {
                    if (!dateStr) return '-';
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    }); // Returns d ม.ค. พ.ศ.
                };
                return `${formatDate(row.begin_date)} - ${formatDate(row.end_date)}`;
            },
        },
        {
            accessorKey: 'close_status',
            header: 'สถานะงวด',
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getValue() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {getValue() ? 'ปิดงวด (Closed)' : 'เปิดงวด (Open)'}
                </span>
            ),
            size: 100,
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.period_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.period_id)}
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
            rowIdField="period_id"
            className="shadow-sm"
        />
    );
}
