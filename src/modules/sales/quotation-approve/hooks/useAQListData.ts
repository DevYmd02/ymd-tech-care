import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AQService } from '../services/aq.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';
import type { AQListItem } from '../types/quotation-approve.types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';

export interface UseAQListDataParams {
  sqNo?: string;
  aqNo?: string;
  customerFilter?: string;
  statusFilter?: string;
  startDate?: string;
  endDate?: string;
}

export const useAQListData = (params: UseAQListDataParams) => {
  const { statusFilter = 'PENDING', sqNo, aqNo, customerFilter, startDate, endDate } = params;

  // 1. Customer lookup (Needed for mapping in service)
  const { data: customerResponse } = useQuery({
    queryKey: ['master-customers-lookup'],
    queryFn: () => CustomerService.getList({ limit: 1000 }),
    staleTime: 30 * 60 * 1000,
  });

  const customerMap = useMemo(() => {
    const map = new Map<string | number, string>();
    const items = extractArrayFromResponse<CustomerMaster>(customerResponse as object);
    items.forEach((c) => {
      map.set(String(c.customer_id), c.customer_name_th || c.customer_name || '');
    });
    return map;
  }, [customerResponse]);

  // 2. Actionable Pending SQs
  const { data: actionableData, isLoading: isLoadingActionable, refetch: refetchActionable } = useQuery({
    queryKey: ['sq-approvals-actionable', customerMap.size > 0],
    queryFn: () => AQService.getPendingSQs(customerMap),
    staleTime: 3 * 60 * 1000,
  });

  // 3. Fallback Pending SQs
  const { data: fallbackData, isLoading: isLoadingFallback, refetch: refetchFallback } = useQuery({
    queryKey: ['sq-approvals-fallback', customerMap.size > 0],
    queryFn: () => AQService.getAllPendingSQsFallback(customerMap),
    staleTime: 3 * 60 * 1000,
  });

  // 4. AQ History
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['sq-approvals-history', customerMap.size > 0],
    queryFn: () => AQService.getApprovalList({ limit: 1000, page: 1 }, customerMap),
    staleTime: 3 * 60 * 1000,
  });

  const refetch = () => {
    refetchActionable();
    refetchFallback();
    refetchHistory();
  };

  const mergedData = useMemo((): AQListItem[] => {
    // 1. Group all records by sq_id
    const rawAll = [
      ...(actionableData || []),
      ...(fallbackData || []),
      ...(historyData || [])
    ];

    const sqGroups = new Map<number, AQListItem[]>();
    rawAll.forEach(item => {
      if (!item.sq_id) return;
      if (!sqGroups.has(item.sq_id)) sqGroups.set(item.sq_id, []);
      sqGroups.get(item.sq_id)!.push(item);
    });

    // 2. Select the "best" record for each SQ
    const result: AQListItem[] = [];
    sqGroups.forEach((items) => {
      // Priority 1: Any record that is actually PENDING (needs action)
      // If an SQ is pending, we want the "Pending" version to show the "Consider" button.
      const pendingItem = items.find(it => it.status === 'PENDING');
      if (pendingItem) {
        result.push(pendingItem);
        return;
      }

      // Priority 2: Record with an actual AQ Number (History / Already Processed)
      // This ensures we show the AQ No. and Approver name for approved/rejected SQs.
      const historyItems = items
        .filter(it => !!it.aq_no && it.aq_no !== '' && it.aq_no !== '— รอพิจารณา —')
        .sort((a, b) => (Number(b.aq_id) || 0) - (Number(a.aq_id) || 0));
        
      if (historyItems.length > 0) {
        result.push(historyItems[0]);
        return;
      }

      // Priority 3: Fallback to any non-draft record
      // EXCLUDE 'DRAFT' status as it shouldn't be in the approval list
      const fallbackItem = items.find(it => it.status !== 'DRAFT');
      if (fallbackItem) {
        result.push(fallbackItem);
      }
    });

    // Sort by SQ date descending (standard behavior)
    return result.sort((a, b) => String(b.sq_date || '').localeCompare(String(a.sq_date || '')));
  }, [actionableData, fallbackData, historyData]);

  const filteredData = useMemo(() => {
    return mergedData.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (sqNo && !String(row.sq_no || '').toLowerCase().includes(sqNo.toLowerCase())) return false;
      if (aqNo && !String(row.aq_no || '').toLowerCase().includes(aqNo.toLowerCase())) return false;
      if (customerFilter && !String(row.customer_name || '').toLowerCase().includes(customerFilter.toLowerCase())) return false;
      if (startDate && String(row.sq_date || row.aq_date || '') < startDate) return false;
      if (endDate && String(row.sq_date || row.aq_date || '') > endDate) return false;
      return true;
    });
  }, [mergedData, statusFilter, sqNo, aqNo, customerFilter, startDate, endDate]);

  const isLoading = isLoadingActionable || isLoadingFallback || isLoadingHistory;

  return {
    filteredData,
    mergedData,
    isLoading,
    refetch,
    customerMap
  };
};
