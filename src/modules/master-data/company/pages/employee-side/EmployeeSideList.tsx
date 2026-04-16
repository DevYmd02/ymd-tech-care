/**
 * @file EmployeeSideList.tsx
 * @description List page for EmployeeSide Master Data (Formerly Department)
 * @module company
 */

import { useState, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Building
} from 'lucide-react';
import { EmployeeSideFormModal } from './EmployeeSideFormModal';
import { logger } from '@/shared/utils/logger';
import { useEmployeeSideList } from './hooks/useEmployeeSideList';
import type { EmployeeSideListItem } from '@master-data/types/master-data-types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { EmployeeSideService } from '@company/services/employee-side.service';

// ====================================================================================
// CONFIG
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function EmployeeSideList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'side_code',
          search2: 'side_name'
        }
    });

    const { sides, totalCount, isLoading, refetch } = useEmployeeSideList(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสฝ่าย', 
            type: 'text', 
            placeholder: 'กรอกรหัสฝ่าย' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อฝ่าย', 
            type: 'text', 
            placeholder: 'กรอกชื่อฝ่าย' 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS 
        },
    ], []);

    // ==================== DATA MAPPING ====================
    const tableData = useMemo(() => sides, [sides]);

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
        if (confirm('คุณต้องการลบข้อมูลฝ่ายนี้หรือไม่?')) {
            try {
                await EmployeeSideService.delete(id);
                refetch();
            } catch (error) {
                logger.error('Failed to delete department:', error);
                alert('ไม่สามารถลบข้อมูลได้ในขณะนี้');
            }
        }
    }, [refetch]);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setEditingId(null);
    }, []);

    const handleSaveSuccess = useCallback(() => {
        refetch();
        handleModalClose();
    }, [refetch, handleModalClose]);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<EmployeeSideListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'emp_side_code', // Priority Field
            header: 'รหัสฝ่าย',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {row.original.emp_side_code || row.original.side_code || row.original.department_code}
                </span>
            ),
        },
        {
            accessorKey: 'emp_side_name', // Priority Field
            header: 'ชื่อฝ่าย (ไทย)',
            cell: ({ row }) => row.original.emp_side_name || row.original.side_name || row.original.department_name,
        },
        {
            accessorKey: 'emp_side_nameeng', // Priority Field
            header: 'ชื่อฝ่าย (EN)',
            cell: ({ row }) => <span className="text-gray-500">{row.original.emp_side_nameeng || row.original.side_nameeng || row.original.department_name_en || '-'}</span>
        },
        {
            accessorKey: 'is_active',
            header: 'สถานะ',
            cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />,
            size: 100,
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.emp_side_id || row.original.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.emp_side_id || row.original.id)}
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
                        <Building className="text-blue-600" />
                        กำหนดรหัสฝ่าย (Employee Side Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลฝ่ายทั้งหมดในระบบ
                    </p>
                </div>
                <div className="flex items-center gap-2">
                </div>
            </div>

            {/* Filter Section (Standardized) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มรหัสฝ่ายใหม่"
                    accentColor="indigo"
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
                    rowIdField="emp_side_id"
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <EmployeeSideFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={handleSaveSuccess}
            />
        </div>
    );
}



