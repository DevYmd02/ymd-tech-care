import { useMemo } from 'react';
import { Coins } from 'lucide-react';
import SmartTable from '@/shared/components/ui/SmartTable';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ActiveStatusBadge } from '@ui/StatusBadge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Currency } from '@/modules/master-data/types/currency-types';

const MOCK_DATA: Currency[] = [
    { currency_id: '1', currency_code: 'THB', name_th: 'บาท', name_en: 'Baht', symbol: '฿', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '2', currency_code: 'USD', name_th: 'ดอลลาร์สหรัฐ', name_en: 'US Dollar', symbol: '$', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

export default function CurrencyCodeList() {
    const { filters, setFilters, resetFilters } = useTableFilters();

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'ค้นหา', type: 'text', placeholder: 'กรอกรหัสหรือชื่อสกุลเงิน' },
    ], []);

    const columns = useMemo<ColumnDef<Currency>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => index + 1, size: 60 },
        { accessorKey: 'currency_code', header: 'รหัสสกุลเงิน', cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue() as string}</span> },
        { accessorKey: 'name_th', header: 'ชื่อ (ไทย)' },
        { accessorKey: 'name_en', header: 'ชื่อ (English)' },
        { accessorKey: 'symbol', header: 'สัญลักษณ์', size: 80 },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
    ], []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Coins className="text-blue-600" />
                        กำหนดรหัสสกุลเงิน (Currency Code)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">จัดการรหัสสกุลเงินที่ใช้ในระบบ</p>
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
                    createLabel="เพิ่มสกุลเงิน"
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
