/**
 * @file BranchList.tsx
 * @description หน้ารายการข้อมูลสาขา (Branch Master Data List) - Refactored for Standardization
 * @module company
 */

import { useState, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Building2
} from 'lucide-react';
import { BranchFormModal } from './BranchFormModal';
import { BranchService } from '@/modules/master-data';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export default function BranchList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'branch_code', // Semantic URL params
          search2: 'branch_name'
        }
    });

    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสสาขา', 
            type: 'text', 
            placeholder: 'กรอกรหัสสาขา' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อสาขา', 
            type: 'text', 
            placeholder: 'กรอกชื่อสาขา' 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS 
        },
    ], []);

    // ==================== DATA FETCHING ====================
    const { data: response, isLoading } = useQuery({
        queryKey: ['branches', filters],
        queryFn: async () => {
            const res = await BranchService.getList(filters);
            // Normalize: Handle both Paginated object and raw Array formats
            const items = Array.isArray(res) ? res : (res?.items ?? []);
            const total = Array.isArray(res) ? res.length : (res?.total ?? 0);
            return { items, total };
        },
        refetchOnWindowFocus: false,
    });

    // ==================== DATA MAPPING ====================
    const tableData = response?.items || [];
    const totalCount = response?.total || 0;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => BranchService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
        }
    });

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback((id: string) => {
        if (confirm('คุณต้องการลบข้อมูลสาขานี้หรือไม่?')) {
            deleteMutation.mutate(id);
        }
    }, [deleteMutation]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<BranchListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'branch_code',
            header: 'รหัสสาขา',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'branch_name',
            header: 'ชื่อสาขา',
        },
        {
            accessorKey: 'is_active',
            header: 'สถานะ',
            cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />,
            size: 100,
        },
        {
            accessorKey: 'created_at',
            header: 'วันที่สร้าง',
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString('th-TH') : '-',
        },
        {
            accessorKey: 'updated_at',
            header: 'วันที่แก้ไข',
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString('th-TH') : '-',
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.branch_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.branch_id)}
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
                        <Building2 className="text-blue-600" />
                        กำหนดสาขา (Branch Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลสาขาทั้งหมดในระบบ
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
                    onSearch={() => handlePageChange(1)} // Reset to page 1 on search
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มสาขาใหม่"
                    accentColor="indigo" // Change to indigo (blue-navy)
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
                    rowIdField="branch_id"
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <BranchFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
            />
        </div>
    );
}



