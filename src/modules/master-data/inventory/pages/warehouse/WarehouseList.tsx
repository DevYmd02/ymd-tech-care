/**
 * @file WarehouseList.tsx
 * @description หน้ารายการข้อมูลคลังสินค้า (Warehouse Master Data List)
 */

import { useState, useMemo, useCallback } from 'react';
import { Warehouse, Edit2, Trash2 } from 'lucide-react';
import { WarehouseFormModal } from './WarehouseFormModal';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import { ActiveStatusBadge } from '@ui/StatusBadge';
import { FilterFormBuilder, type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { useTableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

export default function WarehouseList() {
    // ==================== STATE & FILTERS ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange, 
        resetFilters,
        handleSortChange,
        sortConfig 
    } = useTableFilters({
        defaultLimit: 10,
        customParamKeys: {
            search: 'code',
            search2: 'name',
            status: 'status'
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<Extract<keyof typeof filters, string>>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสหรือชื่อคลัง', 
            type: 'text', 
            placeholder: 'กรอกรหัส หรือชื่อคลัง',
            colSpan: 1
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS,
            colSpan: 1
        },
    ], []);

    // ==================== DATA FETCHING ====================
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['warehouses', filters],
        queryFn: async () => {
            const result = await WarehouseService.getAll();
            let items = result.items || [];
            
            // Client-side filtering
            if (filters.status !== 'ALL') {
                items = items.filter(w => filters.status === 'ACTIVE' ? w.is_active : !w.is_active);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(w => 
                    w.warehouse_code.toLowerCase().includes(term) ||
                    w.warehouse_name.toLowerCase().includes(term) ||
                    (w.branch_name && w.branch_name.toLowerCase().includes(term))
                );
            }

            // Sorting
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof WarehouseListItem];
                    const fieldValB = b[sortConfig.key as keyof WarehouseListItem];
                    
                    const valA = fieldValA !== undefined && fieldValA !== null ? String(fieldValA) : '';
                    const valB = fieldValB !== undefined && fieldValB !== null ? String(fieldValB) : '';
                    
                    return sortConfig.direction === 'asc' 
                        ? valA.localeCompare(valB, 'th') 
                        : valB.localeCompare(valA, 'th');
                });
            }

            const total = items.length;
            const start = (filters.page - 1) * filters.limit;
            const paginatedItems = items.slice(start, start + filters.limit);

            return { items: paginatedItems, total };
        }
    });

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback(async (id: string) => {
        if (confirm('คุณต้องการลบข้อมูลคลังสินค้านี้หรือไม่?')) {
            await WarehouseService.delete(id);
            refetch();
        }
    }, [refetch]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<WarehouseListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'warehouse_code',
            header: 'รหัสคลัง',
            cell: ({ getValue, row }) => (
                <span 
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original.warehouse_id)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 150,
        },
        {
            accessorKey: 'warehouse_name',
            header: 'ชื่อคลังสินค้า',
        },
        {
            accessorKey: 'branch_name',
            header: 'สาขา',
            cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>,
            meta: { className: "hidden md:table-cell" } // Example of using meta if SmartTable supports it or just use className in cell/header if needed
        },
        {
            accessorKey: 'is_active',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: ({ getValue }) => (
                <div className="flex justify-center">
                    <ActiveStatusBadge isActive={getValue() as boolean} />
                </div>
            ),
            size: 100,
        },
        {
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.warehouse_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.warehouse_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        <Warehouse className="text-blue-600" />
                        กำหนดรหัสคลังสินค้า (Warehouse)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลคลังสินค้าทั้งหมด
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name, value) => {
                        setFilters({ [name]: value } as Partial<typeof filters>);
                    }}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มคลังสินค้าใหม่"
                    accentColor="indigo"
                    columns={{ sm: 1, md: 5, lg: 5, xl: 5 }}
                    actionColSpan={{ sm: 'full', md: 3, lg: 3, xl: 3 }}
                    actionAlign="end"
                />
            </div>

            {/* Data Table Section */}
            <div className="flex flex-col gap-4">
                <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                    พบข้อมูล {response?.total || 0} รายการ
                </h2>

                <SmartTable
                    data={response?.items || []}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: response?.total || 0,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
                    }}
                    sortConfig={sortConfig}
                    onSortChange={handleSortChange}
                    rowIdField="warehouse_id"
                    className="shadow-sm border border-gray-200 dark:border-gray-700"
                />
            </div>

            <WarehouseFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={refetch}
            />
        </div>
    );
}
