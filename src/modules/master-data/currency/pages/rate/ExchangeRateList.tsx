import { useMemo, useState, useEffect, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import SmartTable from '@/shared/components/ui/SmartTable';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExchangeRate } from '@/modules/master-data/types/currency-types';
import { CurrencyService } from '../../services/currency.service';
import { logger } from '@/shared/utils/logger';
import { ExchangeRateFormModal } from './ExchangeRateFormModal';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { Edit2, Trash2 } from 'lucide-react';

interface ExchangeRateDisplay extends ExchangeRate {
    currency_code?: string;
    type_name?: string;
}

export default function ExchangeRateList() {
    const { filters, setFilters, resetFilters } = useTableFilters();
    const { confirm } = useConfirmation();
    const [data, setData] = useState<ExchangeRateDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await CurrencyService.getExchangeRates();
            setData(response.items);
        } catch (error) {
            logger.error('[ExchangeRateList] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = useCallback(() => {
        setEditId(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setEditId(id);
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: string, date: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบ',
            description: `คุณต้องการลบรายการของวันที่ ${date} ใช่หรือไม่?`,
            variant: 'danger',
        });

        if (isConfirmed) {
            const success = await CurrencyService.deleteExchangeRate(id);
            if (success) {
                fetchData();
            } else {
                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    }, [confirm, fetchData]);

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
        {
            id: 'actions',
            header: 'จัดการ',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(row.original.exchange_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.exchange_id, row.original.rate_date)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
            size: 100,
        },
    ], [handleDelete, handleEdit]);

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
                    onCreate={handleCreate}
                    createLabel="เพิ่มอัตราแลกเปลี่ยน"
                    accentColor="blue"
                />
            </div>

            <SmartTable
                data={data}
                columns={columns}
                isLoading={isLoading}
                rowIdField="exchange_id"
                pagination={{
                    pageIndex: 1,
                    pageSize: 10,
                    totalCount: data.length,
                    onPageChange: () => {},
                    onPageSizeChange: () => {},
                }}
            />

            <ExchangeRateFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editId={editId}
                onSuccess={fetchData}
            />
        </div>
    );
}
