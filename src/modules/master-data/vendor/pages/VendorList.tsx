/**
 * @file VendorList.tsx
 * @description หน้ารายการข้อมูลเจ้าหนี้ (Vendor Master Dummy) - Refactored for Standardization
 * @purpose แสดงรายการเจ้าหนี้ในรูปแบบตาราง ใช้ SmartTable และ FilterFormBuilder
 */

import { useState, useMemo, useCallback } from 'react';
import { Database, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorStatus, VendorListItem } from '@/modules/master-data/vendor/types/vendor-types';
import { VendorFormModal } from './VendorFormModal';
import { VendorStatusBadge } from '@/shared/components/ui/StatusBadge';
import { FilterFormBuilder, type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { useTableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

// ====================================================================================
// CONFIG
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'สถานะทั้งหมด' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'BLACKLISTED', label: 'Blacklisted' },
    { value: 'SUSPENDED', label: 'Suspended' },
];

export default function VendorList() {
    // ==================== STATE & FILTERS ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange, 
        resetFilters,
        handleSortChange,
        sortConfig 
    } = useTableFilters<VendorStatus>({
        defaultLimit: 10,
        customParamKeys: {
            search: 'q',
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
            label: 'ค้นหาเจ้าหนี้', 
            type: 'text', 
            placeholder: 'ค้นหาชื่อ, รหัส, หรือเลขภาษี...',
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
        queryKey: ['vendors', filters],
        queryFn: async () => {
            // Note: In a real API, we would pass filters to getList
            // But since getList currently returns everything or handles basic filtering, we simulate it here to match ItemMasterList pattern
            const result = await VendorService.getList();
            let items = result.items || [];
            
            // Client-side filtering (mocking server behavior if needed)
            if (filters.status && filters.status !== 'ALL') {
                items = items.filter(v => v.status === filters.status);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(v => 
                    v.vendor_code.toLowerCase().includes(term) ||
                    v.vendor_name.toLowerCase().includes(term) ||
                    (v.tax_id && v.tax_id.toLowerCase().includes(term))
                );
            }
            
            // Sorting
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof VendorListItem];
                    const fieldValB = b[sortConfig.key as keyof VendorListItem];
                    
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
        queryClient.invalidateQueries({ queryKey: ['vendors'] });
        setIsModalOpen(false);
        setEditId(null);
    }, [queryClient]);

    const handleDelete = useCallback(async (id: string, code: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบข้อมูล',
            description: `ต้องการลบรหัสเจ้าหนี้ ${code} ใช่หรือไม่?\n⚠️ หากเจ้าหนี้นี้มีเอกสาร PR/PO ค้างอยู่ จะไม่สามารถลบได้`,
            confirmText: 'ลบข้อมูล',
            cancelText: 'ยกเลิก',
            variant: 'danger'
        });

        if (isConfirmed) {
            try {
                const result = await VendorService.delete(id);
                if (result.success) {
                    await confirm({
                        title: 'ลบข้อมูลเรียบร้อยแล้ว!',
                        description: 'ระบบได้ทำการลบข้อมูลเจ้าหนี้เรียบร้อยแล้ว',
                        confirmText: 'ตกลง',
                        variant: 'success',
                        hideCancel: true
                    });
                    queryClient.invalidateQueries({ queryKey: ['vendors'] });
                } else {
                    await confirm({
                        title: 'ไม่สามารถลบได้',
                        description: result.message || 'พบข้อผิดพลาดที่ไม่ทราบสาเหตุ',
                        confirmText: 'ตกลง',
                        variant: 'danger',
                        hideCancel: true
                    });
                }
            } catch (err) {
                console.error('Delete failed', err);
                await confirm({
                    title: 'เกิดข้อผิดพลาด',
                    description: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย',
                    confirmText: 'ตกลง',
                    variant: 'danger',
                    hideCancel: true
                });
            }
        }
    }, [queryClient, confirm]);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<VendorListItem>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'vendor_code',
            header: 'รหัส',
            cell: ({ getValue, row }) => (
                <span 
                    className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original.vendor_id)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 150,
        },
        {
            accessorKey: 'vendor_name',
            header: 'ชื่อเจ้าหนี้',
            cell: ({ row }) => (
                <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{row.original.vendor_name}</div>
                    <div className="text-xs text-gray-500">{row.original.vendor_name_en}</div>
                </div>
            ),
            size: 250,
        },
        {
            accessorKey: 'tax_id',
            header: 'เลขผู้เสียภาษี',
            cell: ({ getValue }) => <span className="text-gray-500 dark:text-gray-400">{getValue() as string || '-'}</span>,
            size: 150,
        },
        {
            accessorKey: 'phone',
            header: 'เบอร์โทรศัพท์',
            cell: ({ getValue }) => <span className="text-gray-500 dark:text-gray-400">{getValue() as string || '-'}</span>,
            size: 150,
        },
        {
            accessorKey: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: ({ getValue }) => (
                <div className="flex justify-center">
                    <VendorStatusBadge status={getValue() as VendorStatus} />
                </div>
            ),
            size: 120,
        },
        {
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.vendor_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.vendor_id, row.original.vendor_code)}
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
                        <Database className="text-blue-600" />
                        ข้อมูลเจ้าหนี้ (Vendor Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        จัดการข้อมูลผู้ขายและคู่ค้าทั้งหมด
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
                    createLabel="เพิ่มเจ้าหนี้ใหม่"
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
                    rowIdField="vendor_id"
                    className="shadow-sm border border-gray-200 dark:border-gray-700"
                />
            </div>

            {/* Modal */}
            <VendorFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                vendorId={editId || undefined}
                onSuccess={handleModalSuccess}
            />

        </div>
    );
}
