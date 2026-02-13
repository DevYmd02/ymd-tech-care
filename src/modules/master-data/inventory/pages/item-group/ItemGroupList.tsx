/**
 * @file ItemGroupList.tsx
 * @description หน้ารายการกลุ่มสินค้า (Item Group Master Data List)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Edit2, Trash2, Layers } from 'lucide-react';
import { ItemGroupFormModal } from './ItemGroupFormModal';
import { ItemGroupService } from '../../services/inventory-master.service';
import type { ItemGroup } from '../../types/inventory-master.types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

export default function ItemGroupList() {
    const { filters, setFilters, handlePageChange, resetFilters } = useTableFilters({
        customParamKeys: { search: 'code', search2: 'name' }
    });

    const [allData, setAllData] = useState<ItemGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'รหัสกลุ่มสินค้า', type: 'text', placeholder: 'กรอกรหัส' },
        { name: 'search2', label: 'ชื่อกลุ่มสินค้า', type: 'text', placeholder: 'กรอกชื่อ' },
        { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
    ], []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await ItemGroupService.getAll();
            const data = response.items || [];
            setAllData(data);
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allData];
        if (filters.status !== 'ALL') {
            result = result.filter(item => filters.status === 'ACTIVE' ? item.is_active : !item.is_active);
        }
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => item.code.toLowerCase().includes(term));
        }
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => item.name_th.toLowerCase().includes(term));
        }
        return result;
    }, [allData, filters]);

    const paginatedData = useMemo(() => {
        const startIndex = (filters.page - 1) * filters.limit;
        return filteredData.slice(startIndex, startIndex + filters.limit);
    }, [filteredData, filters.page, filters.limit]);

    const handleCreateNew = () => { setEditingId(null); setIsModalOpen(true); };
    const handleEdit = (id: string) => { setEditingId(id); setIsModalOpen(true); };
    const handleDelete = useCallback((id: string) => {
        if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            ItemGroupService.delete(id).then(() => fetchData());
        }
    }, [fetchData]);
    const handleModalClose = () => { setIsModalOpen(false); setEditingId(null); };

    const columns = useMemo<ColumnDef<ItemGroup>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1, size: 60 },
        { accessorKey: 'code', header: 'รหัส', cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue() as string}</span> },
        { accessorKey: 'name_th', header: 'ชื่อ (ไทย)' },
        { accessorKey: 'name_en', header: 'ชื่อ (EN)', cell: ({ getValue }) => <span className="text-gray-600">{getValue() as string || '-'}</span> },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
        {
            id: 'actions', header: 'จัดการ', size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(row.original.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(row.original.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="ลบ"><Trash2 size={18} /></button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleDelete]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" /> กำหนดกลุ่มสินค้า (Item Group Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">จัดการข้อมูลกลุ่มสินค้าในระบบ</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder config={filterConfig} filters={filters} onFilterChange={(name: string, value: string) => setFilters({ [name]: value })} onSearch={() => handlePageChange(1)} onReset={resetFilters} onCreate={handleCreateNew} createLabel="เพิ่มกลุ่มสินค้าใหม่" accentColor="indigo" />
            </div>
            <div className="flex flex-col gap-4">
                <h2 className="text-gray-700 dark:text-gray-300 font-medium">พบข้อมูล {filteredData.length} รายการ</h2>
                <SmartTable data={paginatedData} columns={columns} isLoading={isLoading} pagination={{ pageIndex: filters.page, pageSize: filters.limit, totalCount: filteredData.length, onPageChange: handlePageChange, onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }) }} rowIdField="item_group_id" className="shadow-sm" />
            </div>
            <ItemGroupFormModal isOpen={isModalOpen} onClose={handleModalClose} editId={editingId} onSuccess={fetchData} />
        </div>
    );
}



