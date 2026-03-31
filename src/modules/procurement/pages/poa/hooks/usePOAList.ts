import { useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { POAService } from '@/modules/procurement/services/poa.service';
import type { POListParams, POStatus } from '@/modules/procurement/types';
import type { FilterFieldConfig } from '@ui';

export const POA_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'PENDING_APPROVAL', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'PARTIAL', label: 'อนุมัติบางส่วน' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
];

export type POAFilterKeys = Extract<keyof TableFilters<POStatus>, string> | 'status'; // Add status to keys if not present

export const POA_FILTER_CONFIG: FilterFieldConfig<POAFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'date_start', label: 'วันที่เริ่มต้น', type: 'date' },
    { name: 'date_end', label: 'วันที่สิ้นสุด', type: 'date' },
    { name: 'status', label: 'สถานะ', type: 'select', options: POA_STATUS_OPTIONS },
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
            search3: 'vendor_name',
            search4: 'poa_no'
        }
    });

    const apiFilters: POListParams = useMemo(() => ({
        po_no: filters.search || undefined,
        poa_no: filters.search4 || undefined,
        pr_no: filters.search2 || undefined,
        vendor_name: filters.search3 || undefined,
        status: filters.status as any, // Pass directly, service will handle mapping
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
