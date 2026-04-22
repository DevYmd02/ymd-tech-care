/**
 * @file useAQListData.ts
 * @description Custom hook for managing Sales Quotation Approval (AQ) list data
 * Extracts complex merging logic from the list page.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AQService } from '../services/aq.service';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import type { AQListItem, SQForApproval } from '../types/quotation-approve.types';
import type { QuotationHeader } from '@/modules/sales/quotation/types/quotation.types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';

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

  // 1. PENDING Actionable SQs
  const { data: actionablePendingRaw, isLoading: isLoadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['sq-approvals-actionable'],
    queryFn: () => AQService.getPendingSQs(),
    staleTime: 3 * 60 * 1000,
  });

  // 2. ALL PENDING SQs (Source of Truth Fallback)
  const { data: allPendingRaw, isLoading: isLoadingAllPending, refetch: refetchAllPending } = useQuery({
    queryKey: ['sq-approvals-all-pending'],
    queryFn: () => AQService.getAllPendingSQsFallback(),
    staleTime: 3 * 60 * 1000,
  });

  // 3. AQ History
  const { data: aqHistoryRaw, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['sq-approvals-history'],
    queryFn: () => AQService.getApprovalList({ 
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

  const mergedData = useMemo((): AQListItem[] => {
    // 1. Extract History
    const aqHistory: Array<Record<string, unknown>> = (() => {
      if (!aqHistoryRaw) return [];
      const r = aqHistoryRaw as Record<string, unknown>;
      if (Array.isArray(r.data)) return r.data as Array<Record<string, unknown>>;
      if (Array.isArray(aqHistoryRaw)) return aqHistoryRaw as Array<Record<string, unknown>>;
      return [];
    })();

    // 2. Build Maps
    const historyBySqId = new Map<number, Record<string, unknown>>();
    aqHistory.forEach((aq) => {
      const sqId = Number(aq.sq_id);
      if (!isNaN(sqId)) {
        const existing = historyBySqId.get(sqId);
        if (!existing || Number(aq.aq_id) > Number(existing.aq_id)) {
          historyBySqId.set(sqId, aq);
        }
      }
    });

    const actionableItems = extractArrayFromResponse<SQForApproval>(actionablePendingRaw as object);
    const fallbackItems = extractArrayFromResponse<QuotationHeader>(allPendingRaw as object);
    
    const getAnyId = (i: unknown): number => {
      const obj = i as Record<string, unknown>;
      return Number(obj.sq_id || obj.id || obj.sale_quotation_id || obj.quotation_id || 0);
    };

    const pendingIdSet = new Set<number>();
    [...actionableItems, ...fallbackItems].forEach(i => {
      const id = getAnyId(i);
      if (id) pendingIdSet.add(id);
    });

    // 3. Define Handled SQs
    const handledSqIds = new Set<number>(
      [...historyBySqId.entries()]
        .filter(([sqId, aq]) => {
          const s = String(aq.status || '').toUpperCase();
          const isHandled = s === 'APPROVED' || s === 'REJECTED';
          return isHandled && !pendingIdSet.has(sqId);
        })
        .map(([sqId]) => sqId)
    );

    interface RawSalesData extends Record<string, unknown> {
      total_amount?: number;
      quote_total_amount?: number;
      base_total_amount?: number;
      sq_id?: number;
      id?: number;
    }

    const fallbackMap = new Map<number, RawSalesData>();
    fallbackItems.forEach(i => {
      const id = getAnyId(i);
      if (id) fallbackMap.set(id, i as unknown as RawSalesData);
    });

    const uniquePendingItemsMap = new Map<number, RawSalesData>();
    [...fallbackItems, ...actionableItems].forEach(rawItem => {
      const item = rawItem as RawSalesData;
      const id = getAnyId(item);
      if (id && !handledSqIds.has(id)) {
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

    const pendingRows: AQListItem[] = Array.from(uniquePendingItemsMap.values()).map((raw) => {
      const r = raw as Record<string, unknown>;
      const sqId = Number(r.sq_id || r.id || 0);
      const cid = String(r.customer_id || '');
      const customerNameFallback = customerMap.get(cid) || String(r.customer_name || r.customer_name_th || '');

      return {
        row_key: `pending-${sqId}`,
        sq_id: sqId,
        sq_no: String(r.sq_no || ''),
        sq_date: String(r.sq_date || r.date || '').split('T')[0],
        customer_name: customerNameFallback,
        customer_code: String(r.customer_code || ''),
        status: 'PENDING',
        quote_total_amount: Number(r.quote_total_amount || r.total_amount || 0),
        base_total_amount: Number(r.quote_total_amount || r.total_amount || 0) * Number(r.exchange_rate || (r.rawData as Record<string, unknown>)?.exchange_rate || (r.raw as Record<string, unknown>)?.exchange_rate || 1),
        currency: String(r.currency || r.quote_currency_code || r.currency_code || 'THB'),
        raw: r,
      } satisfies AQListItem;
    });

    // 5. Map History rows
    const historyRows: AQListItem[] = aqHistory.map((aq, index) => {
        const obj = aq as Record<string, unknown>;
        const sqObj = (obj.sq || obj.sale_quotation || obj.quotation || obj.sale_quotation_header) as Record<string, unknown> | undefined;
        const sqId = getAnyId(obj);
        const sqNo = String(obj.sq_no || obj.sale_quotation_no || sqObj?.sq_no || sqObj?.code || sqObj?.no || '');
        const sqDate = String(obj.sq_date || obj.sale_quotation_date || sqObj?.sq_date || sqObj?.date || obj.aq_date || '').split('T')[0];
        const cid = String(obj.customer_id || sqObj?.customer_id || sqObj?.id_customer || '');
        const customerName = customerMap.get(cid) || String(obj.customer_name || obj.customer_name_th || sqObj?.customer_name || sqObj?.customer_name_th || '');
        const customerCode = String(obj.customer_code || sqObj?.customer_code || sqObj?.code || '');
        const rawQuoteAmount = Number(obj.quote_total_amount || obj.base_total_amount || 0);
        const sqTotalAmount = Number(sqObj?.quote_total_amount || sqObj?.base_total_amount || sqObj?.total_amount || 0);
        
        // 🛡️ Financial Consistency: Favor original SQ total if available, as it's the primary source of truth.
        const displayQuoteAmount = (sqTotalAmount > 0) ? sqTotalAmount : rawQuoteAmount;

        return {
          row_key: `history-${obj.aq_id || obj.id || index}`,
          aq_id: Number(obj.aq_id || obj.id),
          aq_no: String(obj.aq_no || ''),
          aq_date: String(obj.aq_date || '').split('T')[0],
          sq_id: sqId,
          sq_no: sqNo,
          sq_date: sqDate,
          customer_name: customerName,
          customer_code: customerCode,
          status: String(obj.status || 'PENDING'),
          approval_emp_name: String(obj.approval_emp_name || ''),
          quote_total_amount: displayQuoteAmount,
          base_total_amount: displayQuoteAmount * Number(obj.exchange_rate || 1),
          currency: String(obj.currency || obj.quote_currency_code || obj.currency_code || 'THB'),
          raw: obj,
        } satisfies AQListItem;
    });

    return [...pendingRows, ...historyRows];
  }, [actionablePendingRaw, allPendingRaw, aqHistoryRaw, customerMap]);

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

  const isLoading = isLoadingPending || isLoadingHistory || isLoadingAllPending;

  return {
    filteredData,
    mergedData,
    isLoading,
    refetch,
    customerMap
  };
};
