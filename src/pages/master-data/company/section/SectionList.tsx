/**
 * @file SectionList.tsx
 * @description หน้ารายการข้อมูลส่วนงาน (Section Master Data List) - Refactored for Standardization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Layers,
    RefreshCw
} from 'lucide-react';
import { SectionFormModal } from '@/pages/master-data/company/section/SectionFormModal';
import { SectionService } from '@/services/core/company.service';
import type { SectionListItem } from '@project-types/master-data-types';
import { useTableFilters } from '@/hooks/useTableFilters';
import FilterFormBuilder, { type FilterFieldConfig } from '@/components/shared/FilterFormBuilder';
import SmartTable from '@/components/ui/SmartTable';
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

export default function SectionList() {
    // ==================== STATE ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'section_code',
          search2: 'section_name',
          search3: 'department_code'
        }
    });

    const [allSections, setAllSections] = useState<SectionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสส่วนงาน/แผนก', 
            type: 'text', 
            placeholder: 'กรอกรหัสส่วนงาน' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อส่วนงาน/แผนก', 
            type: 'text', 
            placeholder: 'กรอกชื่อส่วนงาน' 
        },
        { 
            name: 'search3', 
            label: 'รหัสฝ่าย', 
            type: 'text', 
            placeholder: 'กรอกรหัสฝ่าย' 
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
            const data = await SectionService.getList();
            setAllSections(data);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ==================== CLIENT-SIDE FILTERING & PAGINATION ====================
    const filteredData = useMemo(() => {
        let result = [...allSections];

        // Filter by Status
        if (filters.status !== 'ALL') {
            result = result.filter(s => 
                filters.status === 'ACTIVE' ? s.is_active : !s.is_active
            );
        }

        // Filter by Code
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(s => s.section_code.toLowerCase().includes(term));
        }

        // Filter by Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(s => 
                s.section_name.toLowerCase().includes(term) || 
                (s.section_name_en && s.section_name_en.toLowerCase().includes(term))
            );
        }

        // Filter by Dept Code
        if (filters.search3) {
            const term = filters.search3.toLowerCase();
            result = result.filter(s => s.department_code && s.department_code.toLowerCase().includes(term));
        }

        // Sort by Created Date Desc
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return result;
    }, [allSections, filters]);

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
        if (confirm('คุณต้องการลบข้อมูลแผนก/ส่วนงานนี้หรือไม่?')) {
            SectionService.delete(id).then(() => fetchData());
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS (Matching Image 0) ====================
    const columns = useMemo<ColumnDef<SectionListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'section_code',
            header: 'รหัสแผนก',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'section_name',
            header: 'ชื่อแผนก (ไทย)',
        },
        {
            accessorKey: 'section_name_en',
            header: 'ชื่อแผนก (EN)',
            cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>
        },
        {
            accessorKey: 'department_code',
            header: 'รหัสฝ่าย',
            cell: ({ getValue }) => (
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                    {getValue() as string || '-'}
                </span>
            )
        },
        {
            accessorKey: 'department_name',
            header: 'ชื่อฝ่าย',
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.section_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.section_id)}
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
                        กำหนดรหัสแผนก (Department Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลแผนกต่างๆ ในแต่ละฝ่าย
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="รีเฟรช"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filter Section (Standardized) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name, value) => setFilters({ [name]: value })}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มแผนกใหม่"
                    accentColor="indigo"
                />
            </div>

            {/* Data Table (Standardized) */}
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
            <SectionFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={fetchData}
            />
        </div>
    );
}
