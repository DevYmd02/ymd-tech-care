import React, { useState } from 'react';
import { FormProvider, Controller } from 'react-hook-form';

import { FileText, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import { AVHeader } from './AVHeader';
import { AVFormLines } from './AVFormLines';
import { AVFormSummary } from './AVFormSummary';
import { WindowFormLayout } from '@/shared/components/ui/layout/WindowFormLayout';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import { useAVForm } from '../hooks/useAVForm';
import { RejectReasonModal } from '@/modules/procurement/shared/components/RejectReasonModal';

const SHIPPING_OPTIONS = [
  { label: 'รถยนต์', value: 'Car' },
  { label: 'รถบรรทุก', value: 'Truck' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  id?: number;
  onSuccess?: () => void;
}

export const AVFormModal: React.FC<Props> = ({ isOpen, onClose, id, onSuccess }) => {
  const {
    isSubmitting,
    costCenters, projects, purchaseTaxOptions, currencies,
    updateLine,
    handleApprove,
    formMethods,
    // Reject Logic
    handleRejectInit, submitReject, closeRejectModal, isRejectReasonOpen, isRejecting,
    lines
  } = useAVForm({ id, isOpen, onClose, onSuccess });

  const { register, control, watch, formState: { errors } } = formMethods;

  // Tabs state
  const [activeTab, setActiveTab] = useState('detail');

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';

  const readOnly = true;

  // Date Formatting Helpers
  const formatDisplayDate = (val?: string) => {
    if (!val) return '';
    if (val.includes('-') && val.length >= 10) {
      const [y, m, d] = val.split('-');
      return `${d.substring(0, 2)}/${m}/${y}`;
    }
    return val;
  };

  return (
    <>
    <WindowFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title={"รายละเอียดและพิจารณาใบขอซื้อ (Purchase Requisition Approval)"}
      titleIcon={<div className="bg-red-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} className="text-white" /></div>}
      headerColor="bg-blue-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
      footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
             <div className="flex items-center gap-2">
                 {/* Left actions placeholder */}
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} disabled={isSubmitting || isRejecting} className="px-4 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-sm font-medium">ปิด</button>

                {id && (
                  <>
                    <button 
                        type="button" 
                        onClick={handleRejectInit} 
                        disabled={isSubmitting || isRejecting} 
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md text-sm font-medium flex items-center gap-2 border border-red-200 dark:border-red-800/50"
                    >
                        <XCircle size={16} /> ไม่อนุมัติ
                    </button>
                    <button 
                        type="button" 
                        onClick={handleApprove} 
                        disabled={isSubmitting || isRejecting} 
                        className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium flex items-center gap-2"
                    >
                        {(isSubmitting) && <Loader2 className="animate-spin" size={16} />}
                        <CheckCircle size={16} /> อนุมัติ
                    </button>
                  </>
                )}
            </div>
          </div>
      }
    >
      <FormProvider {...formMethods}>
          <input type="hidden" {...register('version')} />

          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-1.5 space-y-1">
            <div className={cardClass}>
                <AVHeader 
                    prId={id}
                    costCenters={costCenters || []}
                    projects={projects || []}
                    onVendorSelect={() => {}}
                    isEditMode={false}
                    readOnly={readOnly}
                />
            </div>

            <div className={`${cardClass} p-3`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {/* Item 0: เลขที่อนุมัติ PR */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">เลขที่อนุมัติ PR <span className="text-red-500">*</span></label>
                        <input 
                            {...register('av_no')}
                            type="text" 
                            placeholder="เลขที่อนุมัติ PR"
                            readOnly={true}
                            className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 italic cursor-not-allowed"
                        />
                    </div>

                    {/* Item 1: วันที่กำหนดส่ง */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่กำหนดส่ง</label>
                        <Controller
                            name="delivery_date"
                            control={control}
                            render={({ field: { value } }) => (
                              <div className="relative w-full">
                                <input
                                  type="text"
                                  readOnly
                                  placeholder="dd/mm/yyyy"
                                  value={formatDisplayDate(value)}
                                  className="w-full h-9 pl-3 pr-8 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed"
                                />
                                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                              </div>
                            )}
                          />
                    </div>

                    {/* Item 2: เครดิต (วัน) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">เครดิต (วัน)</label>
                        <input 
                            type="text"
                            value={watch('credit_days') ?? 0}
                            readOnly
                            className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 italic cursor-not-allowed"
                        />
                    </div>

                    {/* Item 3: Vendor Quote No */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vendor Quote No.</label>
                        <input 
                            {...register('vendor_quote_no')} 
                            readOnly
                            placeholder="Quote No" 
                            className="w-full h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-500 bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed"
                        />
                    </div>

                    {/* Item 4: ขนส่งโดย */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ขนส่งโดย</label>
                        <select 
                            {...register('shipping_method')}
                            disabled={readOnly}
                            className={`w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800 border rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.shipping_method ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        >
                            <option value="">เลือก</option>
                            {SHIPPING_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Item 5: ประเภทภาษี */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ประเภทภาษี</label>
                        <Controller
                            name="pr_tax_code_id"
                            control={control}
                            render={({ field }) => (
                              <select
                                {...field}
                                value={field.value ? String(field.value) : ''}
                                disabled={readOnly}
                                className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50"
                              >
                                <option value="">เลือกภาษี</option>
                                {purchaseTaxOptions?.map((tax: any) => (
                                  <option key={tax.value} value={tax.value}>
                                    {tax.label}
                                  </option>
                                ))}
                              </select>
                            )}
                        />
                    </div>

                    {/* Item 6: ผู้จัดทำ */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ผู้จัดทำ</label>
                        <input 
                            type="text"
                            value={watch('preparer_name') || watch('requester_name') || 'N/A'}
                            readOnly
                            className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 italic cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Currency & Exchange Rate Section */}
            <div className={`${cardClass} p-3`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                        <Controller
                            name="pr_exchange_rate_date"
                            control={control}
                            render={({ field: { value } }) => (
                              <div className="relative w-full">
                                <input
                                  type="text"
                                  readOnly
                                  placeholder="dd/mm/yyyy"
                                  value={formatDisplayDate(value)}
                                  className="w-full h-9 pl-3 pr-8 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed"
                                />
                                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                              </div>
                            )}
                          />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                        <Controller
                            name="pr_base_currency_code"
                            control={control}
                            render={({ field }) => (
                                <select 
                                    {...field}
                                    value={field.value || 'THB'}
                                    disabled={readOnly}
                                    className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed"
                                >
                                    <option value="">เลือกสกุลเงิน</option>
                                    {currencies?.map((c: any) => (
                                      <option key={c.currency_id} value={c.currency_code}>{c.currency_code} - {c.name_th}</option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                        <Controller
                            name="pr_quote_currency_code"
                            control={control}
                            render={({ field }) => (
                                <select 
                                    {...field}
                                    value={field.value || 'THB'}
                                    disabled={readOnly}
                                    className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed"
                                >
                                    <option value="">เลือกสกุลเงิน</option>
                                    {currencies?.map((c: any) => (
                                      <option key={c.currency_id} value={c.currency_code}>{c.currency_code} - {c.name_th}</option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                        <Controller
                            name="pr_exchange_rate"
                            control={control}
                            render={({ field: { value } }) => (
                                <input 
                                    type="number"
                                    step="0.0001"
                                    value={value ?? 1}
                                    readOnly={true}
                                    className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-500 bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                />
                            )}
                        />
                        {watch('pr_base_currency_code') && watch('pr_base_currency_code') !== 'THB' && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                            1 {watch('pr_base_currency_code')} ≈ {Number(watch('pr_exchange_rate') || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                        </div>
                        )}
                    </div>
                </div>
            </div>

            <AVFormLines 
                lines={lines as any}
                updateLine={updateLine}
                readOnly={false}
            />

            <AVFormSummary />

            <SharedRemarksTab
                activeTab={activeTab}
                onTabChange={setActiveTab}
                register={register('remark')}
                readOnly={readOnly}
                className="rounded-sm"
            />
        </div>
      </FormProvider>

    </WindowFormLayout>
    <RejectReasonModal
        isOpen={isRejectReasonOpen}
        onClose={closeRejectModal}
        onConfirm={(r) => submitReject(r)}
        isSubmitting={isRejecting}
    />
    </>
  );
};
