import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { IReadyForPOPR } from '@/modules/procurement/schemas/qc-schemas';
import { DialogFormLayout } from '@ui';
import { Search, Loader2 } from 'lucide-react';
import { logger } from '@/shared/utils';


interface PRSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (record: IReadyForPOPR) => void;
}


export const PRSearchModal: React.FC<PRSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  // ── Local State ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 🚩 Reset State on Close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // 2. 🚩 Debounced Search
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 3. 🚩 Advanced Triple-Scan Discovery (Same as Source Selector)
  const { data: prResults, isLoading } = useQuery({
    queryKey: ['pr-waiting-for-qc-advanced'],
    queryFn: async () => {
      const { QCService } = await import('@/modules/procurement/services/qc.service');
      const items = await QCService.getAdvancedReadyPRs();
      logger.info(`🔍 [PRSearchModal] Triple-Scan discovered ${items.length} ready PRs.`);
      return items;
    },
    enabled: isOpen,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const allItems = prResults || [];

  // 4. 🚩 Client-Side Filtering
  const filteredItems = allItems.filter(item => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    
    return (
        item.pr_no?.toLowerCase().includes(query) ||
        item.approval_no?.toLowerCase().includes(query) ||
        item.requester_name?.toLowerCase().includes(query) ||
        item.qcHeaders?.some(qc => qc.qc_no?.toLowerCase().includes(query)) ||
        item.preferred_vendor?.vendor_name?.toLowerCase().includes(query)
    );
  });

  const items = filteredItems;

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="ค้นหาใบขอซื้อ (PR)"
      width="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        {/* 1. 🔍 Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="พิมพ์เลขที่ PR หรือเลขที่อนุมัติ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 2. 📊 Results Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs uppercase font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-center w-20">เลือก</th>
                  <th className="px-4 py-3 text-left">เลขที่ PR</th>
                  <th className="px-4 py-3 text-left">เลขที่ใบอนุมัติ (AV)</th>
                  <th className="px-4 py-3 text-left">ผู้ขาย</th>
                  <th className="px-4 py-3 text-left">เลขที่ QC</th>
                  <th className="px-4 py-3 text-right">ยอดรวม</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span>กำลังโหลด...</span>
                      </div>
                    </td>
                  </tr>
                ) : items && items.length > 0 ? (
                  items.map((record) => (
                    <tr 
                      key={`${record.pr_id}-${record.qcHeaders?.[0]?.qc_id || 0}`} 
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() => onSelect(record)}
                    >
                      <td className="px-4 py-3 text-center">
                        <button 
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
                        >
                          เลือก
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{record.pr_no}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-600 dark:text-emerald-400">{record.approval_no || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {record.preferred_vendor?.vendor_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 dark:text-gray-300">{record.qcHeaders?.[0]?.qc_no || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {Number(record.pr_base_total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-gray-500 dark:text-gray-400">
                      ไม่พบข้อมูล PR ที่แนะนำ (ต้องผ่าน QC และ AV แล้ว)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DialogFormLayout>

  );
};
