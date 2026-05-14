/**
 * @file ICDocumentLinkList.tsx
 * @description หน้ารายการกำหนดเอกสารเชื่อม IC (IC Document Link Master Data)
 */

import { useState, useMemo, useCallback } from 'react';
import { Edit2, Trash2, ArrowRightLeft } from 'lucide-react';
import { ICDocumentLinkService } from '@/modules/master-data/inventory/services/ic-document-link.service';
import type { ICDocumentLinkListItem } from '@/modules/master-data/types/master-data-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { ActiveStatusBadge, StatusBadge } from '@ui';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ICDocumentLinkFormModal } from './ICDocumentLinkFormModal';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

const WAREHOUSE_IMPACT_CONFIG = {
    INCREASE: { label: 'เพิ่มคลัง', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    DECREASE: { label: 'ลดคลัง', colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    NONE: { label: 'ไม่มีผลต่อคลัง', colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
};

export default function ICDocumentLinkList() {
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
    const { confirm } = useConfirmation();

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<Extract<keyof typeof filters, string>>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสชนิดเอกสารเชื่อม', 
            type: 'text', 
            placeholder: 'กรอกรหัสชนิดเอกสาร (เช่น 102, 103)',
            colSpan: 1
        },
        { 
            name: 'search2', 
            label: 'ชื่อเอกสารเชื่อม', 
            type: 'text', 
            placeholder: 'กรอกชื่อเอกสาร',
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
    const queryClient = useQueryClient();

    const { data: response, isLoading } = useQuery({
        queryKey: ['ic-document-links', filters],
        queryFn: async () => {
            const res = await ICDocumentLinkService.getAll();
            let items = res.items || [];

            // Client-side filtering for demonstration/mock
            if (filters.status !== 'ALL') {
                items = items.filter(w => filters.status === 'ACTIVE' ? w.is_active : !w.is_active);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(w => w.docu_type_code.toLowerCase().includes(term));
            }
            if (filters.search2) {
                const term = filters.search2.toLowerCase();
                items = items.filter(w => 
                    (w.docu_name_th && w.docu_name_th.toLowerCase().includes(term)) ||
                    w.docu_name_en.toLowerCase().includes(term)
                );
            }

            // Sorting
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof ICDocumentLinkListItem];
                    const fieldValB = b[sortConfig.key as keyof ICDocumentLinkListItem];
                    
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

    // Fetch single record for editing
    const { data: editingData } = useQuery({
        queryKey: ['ic-document-link', editingId],
        queryFn: () => editingId ? ICDocumentLinkService.getById(editingId) : null,
        enabled: !!editingId && isModalOpen,
    });

    // ==================== HANDLERS ====================
    const deleteMutation = useMutation({
        mutationFn: (id: string) => ICDocumentLinkService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ic-document-links'] });
        }
    });

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: ICDocumentLinkListItem) => {
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบข้อมูล',
            description: 'คุณต้องการลบข้อมูลนี้หรือไม่?',
            confirmText: 'ลบ',
            cancelText: 'ยกเลิก',
            variant: 'danger'
        });
        
        if (isConfirmed) {
            deleteMutation.mutate(id);
        }
    }, [confirm, deleteMutation]);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<ICDocumentLinkListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'docu_type_code',
            header: 'รหัสชนิดเอกสารเชื่อม',
            cell: ({ getValue, row }) => (
                <span 
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 150,
        },
        {
            accessorKey: 'docu_name_th',
            header: 'ชื่อเอกสารเชื่อม (ไทย)',
        },
        {
            accessorKey: 'docu_name_en',
            header: 'ชื่อเอกสารเชื่อม (อังกฤษ)',
        },
        {
            accessorKey: 'docu_item_no',
            header: 'รายการเอกสาร',
        },
        {
            accessorKey: 'docu_item_name',
            header: 'ชื่อรายการเอกสาร',
        },
        {
            accessorKey: 'stock_effect_ic',
            header: 'ผลต่อคลัง',
            cell: ({ getValue }) => {
                const effect = getValue() as number;
                let config = WAREHOUSE_IMPACT_CONFIG.NONE;
                if (effect === 1) config = WAREHOUSE_IMPACT_CONFIG.INCREASE;
                if (effect === -1) config = WAREHOUSE_IMPACT_CONFIG.DECREASE;
                
                return (
                    <StatusBadge 
                        label={config.label} 
                        colorClass={config.colorClass} 
                    />
                );
            }
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
                        onClick={() => handleEdit(row.original)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.id)}
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
                        <ArrowRightLeft className="text-blue-600" />
                        กำหนดเอกสารเชื่อม IC (IC Document Link)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการข้อมูลเอกสารที่เชื่อมโยงกับระบบคลังสินค้า (Inventory Control)
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
                    createLabel="เพิ่มเอกสารเชื่อม IC ใหม่"
                    accentColor="indigo"
                    columns={{ sm: 1, md: 3, lg: 3, xl: 3 }}
                    actionColSpan={{ sm: 'full', md: 'full', lg: 'full', xl: 'full' }}
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
                    rowIdField="id"
                    className="shadow-sm border border-gray-200 dark:border-gray-700"
                />
            </div>

            {/* Form Modal */}
            <ICDocumentLinkFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editId={editingId}
                initialData={editingData}
                onSuccess={() => {
                    setIsModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['ic-document-links'] });
                }}
            />
        </div>
    );
}
