/**
 * @file SalesAreaList.tsx
 * @description หน้ารายการข้อมูลเขตการขาย (Sales Area List)
 * @module sales
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    MapPin
} from 'lucide-react';
import { SalesAreaFormModal } from './SalesAreaFormModal';
import { SalesZoneService } from '@/modules/master-data/company/services/company.service';
import type { SalesZoneListItem } from '@/modules/master-data/types/master-data-types';
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

export default function SalesAreaList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'zone_code',
          search2: 'zone_name'
        }
    });

    const [allAreas, setAllAreas] = useState<SalesZoneListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสเขตการขาย', 
            type: 'text', 
            placeholder: 'กรอกรหัสเขตการขาย' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อเขตการขาย', 
            type: 'text', 
            placeholder: 'กรอกชื่อเขตการขาย' 
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
            const data = await SalesZoneService.getList();
            setAllAreas(data);
        } catch (error) {
            console.error('Failed to fetch sales areas:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ==================== CLIENT-SIDE FILTERING & PAGINATION ====================
    const filteredData = useMemo(() => {
        let result = [...allAreas];

        // Filter by Status
        if (filters.status !== 'ALL') {
            result = result.filter(item => 
                filters.status === 'ACTIVE' ? item.is_active : !item.is_active
            );
        }

        // Filter by Code
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => item.zone_code.toLowerCase().includes(term));
        }

        // Filter by Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => item.zone_name.toLowerCase().includes(term));
        }

        // Sort by Created Date Desc
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return result;
    }, [allAreas, filters]);

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
        if (confirm('คุณต้องการลบเขตการขายนี้หรือไม่?')) {
            SalesZoneService.delete(id).then(() => fetchData());
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<SalesZoneListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'zone_code',
            header: 'รหัสเขตการขาย',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'zone_name',
            header: 'ชื่อเขตการขาย (ไทย)',
        },
        {
            accessorKey: 'zone_name_en',
            header: 'ชื่อเขตการขาย (Eng)',
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
                        onClick={() => handleEdit(row.original.zone_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.zone_id)}
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
                        <MapPin className="text-blue-600" />
                        กำหนดเขตการขาย (Sales Area Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลเขตการขายในองค์กร
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
                    createLabel="เพิ่มเขตการขายใหม่"
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
            <SalesAreaFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={fetchData}
            />
        </div>
    );
}
