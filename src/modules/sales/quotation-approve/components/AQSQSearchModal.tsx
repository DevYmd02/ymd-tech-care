import React, { useState, useMemo } from 'react';
import { Search, FileText, Check, X, ShieldCheck} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DialogFormLayout } from '@/shared/components/ui/layout/DialogFormLayout';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { AQService } from '../services/aq.service';
import type { SQForApproval } from '../types/quotation-approve.types';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import { extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

export interface AQSQSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sqId: number, itemArg?: SQForApproval) => void;
}

export const AQSQSearchModal: React.FC<AQSQSearchModalProps> = React.memo(({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  // Fetch pending SQs
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['sq-approvals-lookup-pending', isOpen],
    queryFn: () => AQService.getPendingSQs(),
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  const allPending = useMemo(() => (rawData || []) as unknown as SQForApproval[], [rawData]);

  // Fetch customers for name mapping
  const { data: customerRes } = useQuery({
    queryKey: ['customer-lookup-modal', isOpen],
    queryFn: () => CustomerService.getList(),
    enabled: isOpen,
    staleTime: 1000 * 60 * 30,
  });

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    const items = extractArrayFromResponse<CustomerMaster>(customerRes as object);
    items.forEach((c) => {
      const id = String(c.id || c.customer_id);
      const name = String(c.customer_name_th || c.customer_name || '');
      if (id && name) map.set(id, name);
    });
    return map;
  }, [customerRes]);

  // Client-side filtering since we fetch all pending (usually a manageable number)
  const filteredData = useMemo(() => {
    if (!debouncedSearch) return allPending;
    const term = debouncedSearch.toLowerCase();
    return allPending.filter((item) => {
      const cname = item.customer_name || customerMap.get(String(item.customer_id)) || '';
      return (
        String(item.sq_no || '').toLowerCase().includes(term) ||
        String(cname).toLowerCase().includes(term) ||
        String(item.customer_code || '').toLowerCase().includes(term)
      );
    });
  }, [allPending, debouncedSearch, customerMap]);

  // 🔍 Aggressive ID Discovery
  const handleSelect = (item: SQForApproval) => {
    const rawId = (
      item.sq_id || 
      item.id || 
      0
    );
    const finalId = Number(rawId);
    
    if (!finalId) {
      console.warn('[AQSQSearchModal] Could not discover a valid numeric ID in item:', item);
    }
    
    onSelect(finalId, item);
    onClose();
  };

  const formatDate = (val?: string) => {
    if (!val) return '-';
    // Robust parsing for ISO strings
    const cleaned = val.split('T')[0];
    const [y, m, d] = cleaned.split('-');
    return y && m && d ? `${d}/${m}/${y}` : cleaned;
  };

  const fmt = (n?: number) =>
    n !== undefined && n !== null
      ? new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)
      : '-';

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="ค้นหาใบเสนอราคาที่รออนุมัติ - Find Pending SQ"
      titleIcon={
        <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
          <ShieldCheck size={20} className="text-white" />
        </div>
      }
      width="max-w-[1000px]"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขที่ SQ, ชื่อลูกค้า..."
              className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 overflow-auto p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-60">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
              <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">เลขที่ SQ</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">วันที่</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">ลูกค้า</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 text-right whitespace-nowrap">ยอดรวมสุทธิ</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 text-center whitespace-nowrap w-[100px]">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-transparent">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr
                      key={item.sq_id}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer"
                      onClick={() => handleSelect(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                          {item.sq_no || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(item.sq_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {item.customer_name || customerMap.get(String(item.customer_id)) || '-'}
                          </span>
                          {item.customer_code && (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                              {item.customer_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-gray-900 dark:text-emerald-400">
                          {fmt(item.quote_total_amount || item.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                        >
                          เลือก
                          <Check size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center items-center justify-center">
                      <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-bold">ไม่พบข้อมูล</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            พบใบเสนอราคา <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredData.length}</span> รายการ
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </DialogFormLayout>
  );
});
