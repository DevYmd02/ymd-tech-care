/**
 * @file PriceLevelList.tsx
 * @description List page for Price Level Master Data
 */

import { useMemo } from 'react';
import { Edit2, Trash2, DollarSign } from 'lucide-react';
import PriceLevelFormModal from './PriceLevelFormModal';
import { usePriceLevel } from './hooks/usePriceLevel';
import type { PriceLevel } from './types/price-level.types';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

export default function PriceLevelList() {
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
    } = usePriceLevel();

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters & string>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'ค้นหาสินค้า', 
            type: 'text', 
            placeholder: 'ค้นหาด้วย รหัสสินค้า หรือ ชื่อสินค้า...' 
        },
    ], []);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<PriceLevel>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'item_code',
            header: 'รหัสสินค้า',
            size: 130,
            cell: ({ getValue }) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getValue() as string || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'item_name',
            header: 'ชื่อสินค้า',
            size: 250,
        },
        {
            accessorKey: 'uom_name',
            header: 'หน่วยนับ',
            size: 100,
        },
        {
            accessorKey: 'item_from_qty',
            header: 'จำนวนเริ่มต้น',
            size: 110,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(),
        },
        {
            accessorKey: 'item_to_qty',
            header: 'ถึงจำนวน',
            size: 110,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(),
        },
        {
            accessorKey: 'item_price1',
            header: 'ระดับที่ 1',
            size: 90,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            accessorKey: 'item_price2',
            header: 'ระดับที่ 2',
            size: 90,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            accessorKey: 'item_price3',
            header: 'ระดับที่ 3',
            size: 90,
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 80,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-center">
                    <button 
                        onClick={() => handleEdit(row.original.multi_price_item_id || row.original.id || row.original.item_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.multi_price_item_id || row.original.id || row.original.item_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-blue-600" />
                        กำหนดราคาสินค้า (Price Level)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการระดับราคาสินค้าตามปริมาณการสั่งซื้อ
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
                    createLabel="กำหนดราคาสินค้า"
                    accentColor="blue"
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
                    rowIdField="multi_price_item_id"
                    className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                />
            </div>

            {/* Modal */}
            <PriceLevelFormModal 
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
