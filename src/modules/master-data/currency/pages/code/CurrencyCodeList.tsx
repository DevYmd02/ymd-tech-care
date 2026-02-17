import { useMemo, useState, useEffect, useCallback } from 'react';
import { Coins, Edit2, Trash2 } from 'lucide-react';
import { SmartTable } from '@ui';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ActiveStatusBadge } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { Currency } from '@/modules/master-data/types/currency-types';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';
import { logger } from '@/shared/utils/logger';
import { CurrencyFormModal } from './CurrencyCodeFormModal';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

export default function CurrencyCodeList() {
    const { filters, setFilters, resetFilters } = useTableFilters();
    const { confirm } = useConfirmation();
    const [data, setData] = useState<Currency[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await CurrencyService.getCurrencies();
            setData(response.items);
        } catch (error) {
            logger.error('[CurrencyCodeList] Fetch error:', error);
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

    const handleDelete = useCallback(async (id: string, code: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบ',
            description: `คุณต้องการลบสกุลเงิน ${code} ใช่หรือไม่?`,
            variant: 'danger',
        });

        if (isConfirmed) {
            const success = await CurrencyService.deleteCurrency(id);
            if (success) {
                fetchData();
            } else {
                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    }, [confirm, fetchData]);

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
                        onClick={() => handleEdit(row.original.currency_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.currency_id, row.original.currency_code)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [handleEdit, handleDelete]);

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
                    onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                    onSearch={() => {}}
                    onReset={resetFilters}
                    onCreate={handleCreate}
                    createLabel="เพิ่มสกุลเงินใหม่"
                    accentColor="blue"
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                        พบข้อมูล {data.length} รายการ
                    </h2>
                </div>

                <SmartTable
                    data={data}
                    columns={columns}
                    isLoading={isLoading}
                    rowIdField="currency_id"
                    pagination={{
                        pageIndex: 1,
                        pageSize: 10,
                        totalCount: data.length,
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
                    }}
                />
            </div>

            <CurrencyFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editId={editId}
                onSuccess={fetchData}
            />
        </div>
    );
}



