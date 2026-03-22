import { useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { POAService } from '@/modules/procurement/services/poa.service';
import type { POListParams, POStatus } from '@/modules/procurement/types';
import type { FilterFieldConfig } from '@ui';

export const POA_STATUS_OPTIONS = [
    { value: 'PENDING_APPROVAL', label: 'รออนุมัติ' },
    // You could also show recently approved/rejected if needed, but usually POA is just pending
];

export type POAFilterKeys = Extract<keyof TableFilters<POStatus>, string>;

export const POA_FILTER_CONFIG: FilterFieldConfig<POAFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'date_start', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'date_end', label: 'ถึงวันที่', type: 'date' },
];

export const usePOAList = () => {
    const {
        filters,
        localFilters,
        handleFilterChange: hookHandleFilterChange,
        handleApplyFilters,
        setFilters,
        resetFilters,
        handlePageChange,
    } = useTableFilters<POStatus>({
        defaultStatus: 'PENDING_APPROVAL', // Force pending approval
        customParamKeys: {
            search: 'po_no',
            search2: 'pr_no',
            search3: 'vendor_name'
        }
    });

    const apiFilters: POListParams = useMemo(() => ({
        po_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        vendor_name: filters.search3 || undefined,
        status: 'PENDING_APPROVAL', // Force status constraint
        date_from: filters.date_start || undefined,
        date_to: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined,
    }), [filters]);

    const { data, isLoading } = useQuery({
        queryKey: ['poa-list', apiFilters],
        queryFn: () => POAService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const handleFilterChange = useCallback((name: POAFilterKeys, value: string) => {
        hookHandleFilterChange(name, value);
    }, [hookHandleFilterChange]);

    return {
        data,
        isLoading,
        filters,
        localFilters,
        handleFilterChange,
        handleApplyFilters,
        setFilters,
        resetFilters,
        handlePageChange,
    };
};
