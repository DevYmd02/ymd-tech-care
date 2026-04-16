/**
 * @file EmployeeGroupList.tsx
 * @description หน้ารายการข้อมูลกลุ่มพนักงาน (Employee Group Master Data List)
 * @module company
 */

import { useState, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    UsersRound
} from 'lucide-react';
import { EmployeeGroupFormModal } from './EmployeeGroupFormModal';
import { logger } from '@/shared/utils/logger';
import { useEmployeeGroupList } from './hooks/useEmployeeGroupList';
import type { EmployeeGroupListItem } from '@company/types/employee-group.types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { EmployeeGroupService } from '@company/services/employee-group.service';

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

export default function EmployeeGroupList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'employee_group_code',
          search2: 'employee_group_name'
        }
    });


    const { groups, totalCount, isLoading, refetch } = useEmployeeGroupList(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสกลุ่ม', 
            type: 'text', 
            placeholder: 'กรอกรหัสกลุ่ม' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อกลุ่ม', 
            type: 'text', 
            placeholder: 'กรอกชื่อกลุ่ม' 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS 
        },
    ], []);

    // ==================== DATA MAPPING ====================
    const tableData = useMemo(() => groups, [groups]);

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        refetch();
        handleModalClose();
    };

    const handleModalClose = () => {
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleDelete = useCallback(async (id: string) => {
        if (confirm('คุณต้องการลบกลุ่มพนักงานนี้หรือไม่?')) {
            try {
                await EmployeeGroupService.delete(id);
                refetch();
            } catch (error) {
                logger.error('Failed to delete employee group:', error);
                alert('ไม่สามารถลบข้อมูลได้ในขณะนี้');
            }
        }
    }, [refetch]);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<EmployeeGroupListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'employee_group_code',
            header: 'รหัสกลุ่ม',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'employee_group_name',
            header: 'ชื่อกลุ่ม (ไทย)',
        },
        {
            accessorKey: 'employee_group_nameeng',
            header: 'ชื่อกลุ่ม (Eng)',
            cell: ({ getValue }) => getValue() || '-',
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
                        onClick={() => handleEdit(row.original.employee_group_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.employee_group_id)}
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
                        <UsersRound className="text-blue-600" />
                        กำหนดกลุ่มพนักงาน (Employee Group)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลกลุ่มพนักงานทั้งหมดในระบบ
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มกลุ่มพนักงาน"
                    accentColor="indigo"
                />
            </div>

            {/* Data Table */}
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
                    rowIdField="employee_group_id"
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <EmployeeGroupFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={handleModalSuccess}
            />

        </div>
    );
}



