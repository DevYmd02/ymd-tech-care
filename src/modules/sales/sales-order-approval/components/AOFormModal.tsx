import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import {
  CheckCircle, XCircle, Loader2, Calendar, ShieldCheck, Printer, User, Clock,
} from 'lucide-react';

import { WindowFormLayout } from '@layout/WindowFormLayout';
import { ConfirmationModal } from '@system/ConfirmationModal';

import { useAOForm } from '../hooks/useAOForm';
import { AOHeader } from './AOHeader';
import { AOFormLines } from './AOFormLines';
import { AOFormSummary } from './AOFormSummary';
import { AOHistoryModal } from '../../shared/components/AOHistoryModal';
import type { AOListItem, SOForApproval } from '../types/sales-order-approval.types';
import type { AOLineFormData } from '../schemas/ao.schema';
import { SalesFormSkeleton } from '@sales/shared/components/SalesFormSkeleton';
import { SOSearchModal } from './SOSearchModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soId?: string | number;
  approvalItem?: AOListItem | SOForApproval;
  onSuccess?: () => void;
}

const formatDisplayDate = (val?: string) => {
  if (!val) return '';
  const cleaned = val.split('T')[0];
  const [y, m, d] = cleaned.split('-');
  return y && m && d ? `${d}/${m}/${y}` : cleaned;
};

export const AOFormModal: React.FC<Props> = ({
  isOpen, onClose, soId, approvalItem, onSuccess,
}) => {
  const {
    isSubmitting, isRejecting, formMethods,
    lines, updateLine,
    handleApprove, handleConfirmApprove,
    isConfirmModalOpen, setIsConfirmModalOpen,
    handleReject, handleConfirmReject,
    isConfirmRejectOpen, setIsConfirmRejectOpen,
    activeId, loadSOData, currencies,
  } = useAOForm({ soId, isOpen, onClose, onSuccess, approvalItem });

  const { register, watch, formState: { errors } } = formMethods;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSOSearchOpen, setIsSOSearchOpen] = useState(false);

  const handleSelectSO = (so: SOForApproval) => {
    if (so.so_id) {
      loadSOData(so.so_id, so);
    }
  };

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

  const currentStatus = watch('status');
  const isAlreadyProcessed =
    currentStatus === 'APPROVED' ||
    currentStatus === 'REJECTED' ||
    currentStatus === 'CANCELLED';

  const aoNo = watch('ao_no');
  const aoId = watch('ao_id');

  return (
    <>
      <WindowFormLayout
        isOpen={isOpen}
        onClose={onClose}
        title="พิจารณาอนุมัติใบสั่งขาย (Sales Order Approval)"
        titleIcon={
          <div className="bg-emerald-600 p-1 rounded-md shadow-sm">
            <ShieldCheck size={14} strokeWidth={3} className="text-white" />
          </div>
        }
        headerColor="bg-emerald-700"
        footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
            <div className="flex items-center gap-2">
              {!!activeId && (
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md text-sm font-medium flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
                >
                  <Clock size={16} /> ประวัติการอนุมัติ
                </button>
              )}
              {!!aoId && (isAlreadyProcessed) && (
                <button
                  type="button"
                  onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                    if (aoId) window.open(`${apiUrl}/so-approval/${aoId}/pdf`, '_blank');
                  }}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md text-sm font-medium flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
                >
                  <Printer size={16} /> พิมพ์ใบอนุมัติ
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isRejecting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-sm font-medium"
              >
                ปิด
              </button>

              {!!activeId && !isAlreadyProcessed && (
                <>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting || isRejecting}
                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md text-sm font-medium flex items-center gap-2 border border-red-200 dark:border-red-800/50"
                  >
                    <XCircle size={16} /> ไม่อนุมัติ
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting || isRejecting}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                    <CheckCircle size={16} /> อนุมัติ
                  </button>
                </>
              )}
            </div>
          </div>
        }
      >
        <FormProvider {...formMethods}>
          {isSubmitting && !watch('so_no') ? (
            <SalesFormSkeleton />
          ) : (
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
              <div className="max-w-[1400px] mx-auto space-y-6">

                <div className={cardClass}>
                  <div className="p-6">
                    <AOHeader
                      currencies={currencies}
                      readOnly={isAlreadyProcessed}
                      onSearchSO={!isAlreadyProcessed ? () => setIsSOSearchOpen(true) : undefined}
                    />
                  </div>
                </div>

                <div className={`${cardClass} p-6`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      เลขที่อนุมัติ (AO_NO)
                    </label>
                    <input
                      {...register('ao_no')}
                      readOnly
                      placeholder="ระบบจะออกให้อัตโนมัติ"
                      className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 italic cursor-not-allowed font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      วันที่อนุมัติ (AO_DATE)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={aoNo ? formatDisplayDate(watch('ao_date')) : formatDisplayDate(new Date().toISOString())}
                        className="w-full h-9 pl-3 pr-8 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed"
                      />
                      <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      ผู้อนุมัติ (APPROVAL_EMP)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={watch('approval_emp_name') || ''}
                        className="w-full h-9 pl-9 pr-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed font-semibold"
                      />
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      เหตุผล <span className="text-xs text-gray-400">(กรณีไม่อนุมัติ)</span>
                      {!isAlreadyProcessed && <span className="text-red-400 ml-1">*จำเป็นถ้าไม่อนุมัติ</span>}
                    </label>
                    <input
                      {...register('reject_reason')}
                      type="text"
                      placeholder="ระบุเหตุผล..."
                      readOnly={isAlreadyProcessed}
                      className={`w-full h-9 px-3 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors?.reject_reason
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } ${isAlreadyProcessed ? 'bg-gray-50 italic cursor-not-allowed' : ''}`}
                    />
                    {errors?.reject_reason && (
                      <p className="text-red-500 text-[10px] mt-1">{errors.reject_reason.message}</p>
                    )}
                  </div>
                </div>
              </div>

                <div className={cardClass}>
                  <div className="p-6">
                    <AOFormLines
                      lines={lines as unknown as AOLineFormData[]}
                      updateLine={updateLine}
                      readOnly={isAlreadyProcessed}
                    />
                  </div>
                </div>

                <div className={cardClass}>
                  <div className="p-6">
                    <AOFormSummary />
                  </div>
                </div>

              </div>
            </div>
          )}
        </FormProvider>
      </WindowFormLayout>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmApprove}
        title="ยืนยันการอนุมัติใบสั่งขาย"
        description="คุณต้องการอนุมัติรายการที่เลือกใช่หรือไม่? ข้อมูลจะถูกบันทึกและสถานะ SO จะเปลี่ยนเป็น 'อนุมัติแล้ว'"
        confirmText="อนุมัติ"
        isLoading={isSubmitting}
        variant="success"
      />

      <ConfirmationModal
        isOpen={isConfirmRejectOpen}
        onClose={() => setIsConfirmRejectOpen(false)}
        onConfirm={() => handleConfirmReject(watch('reject_reason') || '')}
        title="ยืนยันการไม่อนุมัติใบสั่งขาย"
        description="คุณต้องการปฏิเสธใบสั่งขายนี้ใช่หรือไม่? สถานะ SO จะเปลี่ยนเป็น 'ไม่อนุมัติ'"
        confirmText="ยืนยันไม่อนุมัติ"
        isLoading={isRejecting}
        variant="danger"
      />

      <AOHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        soId={activeId as string}
        soNo={watch('so_no')}
      />
      <SOSearchModal
        isOpen={isSOSearchOpen}
        onClose={() => setIsSOSearchOpen(false)}
        onSelect={handleSelectSO}
      />
    </>
  );
};
