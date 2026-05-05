import { useState, useCallback, useMemo } from 'react';
import { 
    Edit2, 
    Trash2, 
    Layers
} from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { EmployeeDeptFormModal } from './EmployeeDeptFormModal';
import { useEmployeeDeptList } from './hooks/useEmployeeDeptList';
import type { EmployeeDeptListItem } from '@company/types/employee-dept.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { EmployeeDeptService } from '@company/services/employee-dept.service';
import { EmployeeSideService } from '@company/services/employee-side.service';
import { useQuery } from '@tanstack/react-query';
import type { EmployeeSideMaster } from '@company/types/employee-side.types';

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
          search: 'emp_dept_code',
          search2: 'emp_dept_name',
          search3: 'emp_side_code',
          search4: 'is_active'
        }
    });

    const { depts, totalCount, isLoading, refetch } = useEmployeeDeptList(filters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);

    // Fetch Sides for matching (Since /department API doesn't return side details)
    const { data: sidesData } = useQuery({
        queryKey: ['employee-sides-lookup'],
        queryFn: () => EmployeeSideService.getList({ page: 1, limit: 1000 }),
    });

    const sideMap = useMemo(() => {
        const map: Record<string, EmployeeSideMaster> = {};
        sidesData?.items?.forEach(side => {
            const id = side.emp_side_id || side.side_id;
            if (id !== undefined && id !== null) {
                map[String(id)] = side;
            }
        });
        return map;
    }, [sidesData]);

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
        { 
            name: 'search4', 
            label: 'สถานะ', 
            type: 'select', 
            options: [
                { label: '-- ทั้งหมด --', value: '' },
                { label: 'ใช้งาน', value: 'true' },
                { label: 'ไม่ใช้งาน', value: 'false' },
            ],
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
                const response = await EmployeeDeptService.delete(id);
                if (response) refetch();
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

    // ==================== TABLE COLUMNS (Matching DB Schema) ====================
    const columns = useMemo<ColumnDef<EmployeeDeptListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'emp_dept_code',
            header: 'รหัสแผนก',
            cell: ({ row }) => (
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {row.original.emp_dept_code || row.original.dept_code || row.original.section_code}
                </span>
            ),
        },
        {
            accessorKey: 'emp_dept_name',
            header: 'ชื่อแผนก (ไทย)',
            cell: ({ row }) => row.original.emp_dept_name || row.original.dept_name || row.original.section_name,
        },
        {
            accessorKey: 'emp_dept_nameeng',
            header: 'ชื่อแผนก (EN)',
            cell: ({ row }) => (
                <span className="text-gray-500">
                    {row.original.emp_dept_nameeng || row.original.dept_nameeng || row.original.section_name_en || '-'}
                </span>
            )
        },
        {
            accessorKey: 'emp_side_code',
            header: 'รหัสฝ่าย',
            cell: ({ row }) => {
                const sideId = row.original.emp_side_id || row.original.side_id || row.original.department_id;
                const side = (sideId !== undefined && sideId !== null) ? sideMap[String(sideId)] : null;
                const code = side?.emp_side_code || side?.side_code || side?.department_code || row.original.emp_side_code || row.original.side_code || '-';
                
                return (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-medium border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400">
                        {code}
                    </span>
                );
            }
        },
        {
            accessorKey: 'emp_side_name',
            header: 'ชื่อฝ่าย',
            cell: ({ row }) => {
                const sideId = row.original.emp_side_id || row.original.side_id || row.original.department_id;
                const side = (sideId !== undefined && sideId !== null) ? sideMap[String(sideId)] : null;
                return side?.emp_side_name || side?.side_name || side?.department_name || row.original.emp_side_name || row.original.side_name || '-';
            },
        },
        {
            accessorKey: 'is_active',
            header: 'สถานะ',
            size: 100,
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${
                        isActive 
                            ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                            : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-400'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.emp_dept_id || row.original.id)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.emp_dept_id || row.original.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleDelete, sideMap]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-indigo-600" />
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
                    columns={{ sm: 1, md: 3, lg: 6, xl: 6 }}
                    actionColSpan={{ sm: 'full', md: 'full', lg: 2, xl: 2 }}
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
                    rowIdField="emp_dept_id"
                    className="shadow-sm"
                />
            </div>

            {/* Modal */}
            <EmployeeDeptFormModal
                key={editingId || 'new'}
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={handleSaveSuccess}
            />
        </div>
    );
}



