/**
 * @file StandardCostList.tsx
 * @description List page for Standard Cost Master Data
 */

import { useMemo, useState } from 'react';
import { Edit2, Trash2, ShieldCheck } from 'lucide-react';
import StandardCostFormModal from './StandardCostFormModal';
import { useStandardCost } from './hooks/useStandardCost';
import type { StandardCostHeader } from './types/standard-cost.types';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

export default function StandardCostList() {
    const {
        data,
        isLoading,
        filter,
        handleDelete,
        handleSearch,
        refresh
    } = useStandardCost();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: number) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filter>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'ค้นหา', 
            type: 'text', 
            placeholder: 'ค้นหาด้วย เลขที่ หรือ ชื่อต้นทุน...' 
        },
    ], []);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<StandardCostHeader>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filter.page - 1) * filter.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'docu_date',
            header: 'วันที่เอกสาร',
            size: 120,
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString() : '-',
        },
        {
            accessorKey: 'cost_code',
            header: 'รหัสต้นทุน',
            size: 130,
            cell: ({ getValue }) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getValue() as string || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'start_date',
            header: 'วันที่เริ่มต้น',
            size: 120,
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString() : '-',
        },
        {
            accessorKey: 'expire_date',
            header: 'วันที่สิ้นสุด',
            size: 120,
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString() : '-',
        },
        {
            accessorKey: 'is_active',
            header: 'สถานะ',
            size: 100,
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getValue() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                    {getValue() ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                </span>
            ),
        },
        {
            accessorKey: 'item_brand_name',
            header: 'ยี่ห้อสินค้า',
            size: 150,
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 80,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-center">
                    <button 
                        onClick={() => handleEdit(row.original.cost_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.cost_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filter.page, filter.limit, handleDelete]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" />
                        กำหนดราคาซื้อและต้นทุนมาตรฐาน
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการราคาซื้อและต้นทุนมาตรฐานของสินค้า
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filter}
                    onFilterChange={(_, value) => handleSearch(value as string)}
                    onSearch={() => refresh()}
                    onReset={() => handleSearch('')}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มต้นทุนมาตรฐาน"
                    accentColor="blue"
                />
            </div>

            {/* Data Table Section */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-gray-700 dark:text-gray-300 font-semibold">
                            รายการต้นทุนมาตรฐาน
                        </h2>
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full font-bold border border-blue-100 dark:border-blue-800/50">
                            {data.length} รายการ
                        </span>
                    </div>
                </div>

                <SmartTable
                    data={data}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filter.page,
                        pageSize: filter.limit,
                        totalCount: data.length,
                        onPageChange: () => refresh(),
                        onPageSizeChange: () => refresh(),
                    }}
                    rowIdField="cost_id"
                    className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                />
            </div>

            {/* Modal */}
            <StandardCostFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={() => {
                    handleModalClose();
                    refresh();
                }}
            />
        </div>
    );
}
