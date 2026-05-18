/**
 * @file AQHistoryModal.tsx
 * @description Modal for viewing the approval history of a Sales Quotation
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { ModalLayout } from '@layout/ModalLayout';
import { SmartTable } from '@ui/data-display/SmartTable';
import { AQService } from '@sales/quotation-approve/services/aq.service';
import { SQStatusBadge } from '@sales/shared/components/SQStatusBadge';
import type { AQListItem } from '@sales/quotation-approve/types/quotation-approve.types';

interface AQHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqId?: number;
  sqNo?: string;
}

const columnHelper = createColumnHelper<AQListItem>();

export const AQHistoryModal: React.FC<AQHistoryModalProps> = ({
  isOpen,
  onClose,
  sqId,
  sqNo,
}) => {
  // 1. Fetch History Data
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['aq-history', sqId],
    queryFn: () => AQService.getApprovalList({ sq_id: sqId, limit: 100 }),
    enabled: isOpen && !!sqId,
  });

  const displayData = React.useMemo((): AQListItem[] => {
    if (!historyData) return [];
    
    // Defensive client-side filtering by sqId to ensure each record shows its own history
    if (sqId) {
      return historyData.filter((item) => Number(item.sq_id) === Number(sqId));
    }
    return historyData;
  }, [historyData, sqId]);

  // 2. Table Columns
  const columns = React.useMemo(() => [
    columnHelper.display({
      id: 'index',
      header: () => <div className="text-center w-full">ลำดับ</div>,
      cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
      size: 50,
    }),
    columnHelper.accessor('aq_no', {
      header: 'เลขที่อนุมัติ AQ',
      cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() || '-'}</span>,
      size: 140,
    }),
    columnHelper.accessor('aq_date', {
      header: 'วันที่อนุมัติ',
      cell: (info) => {
        const val = info.getValue();
        if (!val) return '-';
        const [y, m, d] = val.split('T')[0].split('-');
        return y && m && d ? `${d}/${m}/${y}` : val;
      },
      size: 100,
    }),
    columnHelper.accessor('approval_emp_name', {
      header: 'ผู้อนุมัติ',
      cell: (info) => <span className="font-semibold">{info.getValue() || '-'}</span>,
      size: 140,
    }),
    columnHelper.accessor('base_total_amount', {
      header: () => <div className="text-right w-full">ยอดรวม (บาท)</div>,
      cell: (info) => {
        const amount = Number(info.getValue()) || 0;

        return (
          <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">
            {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(amount)}
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('status', {
      header: () => <div className="text-center w-full">สถานะ</div>,
      cell: (info) => {
        const raw = info.row.original.raw as Record<string, unknown> | undefined;
        const remarks = info.row.original.remarks || raw?.remarks || raw?.status_remark || '';
        return (
          <div className="flex flex-col items-center gap-1">
            <SQStatusBadge status={info.getValue()} />
            {!!remarks && (
              <span className="text-[10px] text-red-500 dark:text-red-400 italic max-w-[130px] whitespace-normal break-words text-center" title={String(remarks)}>
                หมายเหตุ: {String(remarks)}
              </span>
            )}
          </div>
        );
      },
      size: 130,
    }),
  ], []);

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={`ประวัติการอนุมัติเอกสาร (${sqNo || 'N/A'})`}
      titleIcon={<Clock className="text-emerald-500" />}
      size="lg"
      headerColor="bg-slate-800"
      zIndex={60} // Ensure it's above the form modal
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold transition-all"
          >
            ปิด
          </button>
        </div>
      }
    >
      <div className="p-1">
        {displayData.length === 0 && !isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <Clock size={48} strokeWidth={1} />
            <p className="font-medium">ยังไม่มีประวัติการอนุมัติสำหรับใบเสนอราคานี้</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center text-sm">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">จำนวนที่อนุมัติแล้ว:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {displayData.filter(h => h.status === 'APPROVED').length} ชุด (AQ)
              </span>
            </div>
            <SmartTable
              data={displayData}
              columns={columns}
              isLoading={isLoading}
              showPagination={false}
              pagination={{
                pageIndex: 1,
                pageSize: 10,
                totalCount: displayData.length,
                onPageChange: () => {},
                onPageSizeChange: () => {},
              }}
            />
          </div>
        )}
      </div>
    </ModalLayout>
  );
};
