import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, FileText, CheckCircle, Clock } from 'lucide-react';
import { AVService } from '../../../services/av.service';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PRStatusBadge } from '@ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prId: number;
  onSelect: (av: any) => void;
}

export const ExistingAVSearchModal: React.FC<Props> = ({ isOpen, onClose, prId, onSelect }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['existing-avs', prId],
    queryFn: () => AVService.getApprovalList({ prId: prId }),
    enabled: isOpen && !!prId,
  });

  if (!isOpen) return null;

  const records = data?.data || [];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Search size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">ค้นหาเลขที่อนุมัติ AV</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">เลือกรายการที่ต้องการดูรายละเอียด</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">กำลังดึงข้อมูล...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full">
                <FileText size={48} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="font-medium">ไม่พบรายการอนุมัติเดิม (AV)</p>
                <p className="text-xs mt-1 text-gray-400">PR เลขนี้ยังไม่มีการบันทึกรายการอนุมัติ</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((av: any) => (
                <button
                  key={av.approval_id}
                  onClick={() => {
                    onSelect(av);
                    onClose();
                  }}
                  className="w-full group text-left p-4 bg-white dark:bg-gray-800/40 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 rounded-xl transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 rounded-lg transition-colors">
                      <FileText size={20} className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {av.approval_no || av.av_no}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic font-medium">
                        <Clock size={12} className="opacity-70" />
                        {formatThaiDate(av.approval_date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {Number(av.base_total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บ.
                      </span>
                      <PRStatusBadge status={av.status} />
                    </div>
                    <div className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:border-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <CheckCircle size={16} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-bold transition-all shadow-sm"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
