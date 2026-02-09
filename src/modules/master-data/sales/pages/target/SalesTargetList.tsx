/**
 * @file SalesTargetList.tsx
 * @description หน้ารายการข้อมูลเป้าการขาย (Sales Target List)
 * @module sales
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Target
} from 'lucide-react';
import { SalesTargetFormModal } from './SalesTargetFormModal';
import { SalesTargetService } from '@/modules/master-data/company/services/company.service';
import type { SalesTargetListItem } from '@/modules/master-data/types/master-data-types';
import { ActiveStatusBadge } from '@/shared/components/ui/StatusBadge';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import SmartTable from '@/shared/components/ui/SmartTable';
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

export default function SalesTargetList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'target_code',
          search2: 'target_name'
        }
    });

    const [allTargets, setAllTargets] = useState<SalesTargetListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสเป้าการขาย', 
            type: 'text', 
            placeholder: 'กรอกรหัสเป้าการขาย' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อเป้าการขาย', 
            type: 'text', 
            placeholder: 'กรอกชื่อเป้าการขาย' 
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
            const data = await SalesTargetService.getList();
            setAllTargets(data);
        } catch (error) {
            console.error('Failed to fetch sales targets:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ==================== CLIENT-SIDE FILTERING & PAGINATION ====================
    const filteredData = useMemo(() => {
        let result = [...allTargets];

        // Filter by Status
        if (filters.status !== 'ALL') {
            result = result.filter(item => 
                filters.status === 'ACTIVE' ? item.is_active : !item.is_active
            );
        }

        // Filter by Code
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => item.target_code.toLowerCase().includes(term));
        }

        // Filter by Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => item.target_name.toLowerCase().includes(term));
        }

        // Sort by Created Date Desc
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return result;
    }, [allTargets, filters]);

    // Pagination Slicing
    const paginatedData = useMemo(() => {
        const startIndex = (filters.page - 1) * filters.limit;
        return filteredData.slice(startIndex, startIndex + filters.limit);
    }, [filteredData, filters.page, filters.limit]);

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
        if (confirm('คุณต้องการลบเป้าการขายนี้หรือไม่?')) {
            SalesTargetService.delete(id).then(() => fetchData());
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<SalesTargetListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'target_code',
            header: 'รหัสเป้าการขาย',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'target_name',
            header: 'ชื่อเป้าการขาย',
        },
        {
            accessorKey: 'amount',
            header: 'ยอดเป้าหมาย (บาท)',
            cell: ({ getValue }) => (getValue() as number).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
        },
        {
            accessorKey: 'year',
            header: 'ปี/งวด',
            cell: ({ row }) => `${row.original.year} / ${row.original.period}`,
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
                        onClick={() => handleEdit(row.original.target_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.target_id)}
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
                        <Target className="text-blue-600" />
                        กำหนดเป้าการขาย (Sales Target Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลเป้าการขาย
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name, value) => setFilters({ [name]: value })}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มเป้าการขาย"
                    accentColor="indigo"
                />
            </div>

            {/* Data Table */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                        พบข้อมูล {filteredData.length} รายการ
                    </h2>
                </div>

                <SmartTable
                    data={paginatedData}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: filteredData.length,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
                    }}
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <SalesTargetFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={fetchData}
            />
        </div>
    );
}
