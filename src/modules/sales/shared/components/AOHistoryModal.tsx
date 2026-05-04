import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Calendar } from 'lucide-react';
import { AOService } from '@sales/sales-order-approval/services/ao.service';
import type { AOListItem } from '@sales/sales-order-approval/types/sales-order-approval.types';
import { ModalLayout } from '@ui';
import { SOStatusBadge } from './SOStatusBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soId?: string | number;
  soNo?: string;
}

const formatDate = (val?: string) => {
  if (!val) return '-';
  const [y, m, d] = val.split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : val;
};

const formatTime = (val?: string) => {
  if (!val) return '';
  const date = new Date(val);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

export const AOHistoryModal: React.FC<Props> = ({ isOpen, onClose, soId, soNo }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['so-approval-history', soId],
    queryFn: () => {
      if (!soId) return [];
      return AOService.getApprovalList({ so_id: soId });
    },
    enabled: isOpen && !!soId,
  });

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title="ประวัติการพิจารณาอนุมัติ (Approval History)"
      size="lg"
    >
      <div className="space-y-6 p-1">
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">เลขที่ใบสั่งขาย</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{soNo || '-'}</div>
          </div>
          <Clock size={24} className="text-slate-400" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 font-medium">กำลังโหลดประวัติ...</p>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <AlertCircle size={40} className="text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">ไม่พบประวัติการอนุมัติ</p>
          </div>
        ) : (
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-800">
            {history.map((item: AOListItem, index: number) => {
              const isApproved = item.status === 'APPROVED';
              const isRejected = item.status === 'REJECTED';
              
              return (
                <div key={item.ao_id || index} className="relative flex items-start gap-6 group">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shadow-sm z-10 transition-transform group-hover:scale-110 ${
                    isApproved ? 'bg-emerald-500 text-white' : 
                    isRejected ? 'bg-red-500 text-white' : 
                    'bg-slate-400 text-white'
                  }`}>
                    {isApproved ? <CheckCircle size={18} /> : isRejected ? <XCircle size={18} /> : <Clock size={18} />}
                  </div>
                  
                  <div className="flex-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <SOStatusBadge status={item.status} />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.ao_no}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                        <Calendar size={12} />
                        {formatDate(item.ao_date)} {formatTime(String(item.created_at || ''))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">ผู้อนุมัติ</div>
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {item.approval_emp_name || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {!!item.remarks && (
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">ความคิดเห็น / เหตุผล</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                          &ldquo;{String(item.remarks)}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalLayout>
  );
};
