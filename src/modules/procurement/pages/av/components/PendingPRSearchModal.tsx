import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, Loader2 } from 'lucide-react';
import { AVService } from '@procurement/services/av.service';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import type { PRHeaderExtended } from '@/modules/procurement/types/pr-types';

interface PendingPRSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prId: number) => void;
}

export const PendingPRSearchModal: React.FC<PendingPRSearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelect 
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pending-approval-prs'],
    queryFn: () => AVService.getPendingApprovalPRs(),
    enabled: isOpen, // Only fetch when open
    staleTime: 0,    // Always get fresh data on open
  });

  if (!isOpen) return null;

  // Handles raw data structure (might be wrapped in { success: true, data: [...] } or straight array)
  const prList = data || [];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10 rounded-t-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold text-lg">เลือกใบขอซื้อที่รออนุมัติ (Pending PR)</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body / Table Area */}
        <div className="p-4 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span>กำลังดึงข้อมูล...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              เกิดข้อผิดพลาดในการดึงข้อมูล
            </div>
          ) : prList.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              ไม่มีใบขอซื้อที่รออนุมัติในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">ลำดับ</th>
                    <th className="px-4 py-3">เลขที่ PR</th>
                    <th className="px-4 py-3">วันที่ขอซื้อ</th>
                    <th className="px-4 py-3">ผู้ขอซื้อ</th>
                    <th className="px-4 py-3 text-right">ยอดรวม</th>
                    <th className="px-4 py-3 text-center w-20">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {prList.map((item: PRHeaderExtended, index: number) => {
                     const total = item.total_amount ?? item.pr_base_total_amount ?? 0;
                     return (
                        <tr key={item.pr_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{item.pr_no}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatThaiDate(item.pr_date)}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.requester_name || item.created_by_name || '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                            {Number(total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => onSelect(item.pr_id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
                            >
                              เลือก
                            </button>
                          </td>
                        </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
