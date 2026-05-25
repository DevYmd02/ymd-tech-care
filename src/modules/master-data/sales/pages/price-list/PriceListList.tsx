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
import { logger } from '@/shared/utils';
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
            size: 150,
            cell: ({ getValue }) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getValue() as string}
                </span>
            ),
        },
        {
            accessorKey: 'price_list_name',
            header: 'ชื่อ PRICELIST',
            size: 220,
        },
        {
            id: 'customer',
            header: 'ลูกค้า',
            size: 180,
            cell: ({ row }) => {
                const data = row.original;
                const code = data.customer_code || data.customer_id_code || '-';
                const name = data.customer_name_th || data.customer_name || '';
                
                if (code === '-' && !name) return '-';
                
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</span>
                        <span className="text-xs text-blue-500 font-medium">{code}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'begin_date',
            header: 'วันที่เริ่มต้น',
            size: 100,
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString('th-TH') : '-',
        },
        {
            accessorKey: 'end_date',
            header: 'วันที่สิ้นสุด',
            size: 100,
            cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString('th-TH') : '-',
        },
        {
            accessorKey: 'status', // changed from approve_status to match API's "status": "APPROVED" field
            header: 'สถานะอนุมัติ',
            size: 110,
            cell: ({ row }) => {
                const status = row.original.status || row.original.approve_status || 'WAITING';
                return (
                    <StatusBadge 
                        status={status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รออนุมัติ'} 
                        variant={status === 'APPROVED' ? 'success' : 'warning'}
                    />
                );
            },
        },
        {
            accessorKey: 'is_active',
            header: 'ใช้งาน',
            size: 70,
            cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />,
        },
        {
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            size: 180,
            cell: ({ row }) => {
                const isApproved = row.original.status === 'APPROVED' || row.original.approve_status === 'APPROVED';
                return (
                    <div className="flex items-center justify-center gap-2">
                        {/* ปุ่มอนุมัติ - โชว์เฉพาะตอนรออนุมัติ */}
                        {!isApproved && (
                            <button 
                                onClick={() => handleApprove(String(row.original.price_list_header_id || row.original.price_list_id || ''))}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/50"
                                title="อนุมัติรายการ"
                            >
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold whitespace-nowrap">อนุมัติ</span>
                            </button>
                        )}
                        
                        <button 
                            onClick={() => {
                                const actualId = row.original.price_list_header_id || row.original.price_list_id;
                                logger.debug('📑 Editing Price List Row (ID Found):', actualId);
                                handleEdit(String(actualId || ''));
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="แก้ไข"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(String(row.original.price_list_header_id || row.original.price_list_id || ''))}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="ลบ"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                );
            },
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
