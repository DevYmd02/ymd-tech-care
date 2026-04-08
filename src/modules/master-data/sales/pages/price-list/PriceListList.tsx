/**
 * @file PriceListList.tsx
 * @description List page for Price List Master Data
 */

import { useMemo } from 'react';
import { Edit2, Trash2, Layers } from 'lucide-react';
import PriceListFormModal from '@/modules/master-data/sales/pages/price-list/PriceListFormModal';
import { usePriceList } from '@master-data/sales/pages/price-list/hooks/usePriceList';
import type { PriceListHeader } from '@master-data/sales/pages/price-list/types/price-list.types';
import { ActiveStatusBadge, StatusBadge } from '@ui';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import { CheckCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

// ==================== CONFIG ====================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

export default function PriceListList() {
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
        handleApprove,
        handleModalClose
    } = usePriceList();

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'เลขที่ PRICE LIST', 
            type: 'text', 
            placeholder: 'ค้นหาด้วย เลขที่...' 
        },
        { 
            name: 'search2', 
            label: 'ชื่อ PRICE LIST', 
            type: 'text', 
            placeholder: 'ชื่อ Price List...' 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS 
        },
    ], []);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<PriceListHeader>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'price_list_no',
            header: 'เลขที่ PRICELIST',
            cell: ({ getValue }) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'price_list_name',
            header: 'ชื่อ PRICELIST',
        },
        {
            id: 'customer',
            header: 'ลูกค้า',
            cell: ({ row }) => {
                const { customer_code, customer_name } = row.original;
                if (!customer_code && !customer_name) return '-';
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{customer_code || '-'}</span>
                        <span className="text-xs text-gray-500">{customer_name || ''}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'begin_date',
            header: 'วันที่เริ่มต้น',
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString('th-TH') : '-',
        },
        {
            accessorKey: 'end_date',
            header: 'วันที่สิ้นสุด',
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString('th-TH') : '-',
        },
        {
            accessorKey: 'approve_status',
            header: 'สถานะอนุมัติ',
            cell: ({ getValue }) => {
                const status = getValue() as string || 'WAITING';
                return (
                    <StatusBadge 
                        status={status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รออนุมัติ'} 
                        variant={status === 'APPROVED' ? 'success' : 'warning'}
                    />
                );
            },
            size: 120,
        },
        {
            accessorKey: 'is_active',
            header: 'ใช้งาน',
            cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />,
            size: 100,
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 150,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {/* ปุ่มอนุมัติ - โชว์เฉพาะตอนรออนุมัติ */}
                    {row.original.approve_status !== 'APPROVED' && (
                        <button 
                            onClick={() => handleApprove(row.original.price_list_id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="อนุมัติรายการ"
                        >
                            <CheckCircle size={18} />
                        </button>
                    )}
                    
                    <button 
                        onClick={() => handleEdit(row.original.price_list_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.price_list_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete, handleApprove]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" />
                        กำหนดราคาสินค้า (Pricelist)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการรายการราคาสินค้าและเงื่อนไขพิเศษ
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
                    createLabel="สร้างราคาสินค้า"
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
                    rowIdField="price_list_id"
                    className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                />
            </div>

            {/* Modal */}
            <PriceListFormModal 
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
