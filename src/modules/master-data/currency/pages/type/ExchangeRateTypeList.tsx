import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import SmartTable from '@/shared/components/ui/SmartTable';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ActiveStatusBadge } from '@ui/StatusBadge';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExchangeRateType } from '@/modules/master-data/types/currency-types';

const MOCK_DATA: ExchangeRateType[] = [
    { currency_type_id: '1', name_th: 'อัตราซื้อ', name_en: 'Buying Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '2', name_th: 'อัตราขาย', name_en: 'Selling Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '3', name_th: 'อัตราถัวเฉลี่ย', name_en: 'Average Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

export default function ExchangeRateTypeList() {
    const { filters, setFilters, resetFilters } = useTableFilters();

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'ค้นหา', type: 'text', placeholder: 'กรอกชื่อประเภท' },
    ], []);

    const columns = useMemo<ColumnDef<ExchangeRateType>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => index + 1, size: 60 },
        { accessorKey: 'name_th', header: 'ชื่อประเภท (ไทย)' },
        { accessorKey: 'name_en', header: 'ชื่อประเภท (English)' },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
    ], []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" />
                        กำหนดรหัสประเภทอัตราแลกเปลี่ยน (Exchange Rate Type)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">จัดการประเภทข้อมูลอัตราแลกเปลี่ยน</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name, value) => setFilters({ [name]: value })}
                    onSearch={() => {}}
                    onReset={resetFilters}
                    onCreate={() => alert('Feature coming soon')}
                    createLabel="เพิ่มประเภท"
                    accentColor="blue"
                />
            </div>

            <SmartTable
                data={MOCK_DATA}
                columns={columns}
                isLoading={false}
                pagination={{
                    pageIndex: 1,
                    pageSize: 10,
                    totalCount: MOCK_DATA.length,
                    onPageChange: () => {},
                    onPageSizeChange: () => {},
                }}
            />
        </div>
    );
}
