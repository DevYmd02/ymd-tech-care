import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AOService } from '../services/ao.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { SalesOrderService } from '@sales/sales-order/services/sales-order.service';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';
import type { AOListItem } from '../types/sales-order-approval.types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';

export interface UseAOListDataParams {
  soNo?: string;
  aoNo?: string;
  customerFilter?: string;
  statusFilter?: string;
  startDate?: string;
  endDate?: string;
}

export const useAOListData = (params: UseAOListDataParams) => {
  const { statusFilter = 'PENDING', soNo, aoNo, customerFilter, startDate, endDate } = params;

  // 1. Customer lookup
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

  // 1.5. SO Number lookup (จำเป็นสำหรับหน้าประวัติที่ API ส่งมาไม่ครบ)
  const { data: soResponse } = useQuery({
    queryKey: ['so-numbers-lookup'],
    queryFn: () => SalesOrderService.getList({ limit: 1000 }),
    staleTime: 10 * 60 * 1000,
  });

  const soMap = useMemo(() => {
    const map = new Map<string | number, Record<string, unknown>>();
    const items = (soResponse as unknown as { data?: Record<string, unknown>[] })?.data || [];
    items.forEach((s) => {
      map.set(String(s.so_id), s);
    });
    return map;
  }, [soResponse]);

  // 2. Fetch Pending SOs
  const { data: pendingData, isLoading: isLoadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['so-approvals-pending-list', customerMap.size > 0, soMap.size > 0],
    queryFn: () => AOService.getPendingSOs(customerMap, soMap),
    staleTime: 3 * 60 * 1000,
  });

  // 3. Fetch History
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['so-approvals-history-list', customerMap.size > 0, soMap.size > 0],
    queryFn: () => AOService.getApprovalList({ limit: 1000, page: 1 }, customerMap, soMap),
    staleTime: 3 * 60 * 1000,
  });

  const refetch = () => {
    refetchPending();
    refetchHistory();
  };

  const mergedData = useMemo((): AOListItem[] => {
    return [...(pendingData || []), ...(historyData || [])];
  }, [pendingData, historyData]);

  const filteredData = useMemo(() => {
    return mergedData.filter((row) => {
      const rowStatus = row.status;
      if (statusFilter !== 'ALL' && rowStatus !== statusFilter) return false;
      if (soNo && !String(row.so_no || '').toLowerCase().includes(soNo.toLowerCase())) return false;
      if (aoNo && !String(row.ao_no || '').toLowerCase().includes(aoNo.toLowerCase())) return false;
      if (customerFilter && !String(row.customer_name || '').toLowerCase().includes(customerFilter.toLowerCase())) return false;
      if (startDate && String(row.so_date || row.ao_date || '') < startDate) return false;
      if (endDate && String(row.so_date || row.ao_date || '') > endDate) return false;
      return true;
    });
  }, [mergedData, statusFilter, soNo, aoNo, customerFilter, startDate, endDate]);

  const isLoading = isLoadingPending || isLoadingHistory;

  return {
    filteredData,
    mergedData,
    isLoading,
    refetch,
    customerMap
  };
};
