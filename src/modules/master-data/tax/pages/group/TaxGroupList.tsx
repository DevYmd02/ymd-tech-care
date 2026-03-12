/**
 * @file TaxGroupList.tsx - หน้ารายการกลุ่มภาษี
 */
import { useState, useCallback, useMemo } from 'react';
import { Edit2, Trash2, Percent } from 'lucide-react';
import { TaxGroupFormModal } from './TaxGroupFormModal';
import { TaxGroupService } from '@/modules/master-data/tax/services/tax-group.service';
import type { TaxGroup } from '@/modules/master-data/tax/types/tax-types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

const STATUS_OPTIONS = [{ value: 'ALL', label: 'ทั้งหมด' }, { value: 'ACTIVE', label: 'ใช้งาน' }, { value: 'INACTIVE', label: 'ไม่ใช้งาน' }];

export default function TaxGroupList() {
    const {
        filters,
        setFilters,
        handlePageChange,
        resetFilters,
        handleSortChange,
        sortConfig
    } = useTableFilters({ customParamKeys: { search: 'code', search2: 'tax_type', status: 'status' } });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editingData, setEditingData] = useState<TaxGroup | null>(null);

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'รหัสกลุ่มภาษี', type: 'text', placeholder: 'กรอกรหัส' },
        { name: 'search2', label: 'ประเภทภาษี', type: 'text', placeholder: 'กรอกประเภท' },
        { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
    ], []);

    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['tax-groups', filters],
        queryFn: async () => {
            const items = await TaxGroupService.getTaxGroups();
            let filteredItems = items || [];

            if (filters.status !== 'ALL') {
                filteredItems = filteredItems.filter(item => filters.status === 'ACTIVE' ? item.is_active : !item.is_active);
            }
            if (filters.search) {
                const term = filters.search.toLowerCase();
                filteredItems = filteredItems.filter(item => item.tax_group_code.toLowerCase().includes(term));
            }
            if (filters.search2) {
                const term = filters.search2.toLowerCase();
                filteredItems = filteredItems.filter(item => (item.tax_type || '').toLowerCase().includes(term));
            }

            if (sortConfig) {
                filteredItems.sort((a, b) => {
                    const key = sortConfig.key as keyof TaxGroup;
                    const valA = a[key];
                    const valB = b[key];
                    
                    if (typeof valA === 'string' && typeof valB === 'string') {
                         return sortConfig.direction === 'asc' 
                            ? valA.localeCompare(valB) 
                            : valB.localeCompare(valA);
                    }
                     return sortConfig.direction === 'asc' 
                        ? Number(valA) - Number(valB) 
                        : Number(valB) - Number(valA);
                });
            }

            const total = filteredItems.length;
            const start = (filters.page - 1) * filters.limit;
            const paginatedItems = filteredItems.slice(start, start + filters.limit);

            return { items: paginatedItems, total };
        },
    });

    const handleCreateNew = () => {
        setEditingId(null);
        setEditingData(null);
        setIsModalOpen(true);
    };

    const handleEdit = useCallback((item: TaxGroup) => {
        setEditingId(item.tax_group_id);
        setEditingData(item);
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: string | number) => {
        if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            await TaxGroupService.deleteTaxGroup(String(id));
            refetch();
        }
    }, [refetch]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setEditingData(null);
    };

    const columns = useMemo<ColumnDef<TaxGroup>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1, size: 60 },
        { accessorKey: 'tax_group_code', header: 'รหัสกลุ่มภาษี', cell: ({ row }) => <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => handleEdit(row.original)}>{row.getValue('tax_group_code') as string}</span> },
        { accessorKey: 'tax_type', header: 'ประเภทภาษี' },
        { accessorKey: 'tax_rate', header: 'อัตราภาษี (%)', cell: ({ getValue }) => <div className="text-right pr-4">{getValue() as string}</div> },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
        { id: 'actions', header: 'จัดการ', size: 100, cell: ({ row }) => (<div className="flex items-center gap-2"><button onClick={() => handleEdit(row.original)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข"><Edit2 size={18} /></button><button onClick={() => handleDelete(row.original.tax_group_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="ลบ"><Trash2 size={18} /></button></div>) },
    ], [filters.page, filters.limit, handleEdit, handleDelete]);

    return (
        <div className="p-6 space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Percent className="text-blue-600" /> กำหนดกลุ่มภาษี (Tax Group)</h1><p className="text-gray-500 mt-1 text-sm">จัดการข้อมูลกลุ่มภาษี</p></div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"><FilterFormBuilder config={filterConfig} filters={filters} onFilterChange={(name: string, value: string) => setFilters({ [name]: value })} onSearch={() => handlePageChange(1)} onReset={resetFilters} onCreate={handleCreateNew} createLabel="เพิ่มกลุ่มภาษีใหม่" accentColor="indigo" /></div>
            <div className="flex flex-col gap-4"><h2 className="text-gray-700 font-medium">พบข้อมูล {response?.total || 0} รายการ</h2><SmartTable data={response?.items || []} columns={columns} isLoading={isLoading} pagination={{ pageIndex: filters.page, pageSize: filters.limit, totalCount: response?.total || 0, onPageChange: handlePageChange, onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }) }} sortConfig={sortConfig} onSortChange={handleSortChange} rowIdField="tax_group_id" className="shadow-sm" /></div>
            <TaxGroupFormModal isOpen={isModalOpen} onClose={handleModalClose} editId={editingId} initialData={editingData} onSuccess={refetch} />
        </div>
    );
}