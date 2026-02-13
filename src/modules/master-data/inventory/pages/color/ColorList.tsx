/**
 * @file ColorList.tsx - หน้ารายการสีสินค้า
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Edit2, Trash2, Palette } from 'lucide-react';
import { ColorFormModal } from './ColorFormModal';
import { ColorService } from '@/modules/master-data/inventory/services/inventory-master.service';
import type { Color } from '@/modules/master-data/inventory/types/inventory-master.types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

const STATUS_OPTIONS = [{ value: 'ALL', label: 'ทั้งหมด' }, { value: 'ACTIVE', label: 'ใช้งาน' }, { value: 'INACTIVE', label: 'ไม่ใช้งาน' }];

export default function ColorList() {
    const { filters, setFilters, handlePageChange, resetFilters } = useTableFilters({ customParamKeys: { search: 'code', search2: 'name' } });
    const [allData, setAllData] = useState<Color[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'รหัสสี', type: 'text', placeholder: 'กรอกรหัส' },
        { name: 'search2', label: 'ชื่อสี', type: 'text', placeholder: 'กรอกชื่อ' },
        { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
    ], []);

    const fetchData = useCallback(async () => { setIsLoading(true); try { const response = await ColorService.getAll(); setAllData(response.items); } finally { setIsLoading(false); } }, []);
    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allData];
        if (filters.status !== 'ALL') result = result.filter(item => filters.status === 'ACTIVE' ? item.is_active : !item.is_active);
        if (filters.search) result = result.filter(item => item.code.toLowerCase().includes(filters.search.toLowerCase()));
        if (filters.search2) result = result.filter(item => item.name_th.toLowerCase().includes(filters.search2.toLowerCase()));
        return result;
    }, [allData, filters]);

    const paginatedData = useMemo(() => filteredData.slice((filters.page - 1) * filters.limit, filters.page * filters.limit), [filteredData, filters.page, filters.limit]);
    const handleDelete = useCallback((id: string) => { if (confirm('ลบข้อมูลนี้?')) ColorService.delete(id).then(() => fetchData()); }, [fetchData]);

    const columns = useMemo<ColumnDef<Color>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1, size: 60 },
        { accessorKey: 'code', header: 'รหัส', cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue() as string}</span> },
        { accessorKey: 'name_th', header: 'ชื่อ (ไทย)' },
        { accessorKey: 'name_en', header: 'ชื่อ (EN)', cell: ({ getValue }) => <span className="text-gray-600">{getValue() as string || '-'}</span> },
        { accessorKey: 'hex_code', header: 'รหัสสี', cell: ({ getValue }) => {
            const hex = getValue() as string | undefined;
            return hex ? <div className="flex items-center gap-2"><span className="w-5 h-5 rounded border" style={{ backgroundColor: hex }} /><code className="text-xs">{hex}</code></div> : '-';
        }},
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
        { id: 'actions', header: 'จัดการ', size: 100, cell: ({ row }) => (<div className="flex items-center gap-2"><button onClick={() => { setEditingId(row.original.id); setIsModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button><button onClick={() => handleDelete(row.original.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button></div>)},
    ], [filters.page, filters.limit, handleDelete]);

    return (
        <div className="p-6 space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Palette className="text-blue-600" /> กำหนดสีสินค้า (Color Master)</h1><p className="text-gray-500 mt-1 text-sm">จัดการข้อมูลสีสินค้า</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"><FilterFormBuilder config={filterConfig} filters={filters} onFilterChange={(name: string, value: string) => setFilters({ [name]: value })} onSearch={() => handlePageChange(1)} onReset={resetFilters} onCreate={() => { setEditingId(null); setIsModalOpen(true); }} createLabel="เพิ่มสีใหม่" accentColor="indigo" /></div>
            <div className="flex flex-col gap-4"><h2 className="text-gray-700 font-medium">พบข้อมูล {filteredData.length} รายการ</h2><SmartTable data={paginatedData} columns={columns} isLoading={isLoading} pagination={{ pageIndex: filters.page, pageSize: filters.limit, totalCount: filteredData.length, onPageChange: handlePageChange, onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }) }} rowIdField="color_id" /></div>
            <ColorFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} editId={editingId} onSuccess={fetchData} />
        </div>
    );
}



