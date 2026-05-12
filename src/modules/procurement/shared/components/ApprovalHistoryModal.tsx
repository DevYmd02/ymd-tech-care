import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { AVService } from '@/modules/procurement/services/av.service';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import type { ApprovalHeader } from '@/modules/procurement/types/av-types';

interface ApprovalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prId: number;
  prNo?: string;
}

export const ApprovalHistoryModal: React.FC<ApprovalHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  prId,
  prNo
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['prs', 'approvals', prNo || prId],
    queryFn: async () => {
      const res = await AVService.getApprovalList({ limit: 1000 });
      const allRecords = (Array.isArray(res) ? res : res?.data) || [];
      return allRecords.filter((rec: ApprovalHeader) => 
        Number(rec.pr_id) === Number(prId) || 
        (prNo && rec.pr?.pr_no === prNo) ||
        (prNo && rec.pr_no === prNo)
      );
    },
    enabled: isOpen && (!!prNo || !!prId),
    staleTime: 5 * 1000 // 5 seconds
  });

  if (!isOpen) return null;

  const approvals = data || [];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10 rounded-t-lg">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-lg">ประวัติการอนุมัติเอกสาร {prNo ? `(${prNo})` : ''}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-2" />
              <span>กำลังดึงข้อมูลประวัติการอนุมัติ...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-500">
              <AlertCircle className="w-10 h-10 mb-2" />
              <span>เกิดข้อผิดพลาดในการดึงข้อมูล</span>
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mb-3 stroke-[1.5]" />
              <p className="font-medium">ยังไม่มีประวัติการอนุมัติสำหรับ PR ใบนี้</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">รายการนี้อาจยังไม่ได้ผ่านกระบวนการ หรือรอการตัดสินใจ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">จำนวนที่อนุมัติแล้ว:</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{approvals.length} ชุด (AV)</span>
              </div>

              {/* Table View */}
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">ลำดับ</th>
                      <th className="px-4 py-3 text-left">เลขที่อนุมัติ PR</th>
                      <th className="px-4 py-3 text-left">วันที่อนุมัติ</th>
                      <th className="px-4 py-3 text-left">ผู้อนุมัติ</th>
                      <th className="px-4 py-3 text-right">ยอดรวม (บาท)</th>
                      <th className="px-4 py-3 text-left">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                    {approvals.map((av: ApprovalHeader, index: number) => (
                      <tr key={av.approval_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {av.approval_no || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatThaiDate(av.approval_date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {av.approval_emp_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(av.base_total_amount || 0))}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                            ${av.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : ''}
                            ${av.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' : ''}
                            ${av.status !== 'APPROVED' && av.status !== 'REJECTED' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : ''}
                          `}>
                            {av.status === 'APPROVED' ? 'อนุมัติแล้ว' : 
                             av.status === 'REJECTED' ? 'ไม่อนุมัติ' : 
                             av.status === 'PARTIAL' ? 'อนุมัติบางส่วน' : 
                             av.status === 'PENDING' ? 'รออนุมัติ' : 
                             av.status || '-'}
                          </span>
                          {av.remarks && (
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={av.remarks}>
                              หมายเหตุ: {av.remarks}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700 gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
