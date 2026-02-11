/**
 * @file SizeList.tsx - หน้ารายการขนาดสินค้า
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Edit2, Trash2, Maximize2 } from 'lucide-react';
import { SizeFormModal } from './SizeFormModal';
import { SizeService } from '@/modules/master-data/inventory/services/inventory-master.service';
import type { Size } from '@/modules/master-data/inventory/types/inventory-master.types';
import { ActiveStatusBadge } from '@ui/StatusBadge';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import SmartTable from '@/shared/components/ui/SmartTable';
import type { ColumnDef } from '@tanstack/react-table';

const STATUS_OPTIONS = [{ value: 'ALL', label: 'ทั้งหมด' }, { value: 'ACTIVE', label: 'ใช้งาน' }, { value: 'INACTIVE', label: 'ไม่ใช้งาน' }];

export default function SizeList() {
    const { filters, setFilters, handlePageChange, resetFilters } = useTableFilters({ customParamKeys: { search: 'code', search2: 'name' } });
    const [allData, setAllData] = useState<Size[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'รหัสขนาด', type: 'text', placeholder: 'กรอกรหัส' },
        { name: 'search2', label: 'ชื่อขนาด', type: 'text', placeholder: 'กรอกชื่อ' },
        { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
    ], []);

    const fetchData = useCallback(async () => { setIsLoading(true); try { const response = await SizeService.getAll(); setAllData(response.items); } finally { setIsLoading(false); } }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allData];
        if (filters.status !== 'ALL') result = result.filter(item => filters.status === 'ACTIVE' ? item.is_active : !item.is_active);
        if (filters.search) result = result.filter(item => item.code.toLowerCase().includes(filters.search.toLowerCase()));
        if (filters.search2) result = result.filter(item => item.name_th.toLowerCase().includes(filters.search2.toLowerCase()));
        return result;
    }, [allData, filters]);

    const paginatedData = useMemo(() => filteredData.slice((filters.page - 1) * filters.limit, filters.page * filters.limit), [filteredData, filters.page, filters.limit]);
    const handleDelete = useCallback((id: string) => { if (confirm('ลบข้อมูลนี้?')) SizeService.delete(id).then(() => fetchData()); }, [fetchData]);

    const columns = useMemo<ColumnDef<Size>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1, size: 60 },
        { accessorKey: 'code', header: 'รหัส', cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue() as string}</span> },
        { accessorKey: 'name_th', header: 'ชื่อ (ไทย)' },
        { accessorKey: 'name_en', header: 'ชื่อ (EN)', cell: ({ getValue }) => <span className="text-gray-600">{getValue() as string || '-'}</span> },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
        { id: 'actions', header: 'จัดการ', size: 100, cell: ({ row }) => (<div className="flex items-center gap-2"><button onClick={() => { setEditingId(row.original.id); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button><button onClick={() => handleDelete(row.original.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></div>)},
    ], [filters.page, filters.limit, handleDelete]);

    return (
        <div className="p-6 space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Maximize2 className="text-blue-600" /> กำหนดขนาดสินค้า (Size Master)</h1><p className="text-gray-500 mt-1 text-sm">จัดการข้อมูลขนาดสินค้า</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"><FilterFormBuilder config={filterConfig} filters={filters} onFilterChange={(name, value) => setFilters({ [name]: value })} onSearch={() => handlePageChange(1)} onReset={resetFilters} onCreate={() => { setEditingId(null); setIsModalOpen(true); }} createLabel="เพิ่มขนาดใหม่" accentColor="indigo" /></div>
            <div className="flex flex-col gap-4"><h2 className="text-gray-700 font-medium">พบข้อมูล {filteredData.length} รายการ</h2><SmartTable data={paginatedData} columns={columns} isLoading={isLoading} pagination={{ pageIndex: filters.page, pageSize: filters.limit, totalCount: filteredData.length, onPageChange: handlePageChange, onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }) }} rowIdField="size_id" /></div>
            <SizeFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} editId={editingId} onSuccess={fetchData} />
        </div>
    );
}
