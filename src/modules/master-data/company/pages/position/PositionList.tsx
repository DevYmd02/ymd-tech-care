/**
 * @file PositionList.tsx
 * @description หน้ารายการข้อมูลตำแหน่ง (Position Master Data List)
 * @module company
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Briefcase
} from 'lucide-react';
import { PositionFormModal } from './PositionFormModal';
import { PositionService } from '@/modules/master-data/company/services/company.service';
import type { PositionListItem } from '@/modules/master-data/types/master-data-types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

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

export default function PositionList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'position_code',
          search2: 'position_name'
        }
    });

    const [allPositions, setAllPositions] = useState<PositionListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสตำแหน่ง', 
            type: 'text', 
            placeholder: 'กรอกรหัสตำแหน่ง' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อตำแหน่ง', 
            type: 'text', 
            placeholder: 'กรอกชื่อตำแหน่ง' 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS 
        },
    ], []);

    // ==================== DATA FETCHING ====================
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await PositionService.getList(filters);
            setAllPositions(response.items);
            setTotalCount(response.total);
        } catch (error) {
            console.error('Failed to fetch positions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ==================== DATA MAPPING ====================
    const tableData = useMemo(() => allPositions, [allPositions]);

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
        if (confirm('คุณต้องการลบตำแหน่งนี้หรือไม่?')) {
            PositionService.delete(id).then(() => fetchData());
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<PositionListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'position_code',
            header: 'รหัสตำแหน่ง',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'position_name',
            header: 'ชื่อตำแหน่ง (ไทย)',
        },
        {
            accessorKey: 'position_name_en',
            header: 'ชื่อตำแหน่ง (Eng)',
            cell: ({ getValue }) => getValue() || '-',
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
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.position_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.position_id)}
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
                        <Briefcase className="text-blue-600" />
                        กำหนดตำแหน่ง (Position)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลตำแหน่งงานทั้งหมดในระบบ
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
                    createLabel="เพิ่มตำแหน่งใหม่"
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
                    rowIdField="position_id"
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <PositionFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={fetchData}
            />
        </div>
    );
}



