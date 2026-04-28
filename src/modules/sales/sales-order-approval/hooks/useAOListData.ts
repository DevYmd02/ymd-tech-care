/**
 * @file useAOListData.ts
 * @description Custom hook for managing Sales Order Approval (AO) list data
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AOService } from '../services/ao.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';
import type { AOListItem, SOForApproval } from '../types/sales-order-approval.types';
import type { SalesOrderFormData } from '@sales/sales-order/types/sales-order.types';
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

  // 1. PENDING Actionable SOs
  const { data: actionablePendingRaw, isLoading: isLoadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['so-approvals-actionable'],
    queryFn: () => AOService.getPendingSOs(),
    staleTime: 3 * 60 * 1000,
  });

  // 2. ALL PENDING SOs (Source of Truth Fallback)
  const { data: allPendingRaw, isLoading: isLoadingAllPending, refetch: refetchAllPending } = useQuery({
    queryKey: ['so-approvals-all-pending'],
    queryFn: () => AOService.getAllPendingSOsFallback(),
    staleTime: 3 * 60 * 1000,
  });

  // 3. AO History
  const { data: aoHistoryRaw, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['so-approvals-history'],
    queryFn: () => AOService.getApprovalList({ 
      status: undefined, 
      limit: 1000, 
      page: 1 
    }),
    staleTime: 3 * 60 * 1000,
  });

  // 4. Customer lookup
  const { data: customerResponse } = useQuery({
    queryKey: ['master-customers-lookup'],
    queryFn: () => CustomerService.getList({ limit: 1000 }),
    staleTime: 30 * 60 * 1000,
  });

  const refetch = () => {
    refetchPending();
    refetchAllPending();
    refetchHistory();
  };

  const customerMap = useMemo(() => {
    const map = new Map<string | number, string>();
    const items = extractArrayFromResponse<CustomerMaster>(customerResponse as object);
    items.forEach((c) => {
      map.set(String(c.customer_id), c.customer_name_th || c.customer_name || '');
    });
    return map;
  }, [customerResponse]);
  
  const getSoHeader = (obj: Record<string, unknown>) => {
    return (obj.so_header || obj.so || obj.sale_order || obj.sale_order_header) as Record<string, unknown> | undefined;
  };

  const mergedData = useMemo((): AOListItem[] => {
    // 1. Extract History
    const aoHistory: Array<Record<string, unknown>> = (() => {
      if (!aoHistoryRaw) return [];
      const r = aoHistoryRaw as Record<string, unknown>;
      if (Array.isArray(r.data)) return r.data as Array<Record<string, unknown>>;
      if (Array.isArray(aoHistoryRaw)) return aoHistoryRaw as Array<Record<string, unknown>>;
      return [];
    })();

    // 2. Build Maps
    const historyBySoId = new Map<string | number, Record<string, unknown>>();
    aoHistory.forEach((ao) => {
      const soId = ao.so_id as string | number;
      if (soId) {
        const existing = historyBySoId.get(soId);
        if (!existing || Number(ao.ao_id) > Number(existing.ao_id)) {
          historyBySoId.set(soId, ao);
        }
      }
    });

    const actionableItems = extractArrayFromResponse<SOForApproval>(actionablePendingRaw as object);
    const fallbackItems = extractArrayFromResponse<SalesOrderFormData>(allPendingRaw as object);
    
    const getAnyId = (i: unknown): string | number => {
      const obj = i as Record<string, unknown>;
      return (obj.so_id || obj.id || obj.sale_order_id || 0) as string | number;
    };

    const pendingIdSet = new Set<string | number>();
    [...actionableItems, ...fallbackItems].forEach(i => {
      const id = getAnyId(i);
      if (id) pendingIdSet.add(id);
    });

    // 3. Define Handled SOs
    const handledSoIds = new Set<string | number>(
      [...historyBySoId.entries()]
        .filter(([soId, ao]) => {
          const s = String(ao.status || '').toUpperCase();
          const isHandled = s === 'APPROVED' || s === 'REJECTED';
          return isHandled && !pendingIdSet.has(soId);
        })
        .map(([soId]) => soId)
    );

    interface RawSalesData extends Record<string, unknown> {
      total_amount?: number;
      quote_total_amount?: number;
      base_total_amount?: number;
      so_id?: string | number;
      id?: string | number;
    }

    const fallbackMap = new Map<string | number, RawSalesData>();
    fallbackItems.forEach(i => {
      const id = getAnyId(i);
      if (id) fallbackMap.set(id, i as unknown as RawSalesData);
    });

    const uniquePendingItemsMap = new Map<string | number, RawSalesData>();
    [...fallbackItems, ...actionableItems].forEach(rawItem => {
      const item = rawItem as RawSalesData;
      const id = getAnyId(item);
      if (id && !handledSoIds.has(id)) {
        const fallback = fallbackMap.get(id);
        const mergedItem: RawSalesData = { ...item };
        if (fallback) {
          mergedItem.total_amount = fallback.total_amount ?? mergedItem.total_amount;
          mergedItem.quote_total_amount = (fallback.total_amount || fallback.quote_total_amount) ?? mergedItem.quote_total_amount;
          mergedItem.base_total_amount = fallback.base_total_amount ?? mergedItem.base_total_amount;
        }
        uniquePendingItemsMap.set(id, mergedItem);
      }
    });

    const pendingRows: AOListItem[] = Array.from(uniquePendingItemsMap.values()).map((raw) => {
      const r = raw as Record<string, unknown>;
      const soId = (r.so_id || r.id || 0) as string | number;
      const cid = String(r.customer_id || '');
      const rawCustomerName = String(r.customer_name || r.customer_name_th || r.cust_name || '');
      const customerNameFallback = customerMap.get(cid) || (rawCustomerName.includes('Customer ID:') ? '' : rawCustomerName);

      return {
        row_key: `pending-${soId}`,
        so_id: soId,
        so_no: String(r.so_no || ''),
        so_date: String(r.so_date || r.date || '').split('T')[0],
        customer_name: customerNameFallback,
        customer_code: String(r.customer_code || ''),
        status: 'PENDING',
        quote_total_amount: Number(r.quote_total_amount || r.total_amount || 0),
        base_total_amount: Number(r.base_total_amount || (Number(r.quote_total_amount || r.total_amount || 0) * Number(r.exchange_rate || (r.rawData as Record<string, unknown>)?.exchange_rate || (r.raw as Record<string, unknown>)?.exchange_rate || 1))),
        currency: String(r.currency || r.quote_currency_code || r.currency_code || 'THB'),
        raw: r,
      } satisfies AOListItem;
    });

    // 5. Map History rows
    const historyRows: AOListItem[] = aoHistory.map((ao, index) => {
        const obj = ao as Record<string, unknown>;
        const soObj = getSoHeader(obj);
        const soId = getAnyId(obj);
        const soNo = String(
          obj.so_no || 
          obj.sale_order_no || 
          obj.ref_no || 
          obj.ref_so_no ||
          soObj?.so_no || 
          soObj?.code || 
          soObj?.no || 
          ''
        );
        const soDate = String(obj.so_date || obj.sale_order_date || soObj?.so_date || soObj?.date || obj.ao_date || obj.created_at || '').split('T')[0];
        const cid = String(obj.customer_id || soObj?.customer_id || soObj?.id_customer || '');
        const rawCustomerName = String(obj.customer_name || obj.customer_name_th || obj.customer_name_en || soObj?.customer_name || soObj?.customer_name_th || obj.cust_name || '');
        const customerName = customerMap.get(cid) || (rawCustomerName.includes('Customer ID:') ? '' : rawCustomerName);
        const customerCode = String(obj.customer_code || soObj?.customer_code || soObj?.code || obj.cust_code || '');
        const rawQuoteAmount = Number(obj.quote_total_amount || obj.base_total_amount || 0);
        const soTotalAmount = Number(soObj?.quote_total_amount || soObj?.base_total_amount || soObj?.total_amount || 0);
        
        // 🛡️ Financial Consistency: Favor original SO total if available, as it's the primary source of truth.
        const displayQuoteAmount = (soTotalAmount > 0) ? soTotalAmount : rawQuoteAmount;

        const status = String(obj.status || 'PENDING').toUpperCase();
        const isRejected = status === 'REJECTED';
        const finalQuoteAmount = isRejected ? 0 : displayQuoteAmount;
        const finalBaseAmount = isRejected ? 0 : Number(obj.base_total_amount || soObj?.base_total_amount || (finalQuoteAmount * Number(obj.exchange_rate || 1)));

        return {
          row_key: `history-${obj.ao_id || obj.id || index}`,
          ao_id: Number(obj.ao_id || obj.id),
          ao_no: String(obj.ao_no || ''),
          ao_date: String(obj.ao_date || '').split('T')[0],
          so_id: soId,
          so_no: soNo,
          so_date: soDate,
          customer_name: customerName,
          customer_code: customerCode,
          status,
          approval_emp_name: String(obj.approval_emp_name || ''),
          quote_total_amount: finalQuoteAmount,
          base_total_amount: finalBaseAmount,
          currency: String(obj.currency || obj.quote_currency_code || obj.currency_code || 'THB'),
          raw: obj,
        } satisfies AOListItem;
    });

    return [...pendingRows, ...historyRows];
  }, [actionablePendingRaw, allPendingRaw, aoHistoryRaw, customerMap]);

  const filteredData = useMemo(() => {
    return mergedData.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (soNo && !String(row.so_no || '').toLowerCase().includes(soNo.toLowerCase())) return false;
      if (aoNo && !String(row.ao_no || '').toLowerCase().includes(aoNo.toLowerCase())) return false;
      if (customerFilter && !String(row.customer_name || '').toLowerCase().includes(customerFilter.toLowerCase())) return false;
      if (startDate && String(row.so_date || row.ao_date || '') < startDate) return false;
      if (endDate && String(row.so_date || row.ao_date || '') > endDate) return false;
      return true;
    });
  }, [mergedData, statusFilter, soNo, aoNo, customerFilter, startDate, endDate]);

  const isLoading = isLoadingPending || isLoadingHistory || isLoadingAllPending;

  return {
    filteredData,
    mergedData,
    isLoading,
    refetch,
    customerMap
  };
};
