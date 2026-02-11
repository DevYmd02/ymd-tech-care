/**
 * @file ItemBarcodeList.tsx
 * @description หน้าแสดงรายการบาร์โค้ดสินค้า (Item Barcode List)
 */

import { useState, useMemo, useCallback } from 'react';
import { ScanBarcode, Edit2, Trash2 } from 'lucide-react';
import { ItemBarcodeFormModal } from './ItemBarcodeFormModal';
import { ItemBarcodeService } from '@/modules/master-data/inventory/services/item-barcode.service';
import type { ItemBarcodeListItem } from '@/modules/master-data/types/master-data-types';
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

export default function ItemBarcodeList() {
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
            label: 'รหัสสินค้า/บาร์โค้ด', 
            type: 'text', 
            placeholder: 'กรอกรหัส หรือบาร์โค้ด',
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
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['item-barcodes', filters],
        queryFn: async () => {
            const result = await ItemBarcodeService.getAll();
            let items = result.items || [];
            
            // Client-side filtering
            if (filters.status !== 'ALL') {
                items = items.filter(i => filters.status === 'ACTIVE' ? i.is_active : !i.is_active);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(i => 
                    i.item_code.toLowerCase().includes(term) ||
                    i.barcode.toLowerCase().includes(term)
                );
            }
            if (filters.search2) {
                const term = filters.search2.toLowerCase();
                items = items.filter(i => i.item_name.toLowerCase().includes(term));
            }

            // Sorting
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof ItemBarcodeListItem];
                    const fieldValB = b[sortConfig.key as keyof ItemBarcodeListItem];
                    
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
        if (confirm('คุณต้องการลบข้อมูลบาร์โค้ดนี้หรือไม่?')) {
            await ItemBarcodeService.delete(id);
            refetch();
        }
    }, [refetch]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<ItemBarcodeListItem>[]>(() => [
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
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original.barcode_id)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 150,
        },
        {
            accessorKey: 'item_name',
            header: 'ชื่อสินค้า',
        },
        {
            accessorKey: 'barcode',
            header: 'บาร์โค้ด',
            cell: ({ getValue }) => (
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                    {getValue() as string}
                </code>
            ),
        },
        {
            accessorKey: 'unit_name',
            header: 'หน่วย',
            cell: ({ getValue }) => <span className="text-gray-500">{getValue() as string || '-'}</span>
        },
        {
            accessorKey: 'is_primary',
            header: () => <div className="text-center w-full">สถานะหลัก</div>,
            cell: ({ getValue }) => (
                <div className="flex justify-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        getValue() 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                        {getValue() ? 'หลัก' : 'รอง'}
                    </span>
                </div>
            ),
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
                        onClick={() => handleEdit(row.original.barcode_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.barcode_id)}
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
                        <ScanBarcode className="text-blue-600" />
                        กำหนดรหัสบาร์โค้ดสินค้า (Item Barcode)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลบาร์โค้ดสินค้าทั้งหมด
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
                    createLabel="เพิ่มบาร์โค้ดใหม่"
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
                    rowIdField="barcode_id"
                    className="shadow-sm border border-gray-200 dark:border-gray-700"
                />
            </div>

            <ItemBarcodeFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={refetch}
            />
        </div>
    );
}
