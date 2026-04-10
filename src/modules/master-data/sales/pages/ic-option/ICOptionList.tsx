import { useMemo } from 'react';
import { Edit2, Trash2, Settings } from 'lucide-react';
import ICOptionFormModal from './ICOptionFormModal';
import { useICOption } from './hooks/useICOption';
import type { ICOption } from './types/ic-option.types';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

export default function ICOptionList() {
    const {
        filters,
        setFilters,
        handlePageChange,
        resetFilters,
        isLoading,
        isModalOpen,
        editingId,
        filteredData,
        paginatedData,
        fetchData,
        handleCreateNew,
        handleEdit,
        handleDelete,
        handleModalClose
    } = useICOption();

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters & string>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'ค้นหา', 
            type: 'text', 
            placeholder: 'ค้นหาด้วยรหัสสาขา/Aging...' 
        },
    ], []);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<ICOption>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'branch_id',
            header: 'รหัสสาขา',
            size: 150,
            cell: ({ getValue }) => (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {getValue() as string || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'aging_expire',
            header: 'Aging สินค้ามีอายุ',
            size: 150,
        },
        {
            accessorKey: 'set_price1',
            header: 'ราคาขาย 1',
            size: 100,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            accessorKey: 'set_price2',
            header: 'ราคาขาย 2',
            size: 100,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            accessorKey: 'check_deficit',
            header: 'ตรวจสอบติดลบ',
            size: 120,
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getValue() === '1' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {getValue() === '1' ? 'เปิดใช้งาน' : 'ปิด'}
                </span>
            ),
        },
        {
            accessorKey: 'check_standcost',
            header: 'เช็คราคามาตรฐาน',
            size: 130,
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getValue() === '1' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {getValue() === '1' ? 'เปิดใช้งาน' : 'ปิด'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 80,
            cell: ({ row }) => {
                const id = row.original.ic_option_id;
                return (
                    <div className="flex items-center gap-2 text-center">
                        <button 
                            onClick={() => id && handleEdit(id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="แก้ไข"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => id && handleDelete(id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="ลบ"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                );
            },
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Settings className="text-indigo-600" />
                        กำหนดราคาสินค้า (Base IC Option)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการตั้งค่าเงื่อนไขสินค้าคงคลังและราคามาตรฐาน
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
                    createLabel="เพิ่ม IC Option"
                    accentColor="indigo"
                />
            </div>

            {/* Data Table */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                        รายการทั้งหมด ({filteredData.length})
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
                    rowIdField="ic_option_id"
                    className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                />
            </div>

            {/* Modal */}
            <ICOptionFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={() => {
                    handleModalClose();
                    fetchData();
                }}
            />
        </div>
    );
}
