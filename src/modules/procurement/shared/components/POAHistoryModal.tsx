import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { POAService } from '@/modules/procurement/services/poa.service';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import type { POListItem } from '@/modules/procurement/types';
import { POStatusBadge } from '@/shared/components/ui/feedback/StatusBadge';

interface POAHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId?: number;
  poNo?: string;
}

export const POAHistoryModal: React.FC<POAHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  poId,
  poNo
}) => {
  // Use POAService to fetch all POA records associated with this PO No
  const { data, isLoading, error } = useQuery({
    queryKey: ['poa', 'history', poNo || poId],
    queryFn: () => POAService.getList({ 
        q: poNo, 
        limit: 100,
        status: 'ALL' // Crucial: Fetch ALL statuses for history
    }),
    enabled: isOpen && (!!poNo || !!poId),
    staleTime: 5 * 1000 // 5 seconds
  });

  if (!isOpen) return null;

  // 🎯 Filter: Only show official POA records in history (exclude virtual "Waiting" rows)
  const historyItems = (data?.data || []).filter(item => !!item.poa_no && item.poa_no !== '-');

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header - Premium Emerald Gradient */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-xl leading-tight">ประวัติการอนุมัติเอกสาร</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{poNo ? `(${poNo})` : 'ไม่ระบุเลขที่เอกสาร'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-3" />
              <span className="font-medium">กำลังรวบรวมข้อมูลประวัติการอนุมัติ...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full mb-4">
                <AlertCircle className="w-12 h-12" />
              </div>
              <span className="font-bold text-lg">เกิดข้อผิดพลาดในการดึงข้อมูล</span>
              <p className="text-sm opacity-80 mt-1">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-full mb-5">
                <Clock className="w-16 h-16 opacity-20 stroke-[1.5]" />
              </div>
              <p className="font-bold text-lg text-gray-600 dark:text-gray-300">ไม่พบประวัติการอนุมัติ</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center max-w-sm">
                เอกสารนี้อาจจะยังอยู่ในสถานะแบบร่าง หรือรอการพิจารณาส่งอนุมัติเป็นชุดแรก
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats Card */}
              <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20 px-5 py-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">สถานภาพการอนุมัติ:</span>
                </div>
                <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                    {historyItems.length} <span className="text-sm font-bold opacity-80">รายการ (POA)</span>
                </span>
              </div>

              {/* Table View with modern shadows */}
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 table-auto">
                  <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-4 text-center w-16">ลำดับ</th>
                      <th className="px-5 py-4 text-left">เลขที่อนุมัติ POA</th>
                      <th className="px-5 py-4 text-left">วันที่อนุมัติ</th>
                      <th className="px-5 py-4 text-left">ผู้อนุมัติ</th>
                      <th className="px-5 py-4 text-right">ยอดรวม (บาท)</th>
                      <th className="px-5 py-4 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                    {historyItems.map((item: POListItem, index: number) => (
                      <POAHistoryRow key={item.poa_no || index} item={item} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Sub-component for a single row in the history table.
 * Implements Deep Hydration to ensure totals are accurate by fetching full detail.
 */
const POAHistoryRow: React.FC<{ item: POListItem; index: number }> = ({ item, index }) => {
  const itemAny = item as any;
  const poaId = Number(itemAny.approval_id || item.po_id);
  const isOfficialPOA = !!item.poa_no && item.poa_no !== '-';

  // Fetch full detail for this specific record to get the real total_amount
  const { data: detail, isLoading } = useQuery({
    queryKey: ['poa', 'detail', poaId],
    queryFn: () => POAService.getById(poaId),
    enabled: !!poaId && isOfficialPOA,
    staleTime: 60 * 1000,
  });

  // Use detail data if available, fallback to list item
  const displayTotal = detail?.total_amount ?? item.total_amount ?? 0;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-emerald-950/5 transition-all group">
      <td className="px-5 py-4 text-center text-gray-400 font-medium group-hover:text-emerald-500 transition-colors">
        {index + 1}
      </td>
      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
        {item.poa_no || item.po_no || '-'}
      </td>
      <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
        {formatThaiDate(item.po_date)}
      </td>
      <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
        {item.approval_emp_name || '-'}
      </td>
      <td className="px-5 py-4 text-right font-black text-gray-900 dark:text-white whitespace-nowrap">
        {isLoading ? (
          <div className="w-16 h-4 bg-gray-100 dark:bg-slate-800 animate-pulse rounded ml-auto" />
        ) : (
          new Intl.NumberFormat('th-TH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }).format(Number(displayTotal))
        )}
      </td>
      <td className="px-5 py-4 text-center">
        <POStatusBadge status={item.status} className="scale-90" />
      </td>
    </tr>
  );
};
