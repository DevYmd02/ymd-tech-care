/**
 * @file VendorList.tsx
 * @description หน้ารายการข้อมูลเจ้าหนี้ (Vendor Master Dummy) - Refactored for Standardization
 * @purpose แสดงรายการเจ้าหนี้ในรูปแบบตาราง ใช้ SmartTable และ FilterFormBuilder
 */

import { useState, useMemo, useCallback } from 'react';
import { Database, Edit2, Power, MoreHorizontal, PauseCircle, Ban } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorStatus, VendorListItem, VendorListResponse } from '@/modules/master-data/vendor/types/vendor-types';
import { VendorFormModal } from './VendorFormModal';
import { VendorStatusBadge } from '../components/VendorStatusBadge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@ui';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

// ====================================================================================
// CONFIG
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'สถานะทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
    { value: 'SUSPENDED', label: 'ระงับชั่วคราว' },
    { value: 'BLACKLISTED', label: 'บัญชีดำ' },
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
            
            // Defensive mapping: Handle both raw array (Legacy/Direct) and paginated object (Standard)
            const allItems = Array.isArray(result) ? result : (result?.items ?? []);
            let items = [...allItems];
            
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

    const handleStatusChange = useCallback(async (id: string, code: string, newStatus: VendorStatus) => {
        const statusConfig: Record<string, { label: string, title: string, description: string, variant: 'warning' | 'danger' | 'info' | 'success' }> = {
            'INACTIVE': { 
                label: 'เลิกใช้งาน', 
                title: 'ยืนยันการเลิกใช้งาน', 
                description: `ต้องการเลิกใช้งานผู้ขาย ${code} ใช่หรือไม่? (ข้อมูลจะยังอยู่ในระบบ)`,
                variant: 'warning'
            },
            'SUSPENDED': { 
                label: 'ระงับชั่วคราว', 
                title: 'ยืนยันการระงับชั่วคราว', 
                description: `ต้องการระงับการทำรายการกับผู้ขาย ${code} ชั่วคราวใช่หรือไม่?`,
                variant: 'warning'
            },
            'BLACKLISTED': { 
                label: 'บัญชีดำ', 
                title: 'ยืนยันการขึ้นบัญชีดำ', 
                description: `ต้องการขึ้นบัญชีดำผู้ขาย ${code} ใช่หรือไม่? การดำเนินการนี้จะส่งผลต่อการทำรายการในอนาคต`,
                variant: 'danger'
            },
            'ACTIVE': { 
                label: 'กลับมาใช้งาน', 
                title: 'ยืนยันการกลับมาใช้งาน', 
                description: `ต้องการเปลี่ยนสถานะผู้ขาย ${code} เป็น 'ใช้งาน' ใช่หรือไม่?`,
                variant: 'success'
            }
        };
        
        const config = statusConfig[newStatus];
        if (!config) return;

        const isConfirmed = await confirm({
            title: config.title,
            description: config.description,
            confirmText: 'ตกลง',
            cancelText: 'ยกเลิก',
            variant: config.variant
        });

        if (isConfirmed) {
            // 1. Optimistic Update (Immediate UI Change)
            // We search for all queries that start with ['vendors'] to update them all
            const queryKeys = queryClient.getQueryCache().findAll({ queryKey: ['vendors'] }).map(q => q.queryKey);
            
            const snapshots = queryKeys.map(key => {
                const previousData = queryClient.getQueryData(key);
                queryClient.setQueryData(key, (old: VendorListResponse | undefined) => {
                    if (!old || !old.items) return old;
                    return {
                        ...old,
                        items: old.items.map((item: VendorListItem) => 
                            item.vendor_id === id ? { ...item, status: newStatus } : item
                        )
                    };
                });
                return { key, previousData };
            });

            try {
                // 2. Call API
                const result = await VendorService.updateStatus(id, newStatus);
                
                if (result.success) {
                    // 3. Show Success Modal instead of Toast
                    await confirm({
                        title: 'ดำเนินการสำเร็จ',
                        description: `เปลี่ยนสถานะเป็น '${config.label}' เรียบร้อยแล้ว`,
                        confirmText: 'ตกลง',
                        variant: 'success',
                        hideCancel: true
                    });
                    
                    // Background refetch to ensure consistency
                    queryClient.invalidateQueries({ queryKey: ['vendors'] });
                } else {
                    throw new Error(result.message || 'ไม่สามารถเปลี่ยนสถานะได้');
                }
            } catch (err) {
                console.error('Update status failed', err);
                
                // 4. Rollback on Error
                snapshots.forEach(({ key, previousData }) => {
                    queryClient.setQueryData(key, previousData);
                });

                await confirm({
                    title: 'เกิดข้อผิดพลาด',
                    description: err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนสถานะได้',
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
            size: 80,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
                            <MoreHorizontal size={18} className="text-gray-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(row.original.vendor_id)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                <span>แก้ไขข้อมูล</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            {row.original.status === 'ACTIVE' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleStatusChange(row.original.vendor_id, row.original.vendor_code, 'INACTIVE')}>
                                        <Power className="mr-2 h-4 w-4 text-gray-500" />
                                        <span>เลิกใช้งาน</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(row.original.vendor_id, row.original.vendor_code, 'SUSPENDED')}>
                                        <PauseCircle className="mr-2 h-4 w-4 text-orange-500" />
                                        <span>ระงับชั่วคราว</span>
                                    </DropdownMenuItem>
                                </>
                            )}

                            {row.original.status !== 'BLACKLISTED' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(row.original.vendor_id, row.original.vendor_code, 'BLACKLISTED')} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                                    <Ban className="mr-2 h-4 w-4" />
                                    <span>บัญชีดำ</span>
                                </DropdownMenuItem>
                            )}

                            {row.original.status !== 'ACTIVE' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(row.original.vendor_id, row.original.vendor_code, 'ACTIVE')}>
                                    <Power className="mr-2 h-4 w-4 text-green-600" />
                                    <span>กลับมาใช้งาน</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleStatusChange]);

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
                    onFilterChange={(name: string, value: string) => {
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




