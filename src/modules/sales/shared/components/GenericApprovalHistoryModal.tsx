/**
 * @file GenericApprovalHistoryModal.tsx
 * @description Shared component for viewing the approval history of Sales Quotations (SQ) or Sales Orders (SO)
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { ModalLayout } from '@ui';
import { SmartTable } from '@ui/data-display/SmartTable';
import { AQService } from '@sales/quotation-approve/services/aq.service';
import { AOService } from '@sales/sales-order-approval/services/ao.service';
import { SalesOrderService } from '@sales/sales-order/services/sales-order.service';
import { SQStatusBadge } from './SQStatusBadge';
import { SOStatusBadge } from './SOStatusBadge';

export interface GenericApprovalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string | number;
  documentNo?: string;
  documentType: 'SQ' | 'SO';
}

interface MergedApprovalListItem {
  aq_no?: string;
  ao_no?: string;
  aq_date?: string;
  ao_date?: string;
  approval_emp_name?: string;
  base_total_amount?: number | string;
  status: string;
  remarks?: string;
  raw?: Record<string, unknown>;
  sq_id?: number | string;
  so_id?: number | string;
}

const columnHelper = createColumnHelper<MergedApprovalListItem>();

const formatDate = (val?: string) => {
  if (!val) return '-';
  const [y, m, d] = val.split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : val;
};

export const GenericApprovalHistoryModal: React.FC<GenericApprovalHistoryModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentNo,
  documentType,
}) => {
  // 1. Fetch SO Detail (SO Only - required to hydrate Map for AOService)
  const { data: soData } = useQuery({
    queryKey: ['so-detail-for-history', documentId],
    queryFn: () => {
      if (!documentId) return null;
      return SalesOrderService.getById(String(documentId));
    },
    enabled: isOpen && !!documentId && documentType === 'SO',
  });

  // 2. Fetch History Data
  const { data: historyData, isLoading } = useQuery({
    queryKey: documentType === 'SQ' 
      ? ['aq-history', documentId] 
      : ['so-approval-history', documentId, !!soData],
    queryFn: async (): Promise<MergedApprovalListItem[]> => {
      if (!documentId) return [];

      if (documentType === 'SQ') {
        const res = await AQService.getApprovalList({ sq_id: Number(documentId), limit: 100 });
        return (res || []) as unknown as MergedApprovalListItem[];
      } else {
        const soMap = new Map<string | number, Record<string, unknown>>();
        if (soData) {
          const rawSo = soData as unknown as Record<string, unknown>;
          const header = (rawSo.header || rawSo.sale_order_header || rawSo.so_header || rawSo) as Record<string, unknown>;
          soMap.set(String(documentId), header);
        }
        const res = await AOService.getApprovalList({ so_id: documentId }, undefined, soMap);
        return (res || []) as unknown as MergedApprovalListItem[];
      }
    },
    enabled: isOpen && !!documentId,
  });

  // 3. Filter display data defensively by ID
  const displayData = React.useMemo((): MergedApprovalListItem[] => {
    if (!historyData) return [];
    
    if (documentType === 'SQ') {
      return historyData.filter((item) => Number(item.sq_id) === Number(documentId));
    } else {
      return historyData.filter((item) => String(item.so_id) === String(documentId));
    }
  }, [historyData, documentId, documentType]);

  // 4. Columns Configuration
  const columns = React.useMemo(() => [
    columnHelper.display({
      id: 'index',
      header: () => <div className="text-center w-full">ลำดับ</div>,
      cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
      size: 50,
    }),
    columnHelper.accessor(documentType === 'SQ' ? 'aq_no' : 'ao_no', {
      header: documentType === 'SQ' ? 'เลขที่อนุมัติ AQ' : 'เลขที่อนุมัติ AO',
      cell: (info) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {info.getValue() || '-'}
        </span>
      ),
      size: 140,
    }),
    columnHelper.accessor(documentType === 'SQ' ? 'aq_date' : 'ao_date', {
      header: 'วันที่อนุมัติ',
      cell: (info) => formatDate(info.getValue()),
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
            {documentType === 'SQ' ? (
              <SQStatusBadge status={info.getValue()} />
            ) : (
              <SOStatusBadge status={info.getValue()} />
            )}
            {!!remarks && (
              <span 
                className="text-[10px] text-red-500 dark:text-red-400 italic max-w-[130px] whitespace-normal break-words text-center" 
                title={String(remarks)}
              >
                หมายเหตุ: {String(remarks)}
              </span>
            )}
          </div>
        );
      },
      size: 130,
    }),
  ], [documentType]);

  const docTypeName = documentType === 'SQ' ? 'ใบเสนอราคา' : 'ใบสั่งขาย';
  const docTypeLabel = documentType === 'SQ' ? 'AQ' : 'AO';

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      variant="dialog"
      title={`ประวัติการอนุมัติเอกสาร (${documentNo || 'N/A'})`}
      titleIcon={<Clock className="text-emerald-500" />}
      size="lg"
      headerColor="bg-slate-800"
      zIndex={60}
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
            <p className="font-medium">ยังไม่มีประวัติการอนุมัติสำหรับ{docTypeName}นี้</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center text-sm">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">จำนวนที่อนุมัติแล้ว:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {displayData.filter(h => h.status === 'APPROVED').length} ชุด ({docTypeLabel})
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