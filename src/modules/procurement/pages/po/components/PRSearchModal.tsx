import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { PRHeader } from '@/modules/procurement/types/pr-types';
import { DialogFormLayout } from '@ui';
import { Search, Loader2, Calendar, User, FileText } from 'lucide-react';

interface PRSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pr: PRHeader) => void;
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

  // 3. 🚩 Real API Integration (Status: APPROVED Only)
  const { data: prResults, isLoading } = useQuery({
    queryKey: ['pr-search', debouncedSearch],
    queryFn: async () => {
      const response = await PRService.getList({
        q: debouncedSearch,
        status: 'APPROVED',
        limit: 50,
      });
      return response.data || [];
    },
    enabled: isOpen,
  });

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="ค้นหาใบขอซื้อ (PR)"
      titleIcon={<span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">🔍</span>}
      width="max-w-4xl"
    >
      <div className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ค้นหาเลขที่ PR หรือรายชื่อผู้จัดทำ</label>
          <div className="relative">
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="พิมพ์เลขที่ PR เช่น PR2026..." 
              className="w-full h-11 px-11 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all shadow-sm" 
              autoFocus 
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            {isLoading && (
              <div className="absolute right-4 top-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="max-h-[450px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-inner scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3.5 text-center font-semibold w-24">เลือก</th>
                <th className="px-4 py-3.5 text-left font-semibold">เลขที่ PR</th>
                <th className="px-4 py-3.5 text-left font-semibold">วันที่</th>
                <th className="px-4 py-3.5 text-left font-semibold">ผู้ขอซื้อ</th>
                <th className="px-4 py-3.5 text-right font-semibold">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      <span className="text-gray-500 font-medium">กำลังค้นหาข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : prResults && prResults.length > 0 ? (
                prResults.map((pr) => (
                  <tr 
                    key={pr.pr_id} 
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                    onClick={() => onSelect(pr)}
                  >
                    <td className="px-4 py-4 text-center">
                      <button 
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all transform group-hover:scale-105"
                      >
                        เลือก
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="font-bold text-gray-900 dark:text-white">{pr.pr_no}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>{pr.pr_date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User size={14} />
                        <span>{pr.requester_name || pr.created_by_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {(Number(pr.pr_base_total_amount || pr.total_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2 opacity-60">
                      <Search size={40} className="mb-2" />
                      <span className="text-lg font-medium">ไม่พบข้อมูล PR ที่ได้รับการอนุมัติ</span>
                      <span className="text-sm">ลองเปลี่ยนคำค้นหา หรือตรวจสอบสถานะ PR อีกครั้ง</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DialogFormLayout>
  );
};
