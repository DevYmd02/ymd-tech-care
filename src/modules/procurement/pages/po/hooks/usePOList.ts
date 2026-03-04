import { useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { POService } from '@/modules/procurement/services';
import type { POListParams, POStatus } from '@/modules/procurement/types';
import type { FilterFieldConfig } from '@ui';

// ====================================================================================
// CONSTANTS
// ====================================================================================

export const PO_STATUS_OPTIONS = [
    { value: 'ALL',              label: 'ทั้งหมด' },
    { value: 'DRAFT',            label: 'แบบร่าง' },
    { value: 'PENDING_APPROVAL', label: 'รออนุมัติ' },
    { value: 'APPROVED',         label: 'อนุมัติแล้ว' },
    { value: 'ISSUED',           label: 'ออก PO แล้ว' },
    { value: 'COMPLETED',        label: 'ปิดรายการ' },
    { value: 'CANCELLED',        label: 'ยกเลิก' },
];

export type POFilterKeys = Extract<keyof TableFilters<POStatus>, string>;

export const PO_FILTER_CONFIG: FilterFieldConfig<POFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PO_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

// ====================================================================================
// HOOK
// ====================================================================================

export const usePOList = () => {
    const {
        filters,
        localFilters,
        handleFilterChange: hookHandleFilterChange,
        handleApplyFilters,
        setFilters,
        resetFilters,
        handlePageChange,
        handleSortChange,
        sortConfig,
    } = useTableFilters<POStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'po_no',
            search2: 'pr_no',
            search3: 'vendor_name'
        }
    });

    // Convert generic filter shape to API-specific params (uses APPLIED filters from URL)
    const apiFilters: POListParams = useMemo(() => ({
        po_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        vendor_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined,
    }), [filters]);

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['purchase-orders', apiFilters],
        queryFn: () => POService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // handleFilterChange wrapper: typed for POFilterKeys
    const handleFilterChange = useCallback((name: POFilterKeys, value: string) => {
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
        handleSortChange,
        sortConfig,
    };
};
