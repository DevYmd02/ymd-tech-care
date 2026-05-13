import { useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { POService } from '@/modules/procurement/services';
import type { POListParams, POStatus } from '@/modules/procurement/types';
import type { FilterFieldConfig } from '@ui';
import api from '@/core/api/api';
import { extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

// ====================================================================================
// CONSTANTS
// ====================================================================================

export const PO_STATUS_OPTIONS = [
    { value: 'ALL',              label: 'ทั้งหมด' },
    { value: 'DRAFT',            label: 'แบบร่าง' },
    { value: 'PENDING_APPROVAL', label: 'รออนุมัติ' },
    { value: 'APPROVED',         label: 'อนุมัติแล้ว' },
    { value: 'PARTIAL',          label: 'อนุมัติบางส่วน' },
    { value: 'REJECTED',         label: 'ไม่อนุมัติ' },
    { value: 'COMPLETED',        label: 'ปิดรายการ' },
    { value: 'CANCELLED',        label: 'ยกเลิก' },
];

export type POFilterKeys = Extract<keyof TableFilters<POStatus>, string>;

export const PO_FILTER_CONFIG: FilterFieldConfig<POFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PO_STATUS_OPTIONS },
    { name: 'date_start', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'date_end', label: 'ถึงวันที่', type: 'date' },
];

// Status priority: POA approval records override raw PO status
const OVERRIDABLE_STATUSES = new Set(['APPROVED', 'PARTIAL', 'REJECTED', 'COMPLETED', 'ISSUED']);

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
        // For status filter: If REJECTED or APPROVED are requested, we widen the search
        // to catch items currently waiting in PENDING_APPROVAL that have overlays.
        status: (filters.status === 'ALL' || filters.status === 'REJECTED') ? undefined : filters.status,
        date_from: filters.date_start || undefined,
        date_to: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined,
    }), [filters]);

    // Main PO list
    const { data, isLoading } = useQuery({
        queryKey: ['purchase-orders', apiFilters],
        queryFn: ({ signal }) => POService.getList(apiFilters, { signal }),
        placeholderData: keepPreviousData,
    });

    // 🛡️ POA Status Overlay: fetch approval records to get the true status
    // Backend /po endpoint may return PENDING_APPROVAL even when POA has REJECTED/APPROVED it
    const { data: approvalRaw } = useQuery({
        queryKey: ['po-approval-status-overlay'],
        queryFn: ({ signal }) => api.get<Record<string, unknown>>('/po-approval', { 
            params: { limit: 1000, page: 1 },
            signal 
        }),
        staleTime: 5 * 60 * 1000, // 💡 Increase to 5 mins for high concurrency
        enabled: !!data?.data.length, // 💡 Only fetch if we have data to overlay
    });

    // Build po_header_id → corrected status map
    const poaStatusMap = useMemo(() => {
        const map = new Map<number, POStatus>();
        const items = extractArrayFromResponse<Record<string, unknown>>(approvalRaw ?? {});
        items.forEach((a) => {
            const poId = Number(a.po_header_id || 0);
            const rawStatus = String(a.status || '').toUpperCase().trim();
            if (poId && OVERRIDABLE_STATUSES.has(rawStatus)) {
                map.set(poId, rawStatus as POStatus);
            }
        });
        return map;
    }, [approvalRaw]);

    // Merge POA status onto PO list items
    const enrichedData = useMemo(() => {
        if (!data || poaStatusMap.size === 0) return data;
        const enrichedItems = data.data.map(item => {
            const overrideStatus = poaStatusMap.get(item.po_id) ?? poaStatusMap.get(item.po_header_id);
            if (!overrideStatus) return item;
            // REJECTED items should show 0 amount
            const total_amount = overrideStatus === 'REJECTED' ? 0 : item.total_amount;
            return { ...item, status: overrideStatus, total_amount };
        });
        // If status filter is active, re-filter after overlay
        const status = filters.status;
        const finalItems = (status && status !== 'ALL')
            ? enrichedItems.filter(i => i.status === status)
            : enrichedItems;
        // Only override total if we are doing extra client-side status filtering here
        const total = (status && status !== 'ALL') ? finalItems.length : (data.total ?? finalItems.length);
        return { ...data, data: finalItems, total };
    }, [data, poaStatusMap, filters.status]);

    // handleFilterChange wrapper: typed for POFilterKeys
    const handleFilterChange = useCallback((name: POFilterKeys, value: string) => {
        hookHandleFilterChange(name, value);
    }, [hookHandleFilterChange]);

    return {
        data: enrichedData,
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
