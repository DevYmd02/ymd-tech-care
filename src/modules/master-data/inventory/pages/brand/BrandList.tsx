/**
 * @file BrandList.tsx
 * @description หน้ารายการยี่ห้อสินค้า (Brand Master Data List)
 */

import { useState, useCallback, useMemo } from 'react';
import { Tag, Edit2, Trash2 } from 'lucide-react';
import { BrandFormModal } from './BrandFormModal';
import { BrandService } from '@/modules/master-data/inventory/services/inventory-master.service';
import type { Brand } from '@/modules/master-data/inventory/types/inventory-master.types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

export default function BrandList() {
    // ==================== STATE & FILTERS ====================
    const {
        filters,
        setFilters,
        handlePageChange,
        resetFilters,
        handleSortChange,
        sortConfig
    } = useTableFilters({
        customParamKeys: { search: 'code', search2: 'name', status: 'status' }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingData, setEditingData] = useState<Brand | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'รหัสยี่ห้อ', type: 'text', placeholder: 'กรอกรหัส' },
        { name: 'search2', label: 'ชื่อยี่ห้อ', type: 'text', placeholder: 'กรอกชื่อ' },
        { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
    ], []);

    // ==================== DATA FETCHING ====================
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['brands', filters],
        queryFn: async () => {
            const response = await BrandService.getAll();
            let items = response.items || [];

            // Client-side filtering (Generic Service getAll typically returns all items currently)
            if (filters.status !== 'ALL') {
                items = items.filter(item => filters.status === 'ACTIVE' ? item.is_active : !item.is_active);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(item => item.code.toLowerCase().includes(term));
            }
            if (filters.search2) {
                const term = filters.search2.toLowerCase();
                items = items.filter(item => item.name_th.toLowerCase().includes(term));
            }

            // Sorting
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof Brand];
                    const fieldValB = b[sortConfig.key as keyof Brand];
                    const valA = fieldValA != null ? String(fieldValA) : '';
                    const valB = fieldValB != null ? String(fieldValB) : '';
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
        setEditingData(null);
        setIsModalOpen(true);
    };

    const handleEdit = useCallback((item: Brand) => {
        setEditingId(item.id);
        setEditingData(item); // ✅ ส่งข้อมูลทั้งก้อนไปให้ Modal (แก้ปัญหาข้อมูลไม่ขึ้น)
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: number) => {
        if (confirm('คุณต้องการลบข้อมูลยี่ห้อสินค้านี้หรือไม่?')) {
            await BrandService.delete(id);
            refetch();
        }
    }, [refetch]);
    
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setEditingData(null);
    };

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<Brand>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1, size: 60 },
        { 
            accessorKey: 'code', 
            header: 'รหัส', 
            cell: ({ row }) => (
                <span 
                    className="font-medium text-blue-600 cursor-pointer hover:underline" 
                    onClick={() => handleEdit(row.original)}
                >
                    {row.getValue('code') as string}
                </span>
            ) 
        },
        { accessorKey: 'name_th', header: 'ชื่อ (ไทย)' },
        { accessorKey: 'name_en', header: 'ชื่อ (EN)', cell: ({ getValue }) => <span className="text-gray-600">{getValue() as string || '-'}</span> },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
        {
            id: 'actions', header: 'จัดการ', size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(row.original)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(row.original.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="ลบ"><Trash2 size={18} /></button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Tag className="text-blue-600" /> กำหนดยี่ห้อสินค้า (Brand)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">จัดการข้อมูลยี่ห้อสินค้าในระบบ</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder config={filterConfig} filters={filters} onFilterChange={(name: string, value: string) => setFilters({ [name]: value })} onSearch={() => handlePageChange(1)} onReset={resetFilters} onCreate={handleCreateNew} createLabel="เพิ่มยี่ห้อใหม่" accentColor="indigo" />
            </div>
            <div className="flex flex-col gap-4">
                <h2 className="text-gray-700 dark:text-gray-300 font-medium">พบข้อมูล {response?.total || 0} รายการ</h2>
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
                    className="shadow-sm"
                />
            </div>
            <BrandFormModal isOpen={isModalOpen} onClose={handleModalClose} editId={editingId} initialData={editingData} onSuccess={refetch} />
        </div>
    );
}