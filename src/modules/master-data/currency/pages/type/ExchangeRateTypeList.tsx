import { useMemo, useState, useEffect, useCallback } from 'react';
import { Layers, Edit2, Trash2 } from 'lucide-react';
import { SmartTable } from '@ui';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ActiveStatusBadge } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExchangeRateType } from '@currency/types/currency-types';
import { CurrencyService } from '@currency/services/currency.service';
import { logger } from '@/shared/utils/logger';
import { ExchangeRateTypeFormModal } from './ExchangeRateTypeFormModal';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

export default function ExchangeRateTypeList() {
    const { filters, setFilters, resetFilters } = useTableFilters();
    const { confirm } = useConfirmation();
    const [data, setData] = useState<ExchangeRateType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await CurrencyService.getExchangeRateTypes();
            setData(response.items);
        } catch (error) {
            logger.error('[ExchangeRateTypeList] Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
            description: `คุณต้องการประเภทอัตราแลกเปลี่ยน ${code} ใช่หรือไม่?`,
            variant: 'danger',
        });

        if (isConfirmed) {
            const res = await CurrencyService.deleteExchangeRateType(id);
            if (res.success) {
                fetchData();
            } else {
                alert(res.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        }
    }, [confirm, fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleEdit(row.original.currency_type_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.currency_type_id, row.original.code || '')}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
            size: 120,
            minSize: 120
        }
    ], [handleEdit, handleDelete]);

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
                    onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                    onSearch={() => {}}
                    onReset={resetFilters}
                    onCreate={handleCreate}
                    createLabel="เพิ่มประเภทใหม่"
                    accentColor="blue"
                    actionColSpan={{ md: 4, lg: 5, xl: 7 }}
                    actionAlign="start"
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
                rowIdField="currency_type_id"
                pagination={{
                    pageIndex: 1,
                    pageSize: 10,
                    totalCount: data.length,
                    onPageChange: () => {},
                    onPageSizeChange: () => {},
                }}   
            />
            </div>

            <ExchangeRateTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editId={editId}
                onSuccess={fetchData}
            />
        </div>
    );
}



