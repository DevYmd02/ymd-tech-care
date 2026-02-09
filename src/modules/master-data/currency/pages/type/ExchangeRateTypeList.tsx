import { useMemo } from 'react';
import { Layers, Edit, Trash2 } from 'lucide-react';
import SmartTable from '@/shared/components/ui/SmartTable';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ActiveStatusBadge } from '@ui/StatusBadge';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExchangeRateType } from '@/modules/master-data/types/currency-types';

const MOCK_DATA: ExchangeRateType[] = [
    { currency_type_id: '1', code: 'SPOT', name_th: 'อัตราแลกเปลี่ยนทันที', name_en: 'Spot Exchange Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '2', code: 'FORWARD', name_th: 'อัตราแลกเปลี่ยนล่วงหน้า', name_en: 'Forward Exchange Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '3', code: 'BUYING', name_th: 'อัตราซื้อ', name_en: 'Buying Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '4', code: 'SELLING', name_th: 'อัตราขาย', name_en: 'Selling Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '5', code: 'MIDDLE', name_th: 'อัตรากลาง', name_en: 'Middle Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_type_id: '6', code: 'CUSTOM', name_th: 'อัตราศุลกากร', name_en: 'Custom Rate', is_active: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

export default function ExchangeRateTypeList() {
    const { filters, setFilters, resetFilters } = useTableFilters();

    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { name: 'search', label: 'ค้นหา', type: 'text', placeholder: 'กรอกชื่อประเภท' },
    ], []);

    const columns = useMemo<ColumnDef<ExchangeRateType>[]>(() => [
        { 
            id: 'sequence', 
            header: 'ลำดับ', 
            accessorFn: (_, index) => index + 1, 
            size: 80,
            minSize: 80,
            cell: info => <div className="whitespace-nowrap">{info.getValue() as number}</div>
        },
        { 
            accessorKey: 'code', 
            header: 'รหัสประเภทอัตราแลกเปลี่ยน',
            cell: ({ getValue }) => <span className="text-blue-600 font-semibold whitespace-nowrap">{getValue() as string}</span>,
            size: 250,
            minSize: 250
        },
        { 
            accessorKey: 'name_th', 
            header: 'ชื่อประเภทอัตราแลกเปลี่ยนไทย',
            cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue() as string}</span>,
            size: 250,
            minSize: 250
        },
        { 
            accessorKey: 'name_en', 
            header: 'ชื่อประเภทอัตราแลกเปลี่ยน (EN)',
            cell: ({ getValue }) => <span className="whitespace-nowrap text-gray-500">{getValue() as string}</span>,
            size: 250,
            minSize: 250
        },
        { 
            accessorKey: 'is_active', 
            header: 'สถานะ', 
            cell: ({ getValue }) => <ActiveStatusBadge isActive={getValue() as boolean} />, 
            size: 120,
            minSize: 120
        },
        {
            id: 'actions',
            header: 'จัดการ',
            cell: () => (
                <div className="flex items-center gap-2 justify-center">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit size={16} />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
            size: 120,
            minSize: 120
        }
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
                    createLabel="เพิ่มประเภทอัตราแลกเปลี่ยนใหม่"
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
