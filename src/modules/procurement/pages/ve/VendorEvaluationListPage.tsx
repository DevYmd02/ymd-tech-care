import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Eye, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { VendorEvaluationFormModal } from './components/VendorEvaluationFormModal';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { VEService } from '../../services/ve.service';
import type { VEListParams, VendorEvaluationHeader, VendorGrade, EvaluationResult } from '@/modules/procurement/types/ve-types';

// ====================================================================================
// OPTIONS
// ====================================================================================

const FILTER_GRADE_OPTIONS = [
    { value: 'ALL', label: 'ทุกเกรด' },
    { value: 'Preferred', label: 'Preferred' },
    { value: 'Grade A', label: 'Grade A' },
    { value: 'Grade B', label: 'Grade B' },
    { value: 'Grade C', label: 'Grade C' },
];

const FILTER_RESULT_OPTIONS = [
    { value: 'ALL', label: 'ทุกผลลัพธ์' },
    { value: 'PASS', label: 'ผ่านเกณฑ์' },
    { value: 'IMPROVE', label: 'ต้องปรับปรุง' },
    { value: 'TERMINATE', label: 'ยกเลิกการติดต่อ' },
];

const getGradeColor = (grade: string) => {
    switch (grade) {
        case 'Preferred': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Grade A': return 'bg-green-100 text-green-700 border-green-200';
        case 'Grade B': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Grade C': return 'bg-orange-100 text-orange-700 border-orange-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const getResultColor = (result: string) => {
    switch (result) {
        case 'PASS': return 'bg-green-500';
        case 'IMPROVE': return 'bg-amber-500';
        case 'TERMINATE': return 'bg-red-500';
        default: return 'bg-gray-400';
    }
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function VendorEvaluationListPage() {
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<string>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'vendor_name',
            search2: 'evaluation_period',
            search3: 'evaluation_result'
        }
    });

    const apiFilters: VEListParams = {
        vendor_name: filters.search || undefined,
        evaluation_period: filters.search2 || undefined,
        vendor_grade: filters.status === 'ALL' ? undefined : (filters.status as VendorGrade),
        evaluation_result: filters.search3 === 'ALL' ? undefined : (filters.search3 as EvaluationResult),
        date_from: filters.date_start || undefined,
        date_to: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    const { data, isLoading } = useQuery({
        queryKey: ['vendor-evaluations', apiFilters],
        queryFn: () => VEService.getList(apiFilters),
        placeholderData: keepPreviousData,
        retry: false,
    });

    const queryClient = useQueryClient();

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleCreate = useCallback(() => {
        setSelectedId(null);
        setIsFormModalOpen(true);
    }, []);

    const handleView = useCallback((row: VendorEvaluationHeader) => {
        if (!row.evaluation_id) return;
        setSelectedId(row.evaluation_id);
        setIsFormModalOpen(true);
    }, []);

    // Columns Definition
    const columnHelper = createColumnHelper<VendorEvaluationHeader>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('evaluation_date', {
            header: 'วันที่ประเมิน',
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            size: 110,
            enableSorting: false,
        }),
        columnHelper.accessor('evaluation_period', {
            header: 'รอบการประเมิน',
            cell: (info) => (
                <div className="text-center font-medium text-gray-700 dark:text-gray-300">
                    {info.getValue() || '-'}
                </div>
            ),
            size: 130,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ชื่อผู้ขาย',
            cell: (info) => (
                <span className="font-bold text-slate-800 dark:text-slate-200">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 250,
            enableSorting: false,
        }),
        columnHelper.accessor('total_score', {
            header: () => <div className="text-center w-full">คะแนนรวม</div>,
            cell: ({ row }) => (
                <div className="text-center font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {Number(row.original.total_score).toFixed(2)}
                </div>
            ),
            size: 100,
        }),
        columnHelper.accessor('vendor_grade', {
            header: () => <div className="text-center w-full">เกรดผู้ขาย</div>,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <span className={`px-2.5 py-1 rounded-md border text-xs font-bold ${getGradeColor(row.original.vendor_grade)}`}>
                        {row.original.vendor_grade || '-'}
                    </span>
                </div>
            ),
            size: 120,
        }),
        columnHelper.accessor('evaluation_result', {
            header: () => <div className="text-center w-full">ผลการตัดสิน</div>,
            cell: ({ row }) => {
                const label = FILTER_RESULT_OPTIONS.find(o => o.value === row.original.evaluation_result)?.label || '-';
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${getResultColor(row.original.evaluation_result)}`} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                    </div>
                );
            },
            size: 140,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => handleView(row.original)}
                            className="p-1.5 rounded-md text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>
                );
            },
            size: 80,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleView]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="แบบประเมินผู้ขาย"
                subtitle="Vendor Evaluation Form"
                icon={ClipboardCheck}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <FilterField
                                label="ชื่อผู้ขาย"
                                value={localFilters.search}
                                onChange={(val: string) => handleFilterChange('search', val)}
                                placeholder="ค้นหาชื่อผู้ขาย..."
                                accentColor="blue"
                            />
                            <FilterField
                                label="รอบการประเมิน"
                                value={localFilters.search2}
                                onChange={(val: string) => handleFilterChange('search2', val)}
                                placeholder="เช่น 2026 - ไตรมาส 1"
                                accentColor="blue"
                            />
                            <FilterField
                                label="เกรดผู้ขาย"
                                type="select"
                                value={localFilters.status}
                                onChange={(val: string) => handleFilterChange('status', val)}
                                options={FILTER_GRADE_OPTIONS}
                                accentColor="blue"
                            />
                            <FilterField
                                label="ผลการตัดสิน"
                                type="select"
                                value={localFilters.search3 || 'ALL'}
                                onChange={(val: string) => handleFilterChange('search3', val)}
                                options={FILTER_RESULT_OPTIONS}
                                accentColor="blue"
                            />
                            <FilterField
                                label="วันที่เริ่มต้น"
                                type="date"
                                value={localFilters.date_start || ''}
                                onChange={(val: string) => handleFilterChange('date_start', val)}
                                accentColor="blue"
                            />
                            <FilterField
                                label="วันที่สิ้นสุด"
                                type="date"
                                value={localFilters.date_end || ''}
                                onChange={(val: string) => handleFilterChange('date_end', val)}
                                accentColor="blue"
                            />
                            
                            <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                    >
                                        ล้างค่า
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <Search size={18} />
                                        ค้นหา
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="w-full sm:w-auto h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    สร้างแบบประเมินผู้ขาย
                                </button>
                            </div>
                        </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={data?.data ?? []}
                            columns={columns}
                            isLoading={isLoading}
                            pagination={{
                                pageIndex: filters.page,
                                pageSize: filters.limit,
                                totalCount: data?.total ?? 0,
                                onPageChange: handlePageChange,
                                onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                            }}
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                            rowIdField="evaluation_id"
                            className="h-full"
                        />
                    </div>

                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {data?.data.map((item) => (
                            <MobileListCard
                                key={item.evaluation_id}
                                title={item.vendor_name}
                                subtitle={item.evaluation_date ? formatThaiDate(item.evaluation_date) : '-'}
                                statusBadge={<span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getGradeColor(item.vendor_grade)}`}>{item.vendor_grade}</span>}
                                details={[
                                    { label: 'รอบการประเมิน:', value: <span className="font-medium text-slate-700">{item.evaluation_period}</span> },
                                    { label: 'คะแนนรวม:', value: <span className="font-bold text-indigo-600">{Number(item.total_score).toFixed(2)}</span> },
                                    { label: 'เกรด:', value: <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getGradeColor(item.vendor_grade)}`}>{item.vendor_grade}</span> },
                                ]}
                                amountLabel="ผลการตัดสิน"
                                amountValue={
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${getResultColor(item.evaluation_result)}`} />
                                        <span className="text-sm font-semibold">{FILTER_RESULT_OPTIONS.find(o => o.value === item.evaluation_result)?.label}</span>
                                    </div>
                                }
                                actions={
                                    <button
                                        onClick={() => handleView(item)}
                                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} /> ดูรายละเอียด
                                    </button>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            {isFormModalOpen && (
                <VendorEvaluationFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    evaluationId={selectedId}
                    onSuccess={() => {
                        setIsFormModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['vendor-evaluations'] });
                    }}
                />
            )}
        </>
    );
}
