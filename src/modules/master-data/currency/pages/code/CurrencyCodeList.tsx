import { useMemo } from 'react';
import { Coins, Edit2, Trash2 } from 'lucide-react';
import SmartTable from '@/shared/components/ui/SmartTable';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ActiveStatusBadge } from '@ui/StatusBadge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Currency } from '@/modules/master-data/types/currency-types';

const MOCK_DATA: Currency[] = [
    { currency_id: '1', currency_code: 'THB', name_th: 'บาทไทย', name_en: 'Thai Baht', symbol: '฿', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '2', currency_code: 'USD', name_th: 'ดอลลาร์สหรัฐ', name_en: 'US Dollar', symbol: '$', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '3', currency_code: 'EUR', name_th: 'ยูโร', name_en: 'Euro', symbol: '€', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '4', currency_code: 'JPY', name_th: 'เยนญี่ปุ่น', name_en: 'Japanese Yen', symbol: '¥', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '5', currency_code: 'GBP', name_th: 'ปอนด์สเตอร์ลิง', name_en: 'British Pound', symbol: '£', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '6', currency_code: 'CNY', name_th: 'หยวนจีน', name_en: 'Chinese Yuan', symbol: '¥', is_active: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

export default function CurrencyCodeList() {
    const { filters, setFilters, resetFilters } = useTableFilters();

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'ค้นหา', type: 'text', placeholder: 'กรอกรหัสหรือชื่อสกุลเงิน' },
    ], []);

    const columns = useMemo<ColumnDef<Currency>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => index + 1, size: 60 },
        { accessorKey: 'currency_code', header: 'รหัสสกุลเงิน', cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue() as string}</span>, size: 120 },
        { accessorKey: 'name_th', header: 'ชื่อสกุลเงิน', size: 200 },
        { accessorKey: 'name_en', header: 'ชื่อสกุลเงิน (EN)', size: 200 },
        { accessorKey: 'is_active', header: 'สถานะ', cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, size: 100 },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => alert(`แก้ไข ${row.original.currency_code}`)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => alert(`ลบ ${row.original.currency_code}`)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
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
                    createLabel="เพิ่มสกุลเงินใหม่"
                    accentColor="blue"
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                        พบข้อมูล {MOCK_DATA.length} รายการ
                    </h2>
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
        </div>
    );
}
