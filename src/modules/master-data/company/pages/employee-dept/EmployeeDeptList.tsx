/**
 * @file EmployeeDeptList.tsx
 * @description หน้ารายการข้อมูลส่วนงาน/แผนก (Employee Dept Master Data List)
 * @module company
 */

import { useState, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Layers
} from 'lucide-react';
import { EmployeeDeptFormModal } from './EmployeeDeptFormModal';
import { useEmployeeDeptList } from './hooks/useEmployeeDeptList';
import type { EmployeeDeptListItem } from '@master-data/types/master-data-types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { EmployeeDeptService } from '@company/services/employee-dept.service';

// ====================================================================================
// CONFIG
// ====================================================================================

export default function EmployeeDeptList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'dept_code',
          search2: 'dept_name',
          search3: 'side_code'
        }
    });

    const { depts, totalCount, isLoading, refetch } = useEmployeeDeptList(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<Extract<keyof typeof filters, string>>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสแผนก', 
            type: 'text', 
            placeholder: 'กรอกรหัสแผนก',
            colSpan: 1
        },
        { 
            name: 'search2', 
            label: 'ชื่อแผนก', 
            type: 'text', 
            placeholder: 'กรอกชื่อแผนก',
            colSpan: 1
        },
        { 
            name: 'search3', 
            label: 'รหัสฝ่าย', 
            type: 'text', 
            placeholder: 'กรอกรหัสฝ่าย',
            colSpan: 1
        },
    ], []);

    // ==================== DATA MAPPING ====================
    const tableData = useMemo(() => depts, [depts]);

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string | number) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback(async (id: string | number) => {
        if (confirm('คุณต้องการลบข้อมูลแผนกนี้หรือไม่?')) {
            try {
                await EmployeeDeptService.delete(id);
                refetch();
            } catch (error) {
                console.error('Failed to delete department:', error);
                alert('ไม่สามารถลบข้อมูลได้ในขณะนี้');
            }
        }
    }, [refetch]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS (Matching DB Schema) ====================
    const columns = useMemo<ColumnDef<EmployeeDeptListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'dept_code', // Primary DB Field
            header: 'รหัสแผนก',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {row.original.dept_code || row.original.section_code}
                </span>
            ),
        },
        {
            accessorKey: 'dept_name', // Primary DB Field
            header: 'ชื่อแผนก (ไทย)',
            cell: ({ row }) => row.original.dept_name || row.original.section_name,
        },
        {
            accessorKey: 'dept_nameeng', // DB Schema naming
            header: 'ชื่อแผนก (EN)',
            cell: ({ row }) => <span className="text-gray-500">{row.original.dept_nameeng || row.original.section_name_en || '-'}</span>
        },
        {
            accessorKey: 'side_code', // DB Schema naming
            header: 'รหัสฝ่าย',
            cell: ({ row }) => (
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                    {row.original.side_code || row.original.department_code || '-'}
                </span>
            )
        },
        {
            accessorKey: 'side_name', // DB Schema naming
            header: 'ชื่อฝ่าย',
            cell: ({ row }) => row.original.side_name || row.original.department_name,
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
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleDelete]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" />
                        กำหนดรหัสแผนก (Employee Dept Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลแผนกต่างๆ ในแต่ละฝ่าย
                    </p>
                </div>

            </div>

            {/* Filter Section (Standardized) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name: string, value: string) => {
                        setFilters({ [name]: value } as Partial<typeof filters>);
                    }}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มแผนกใหม่"
                    accentColor="indigo"
                    columns={{ sm: 1, md: 5, lg: 5, xl: 5 }}
                    actionColSpan={{ sm: 'full', md: 2, lg: 2, xl: 2 }}
                />
            </div>

            {/* Data Table (Standardized) */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                        พบข้อมูล {totalCount} รายการ
                    </h2>
                </div>

                <SmartTable
                    data={tableData}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: totalCount,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
                    }}
                    rowIdField="id"
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <EmployeeDeptFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={refetch}
            />
        </div>
    );
}



