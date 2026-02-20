import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Edit2, Trash2 } from 'lucide-react';
import type { ExchangeRate } from '@currency/types/currency-types';
import { ActiveStatusBadge } from '@ui';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import { ExchangeRateFormModal } from './ExchangeRateFormModal';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';

// Interface for display data (enriched with master data names)
interface ExchangeRateDisplay extends ExchangeRate {
    currency_code: string;
    currency_name_th: string;
    currency_name_en: string; // Added for completeness
    type_code: string;
    type_name_th: string;
}

const STATUS_OPTIONS = [{ value: 'ALL', label: 'ทั้งหมด' }, { value: 'ACTIVE', label: 'ใช้งาน' }, { value: 'INACTIVE', label: 'ไม่ใช้งาน' }];

export default function ExchangeRateList() {
    // Custom filter keys must match what FilterFormBuilder expects if we use custom param keys, 
    // but here we just need standard search/status/dateFrom.
    // 'date' was causing issues as it's not in TableFilters. We'll use 'dateFrom' for the specific date filter.
    const { filters, setFilters, handlePageChange, resetFilters } = useTableFilters({ 
        customParamKeys: { search: 'currency_code', dateFrom: 'rate_date' } 
    });
    
    const [allData, setAllData] = useState<ExchangeRateDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    
    // useConfirmation returns the context directly, which contains 'confirm' function
    const { confirm } = useConfirmation();

    // Fix: FilterFieldConfig generic type must match keys of TableFilters
    // 'date' is not a valid key in TableFilters, we should use 'dateFrom' (mapped to rate_date above)
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสสกุลเงิน', 
            type: 'text', 
            placeholder: 'ระบุรหัส',
            colSpan: 1
        },
        { 
            name: 'dateFrom', 
            label: 'วันที่', 
            type: 'date',
            colSpan: 1
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS,
            colSpan: 1
        },
    ], []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch all required data in parallel
            const [ratesRes, currenciesRes, typesRes] = await Promise.all([
                CurrencyService.getExchangeRates(),
                CurrencyService.getCurrencies(),
                CurrencyService.getExchangeRateTypes()
            ]);
            
            // Create lookup maps for performance
            const currencyMap = new Map(currenciesRes.items.map(c => [c.currency_id, c]));
            const typeMap = new Map(typesRes.items.map(t => [t.currency_type_id, t]));

            // Join data
            const enrichedData: ExchangeRateDisplay[] = ratesRes.items.map(rate => {
                const currency = currencyMap.get(rate.currency_id);
                const type = typeMap.get(rate.currency_type_id);
                return {
                    ...rate,
                    currency_code: currency?.currency_code || '-',
                    currency_name_th: currency?.name_th || '',
                    currency_name_en: currency?.name_en || '',
                    type_code: type?.code || '-',
                    type_name_th: type?.name_th || '',
                };
            });

            setAllData(enrichedData);
        } catch (error) {
            logger.error('Failed to fetch exchange rate data', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allData];
        if (filters.status && filters.status !== 'ALL') result = result.filter(item => filters.status === 'ACTIVE' ? item.is_active : !item.is_active);
        if (filters.search) result = result.filter(item => item.currency_code.toLowerCase().includes(filters.search.toLowerCase()));
        
        // Exact date match using_dateFrom as the filter holder
        if (filters.dateFrom) result = result.filter(item => item.rate_date.startsWith(filters.dateFrom));
        
        return result;
    }, [allData, filters]);

    const paginatedData = useMemo(() => filteredData.slice((filters.page - 1) * filters.limit, filters.page * filters.limit), [filteredData, filters.page, filters.limit]);

    const handleDelete = useCallback((id: string) => {
        confirm({
            title: 'ลบข้อมูลอัตราแลกเปลี่ยน?',
            description: 'คุณต้องการลบข้อมูลนี้ใช่หรือไม่ การกระทำนี้ไม่สามารถเรียกคืนได้',
            variant: 'danger',
            confirmText: 'ใช่, ลบเลย',
            cancelText: 'ยกเลิก',
        }).then(async (isConfirmed) => {
            if (isConfirmed) {
                try {
                    await CurrencyService.deleteExchangeRate(id);
                    await fetchData();
                } catch (error) {
                    logger.error('Failed to delete exchange rate', error);
                }
            }
        });
    }, [confirm, fetchData]);

    // Define handleEdit to fix "Cannot find name 'handleEdit'" error
    const handleEdit = useCallback((id: string) => {
        setEditId(id);
        setIsModalOpen(true);
    }, []);

    const columns = useMemo<ColumnDef<ExchangeRateDisplay>[]>(() => [
        { 
            id: 'sequence', 
            header: () => <div className="whitespace-nowrap">ลำดับ</div>, 
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1, 
            size: 50 
        },
        { 
            accessorKey: 'rate_date', 
            header: () => <div className="whitespace-nowrap">วันที่</div>, 
            cell: ({ getValue }) => {
                const dateVal = getValue() as string;
                return dateVal ? new Date(dateVal).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
            },
            size: 90
        },
        { 
            id: 'currency',
            header: () => <div className="whitespace-nowrap">สกุลเงิน</div>, 
            accessorFn: (row) => `${row.currency_code} - ${row.currency_name_th}`,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-blue-600 leading-tight">{row.original.currency_code}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{row.original.currency_name_th}</span>
                </div>
            ),
            size: 130
        },
        { 
            id: 'type',
            header: () => <div className="whitespace-nowrap">ประเภท</div>, 
            accessorFn: (row) => `${row.type_code} - ${row.type_name_th}`,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium leading-tight">{row.original.type_code}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{row.original.type_name_th}</span>
                </div>
            ),
            size: 140
        },
        { 
            accessorKey: 'buy_rate', 
            header: () => <div className="whitespace-nowrap text-right w-full pr-2">ซื้อ (BUYING)</div>, 
            cell: ({ getValue }) => <div className="text-right pr-2 font-mono font-bold text-green-600">{Number(getValue() ?? 0).toFixed(4)}</div>,
            size: 100
        },
        { 
            accessorKey: 'sale_rate', 
            header: () => <div className="whitespace-nowrap text-right w-full pr-2">ขาย (SELLING)</div>, 
            cell: ({ getValue }) => <div className="text-right pr-2 font-mono font-bold text-red-600">{Number(getValue() ?? 0).toFixed(4)}</div>,
            size: 100
        },
        { 
            accessorKey: 'allow_adjust', 
            header: () => <div className="whitespace-nowrap text-center w-full">ALLOW ADJUST</div>, 
            cell: ({ getValue }) => <div className="text-center font-mono">{Number(getValue() ?? 0).toFixed(2)}</div>,
            size: 100
        },
        { 
            accessorKey: 'exchange_round', 
            header: () => <div className="whitespace-nowrap text-center w-full">FEE</div>, 
            cell: ({ row }) => <div className="text-center font-mono">{Number(row.original.fee ?? row.original.exchange_round ?? 0).toFixed(2)}</div>,
            size: 80
        },
        { 
            accessorKey: 'remark', 
            header: () => <div className="whitespace-nowrap">หมายเหตุ</div>,
            cell: ({ getValue }) => <div className="text-xs text-gray-600 line-clamp-1" title={getValue() as string}>{getValue() as string || '-'}</div>,
            size: 110 // Flex filler
        },
        { 
            accessorKey: 'is_active', 
            header: () => <div className="whitespace-nowrap text-center w-full">สถานะ</div>, 
            cell: ({ getValue }) => <div className="flex justify-center w-full"><ActiveStatusBadge isActive={getValue() as boolean} /></div>, 
            size: 100 
        },
        { 
            id: 'actions', 
            header: () => <div className="whitespace-nowrap text-center w-full">จัดการ</div>, 
            size: 90, 
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(row.original.exchange_id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(row.original.exchange_id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        },
    ], [filters.page, filters.limit, handleDelete, handleEdit]);

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
                    onFilterChange={(name: string, value: string) => {
                        setFilters({ [name]: value } as Partial<typeof filters>);
                    }}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={() => { setEditId(null); setIsModalOpen(true); }}
                    createLabel="เพิ่มอัตราแลกเปลี่ยน"
                    accentColor="blue"
                    columns={{ sm: 1, md: 5, lg: 5, xl: 5 }}
                    actionColSpan={{ sm: 'full', md: 2, lg: 2, xl: 2 }}
                />
            </div>

            <SmartTable
                data={paginatedData}
                columns={columns}
                isLoading={isLoading}
                rowIdField="exchange_id"
                pagination={{
                    pageIndex: filters.page,
                    pageSize: filters.limit,
                    totalCount: filteredData.length,
                    onPageChange: handlePageChange,
                    onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
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



