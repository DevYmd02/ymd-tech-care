/**
 * @file ItemMasterList.tsx
 * @description รายการสินค้า (Item Master) - Refactored for Standardization
 * @purpose แสดงรายการสินค้า ใช้ SmartTable และ FilterFormBuilder ตาม Pattern UOMList
 */
import { useState, useMemo, useCallback } from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { logger } from '@/shared/utils';
import type { ItemListItem } from '@master-data/types/master-data-types';
import { ItemMasterFormModal } from './ItemMasterFormModal';
import { ItemLotModal } from './components/ItemLotModal';


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
    const [editId, setEditId] = useState<number | null>(null);
    
    // Lot Modal State
    const [isLotModalOpen, setIsLotModalOpen] = useState(false);
    const [selectedItemForLot, setSelectedItemForLot] = useState<{ id: number; code: string; name: string } | null>(null);


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
        queryKey: ['items', filters, sortConfig],
        queryFn: async () => {
            const apiParams = {
                page: filters.page,
                limit: filters.limit,
                item_code: filters.search,     // Map search input to item_code
                item_name: filters.search2,    // Map search2 input to item_name
                status: filters.status === 'ALL' ? undefined : filters.status,
                sort_by: sortConfig?.key,
                sort_direction: sortConfig?.direction
            };
            
            const result = await ItemMasterService.getAll(apiParams);
            return { 
                items: result.items || [], 
                total: result.total || 0 
            };
        },
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });

    // ==================== HANDLERS ====================
    const handleCreateNew = useCallback(() => {
        setEditId(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: number) => {
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

    const deleteMutation = useMutation({
        mutationFn: (id: number) => ItemMasterService.delete(id),
        onSuccess: async () => {
            await confirm({
                title: 'ลบข้อมูลเรียบร้อยแล้ว!',
                description: 'ระบบได้ทำการลบข้อมูลสินค้าเรียบร้อยแล้ว',
                confirmText: 'ตกลง',
                variant: 'success',
                hideCancel: true
            });
            queryClient.invalidateQueries({ queryKey: ['items'] });
        },
        onError: async (error: unknown) => {
            logger.error('Delete item error:', error);
            const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: errorMessage,
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleDelete = useCallback(async (id: number, code: string) => {
        const isConfirmed = await confirm({
            title: 'คุณต้องการลบสินค้า?',
            description: `ต้องการลบรหัสสินค้า ${code} ใช่หรือไม่?`,
            confirmText: 'ลบข้อมูล',
            cancelText: 'ยกเลิก',
            variant: 'danger'
        });

        if (isConfirmed) {
            deleteMutation.mutate(id);
        }
    }, [confirm, deleteMutation]);

    const handleLotManage = useCallback((id: number, code: string, name: string) => {
        setSelectedItemForLot({ id, code, name });
        setIsLotModalOpen(true);
    }, []);


    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<ItemListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            meta: {
                thClassName: 'text-center',
                tdClassName: 'text-center'
            },
            size: 50,
            enableSorting: false,
        },
        {
            accessorKey: 'item_code',
            header: 'รหัสสินค้า',
            enableSorting: false,
            cell: ({ getValue, row }) => (
                <span 
                    className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original.item_id)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 100,
        },

        {
            accessorKey: 'item_name',
            header: 'ชื่อสินค้า (ไทย)',
            enableSorting: false,
            cell: ({ getValue }) => <span className="line-clamp-2 whitespace-normal block w-full" title={getValue() as string}>{getValue() as string}</span>,
        },

        {
            accessorKey: 'item_category_name',
            header: 'หมวดหมู่',
            enableSorting: false,
            cell: ({ row }) => <span className="whitespace-nowrap text-gray-700 dark:text-gray-300">{row.original.item_category_name || '-'}</span>,
            size: 180,
        },


        {
            accessorKey: 'item_brand_name',
            header: 'ยี่ห้อ',
            enableSorting: false,
            cell: ({ row }) => <span className="text-gray-700 dark:text-gray-300">{row.original.item_brand_name || '-'}</span>,
            size: 100,
        },

        {
            accessorKey: 'item_type_name',
            header: 'ประเภท',
            enableSorting: false,
            meta: {
                thClassName: 'text-center',
                tdClassName: 'text-center'
            },
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                        {row.original.item_type_name || '-'}
                    </span>
                </div>
            ),
            size: 100,
        },


        {
            accessorKey: 'base_uom_name',


            header: 'หน่วยนับ',
            enableSorting: false,
            meta: {
                thClassName: 'text-center',
                tdClassName: 'text-center'
            },
            cell: ({ row }) => <span className="text-gray-600 dark:text-gray-300 block w-full text-center">{row.original.base_uom_name || '-'}</span>,
            size: 80,
        },


        {
            accessorKey: 'is_active',
            header: 'สถานะ',
            enableSorting: false,
            meta: {
                thClassName: 'text-center',
                tdClassName: 'text-center'
            },
            cell: ({ getValue }) => (
                <ActiveStatusBadge isActive={getValue() as boolean} />
            ),
            size: 80,
        },

        {
            id: 'actions',
            header: 'จัดการ',
            meta: {
                thClassName: 'text-center',
                tdClassName: 'text-center'
            },
            size: 120,
            enableSorting: false,

            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1">
                    {/* Lot Manage Button - Option 1.5: Ghost Text Style */}
                    {(row.original.is_batch_control || row.original.lot_tracking_level !== 'NONE') && (
                        <button 
                            onClick={() => handleLotManage(row.original.item_id, row.original.item_code, row.original.item_name)}
                            className="px-2 py-1.5 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                            title="จัดการ Lot Number"
                        >
                            LOT
                        </button>
                    )}

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
    ], [filters.page, filters.limit, handleEdit, handleDelete, handleLotManage]);


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

            <ItemLotModal
                isOpen={isLotModalOpen}
                onClose={() => setIsLotModalOpen(false)}
                item={selectedItemForLot}
            />
        </div>
    );
}

