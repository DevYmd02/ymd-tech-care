import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import SmartTable from '@/shared/components/ui/SmartTable';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExchangeRate } from '@/modules/master-data/types/currency-types';

interface ExchangeRateDisplay extends ExchangeRate {
    currency_code: string;
    type_name: string;
}

const MOCK_DATA: ExchangeRateDisplay[] = [
    { 
        exchange_id: '1', 
        currency_id: 'usd-id', 
        currency_code: 'USD', 
        currency_type_id: 'type-id-1', 
        type_name: 'อัตราขาย', 
        buy_rate: 34.50, 
        sale_rate: 35.20, 
        rate_date: '2026-02-09', 
        remark: 'ประกาศเช้า',
        exchange_round: 2,
        allow_adjust: 5,
        is_active: true,
        created_at: '2026-02-09',
        updated_at: '2026-02-09'
    },
    { 
        exchange_id: '2', 
        currency_id: 'eur-id', 
        currency_code: 'EUR', 
        currency_type_id: 'type-id-1', 
        type_name: 'อัตราขาย', 
        buy_rate: 38.00, 
        sale_rate: 38.80, 
        rate_date: '2026-02-09', 
        remark: '',
        exchange_round: 2,
        allow_adjust: 5,
        is_active: true,
        created_at: '2026-02-09',
        updated_at: '2026-02-09'
    },
];

export default function ExchangeRateList() {
    const { filters, setFilters, resetFilters } = useTableFilters();

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'สกุลเงิน', type: 'text', placeholder: 'ระบุสกุลเงิน' },
    ], []);

    const columns = useMemo<ColumnDef<ExchangeRateDisplay>[]>(() => [
        { id: 'sequence', header: 'ลำดับ', accessorFn: (_, index) => index + 1, size: 60 },
        { accessorKey: 'rate_date', header: 'วันที่', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('th-TH') },
        { accessorKey: 'currency_code', header: 'สกุลเงิน', cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue() as string}</span> },
        { accessorKey: 'type_name', header: 'ประเภท' },
        { accessorKey: 'buy_rate', header: 'อัตราซื้อ', cell: ({ getValue }) => (getValue() as number).toFixed(4) },
        { accessorKey: 'sale_rate', header: 'อัตราขาย', cell: ({ getValue }) => (getValue() as number).toFixed(4) },
        { accessorKey: 'remark', header: 'หมายเหตุ' },
    ], []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-blue-600" />
                        กำหนดอัตราแลกเปลี่ยนเงินตรา (Exchange Rate)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">จัดการข้อมูลอัตราแลกเปลี่ยนรายวัน</p>
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
                    createLabel="เพิ่มอัตราแลกเปลี่ยน"
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
