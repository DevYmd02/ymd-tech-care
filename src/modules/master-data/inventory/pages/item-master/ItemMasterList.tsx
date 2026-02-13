/**
 * @file ItemMasterList.tsx
 * @description รายการสินค้า (Item Master) - Refactored for Standardization
 * @purpose แสดงรายการสินค้า ใช้ SmartTable และ FilterFormBuilder ตาม Pattern UnitList
 */
import { useState, useMemo, useCallback } from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { ItemMasterFormModal } from './ItemMasterFormModal';
import { ActiveStatusBadge } from '@ui';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

// ====================================================================================
// CONFIG
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

export default function ItemMasterList() {
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
            search: 'item_code',
            search2: 'item_name',
            status: 'status'
        }
    });

    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<Extract<keyof typeof filters, string>>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสสินค้า', 
            type: 'text', 
            placeholder: 'กรอกรหัสสินค้า',
            colSpan: 1
        },
        { 
            name: 'search2', 
            label: 'ชื่อสินค้า', 
            type: 'text', 
            placeholder: 'กรอกชื่อสินค้า',
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
    const { data: response, isLoading } = useQuery({
        queryKey: ['items', filters],
        queryFn: async () => {
            const result = await ItemMasterService.getAll();
            let items = result.items || [];
            
            // Client-side filtering (mocking server behavior)
            if (filters.status !== 'ALL') {
                items = items.filter(u => filters.status === 'ACTIVE' ? u.is_active : !u.is_active);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(u => u.item_code.toLowerCase().includes(term));
            }
             if (filters.search2) {
                const term = filters.search2.toLowerCase();
                items = items.filter(u => 
                    u.item_name.toLowerCase().includes(term) || 
                    (u.item_name_en && u.item_name_en.toLowerCase().includes(term))
                );
            }
            
            // Sorting
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof ItemListItem];
                    const fieldValB = b[sortConfig.key as keyof ItemListItem];
                    
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
        },
        staleTime: 1000 * 60 * 5, // 5 minutes stale time
        refetchOnWindowFocus: false,
    });

    // ==================== HANDLERS ====================
    const handleCreateNew = useCallback(() => {
        setEditId(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setEditId(id);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setEditId(null);
    }, []);

    const handleModalSuccess = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        setIsModalOpen(false);
        setEditId(null);
    }, [queryClient]);

    const handleDelete = useCallback(async (id: string, code: string) => {
        const isConfirmed = await confirm({
            title: 'คุณต้องการลบสินค้า?',
            description: `ต้องการลบรหัสสินค้า ${code} ใช่หรือไม่?`,
            confirmText: 'ลบข้อมูล',
            cancelText: 'ยกเลิก',
            variant: 'danger'
        });

        if (isConfirmed) {
            const success = await ItemMasterService.delete(id);
            if (success) {
                await confirm({
                    title: 'ลบข้อมูลเรียบร้อยแล้ว!',
                    description: 'ระบบได้ทำการลบข้อมูลสินค้าเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                queryClient.invalidateQueries({ queryKey: ['items'] });
            } else {
                await confirm({
                    title: 'เกิดข้อผิดพลาด',
                    description: 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                    confirmText: 'ตกลง',
                    variant: 'danger',
                    hideCancel: true
                });
            }
        }
    }, [queryClient, confirm]);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<ItemListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'item_code',
            header: 'รหัสสินค้า',
            cell: ({ getValue, row }) => (
                <span 
                    className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original.item_id)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 150,
        },
        {
            accessorKey: 'item_name',
            header: 'ชื่อสินค้า (ไทย)',
            size: 200,
        },
        {
            accessorKey: 'item_name_en',
            header: 'ชื่อสินค้า (Eng)',
            cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>,
            size: 200,
        },
        {
            accessorKey: 'category_name',
            header: 'หมวดหมู่',
            cell: ({ getValue }) => <span className="text-gray-700 dark:text-gray-300">{getValue() as string}</span>,
            size: 150,
        },
        {
            accessorKey: 'item_type_code',
            header: 'ประเภท',
            cell: ({ getValue }) => (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {getValue() as string || '-'}
                </span>
            ),
            size: 100,
        },
        {
            accessorKey: 'unit_name',
            header: 'หน่วยนับ',
            cell: ({ getValue }) => <span className="text-gray-600 dark:text-gray-300">{getValue() as string}</span>,
            size: 100,
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
                        onClick={() => handleEdit(row.original.item_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.item_id, row.original.item_code)}
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
                        <Package className="text-blue-600" />
                        กำหนดรหัสสินค้าและบริการ (Item Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลสินค้าและบริการในระบบ
                    </p>
                </div>
            </div>

            {/* Filter Section */}
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
                    createLabel="เพิ่มสินค้าใหม่"
                    accentColor="indigo"
                    columns={{ sm: 1, md: 5, lg: 5, xl: 5 }}
                    actionColSpan={{ sm: 'full', md: 2, lg: 2, xl: 2 }}
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
                    rowIdField="item_id"
                    className="shadow-sm border border-gray-200 dark:border-gray-700"
                />
            </div>

            <ItemMasterFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                editId={editId}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}



