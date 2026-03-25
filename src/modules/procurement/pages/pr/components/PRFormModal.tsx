import React, { useState } from 'react';
import { FormProvider, Controller } from 'react-hook-form';

import { FileText, Printer, Copy, Loader2, Calendar } from 'lucide-react';
import { PRHeader } from './PRHeader';
import { PRFormLines } from './PRFormLines';
import { PRFormSummary } from './PRFormSummary';
import { ProductSearchModal } from './ProductSearchModal';
import { WindowFormLayout } from '@ui';
import { SharedRemarksTab } from '@/shared/components/forms/SharedRemarksTab';
import { usePRForm } from '@/modules/procurement/pages/pr/hooks';
import { WarehouseSearchModal } from '@/modules/procurement/shared/components/WarehouseSearchModal';
import { LocationSearchModal } from '@/modules/procurement/shared/components/LocationSearchModal';


const SHIPPING_OPTIONS = [
  { label: 'รถยนต์', value: 'Car' },
  { label: 'รถบรรทุก', value: 'Truck' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  id?: number;
  onSuccess?: () => void;
  readOnly?: boolean;
}

export const PRFormModal: React.FC<Props> = ({ isOpen, onClose, id, onSuccess, readOnly: readOnlyProp = false }) => {
  const {
    isEditMode, lines, isProductModalOpen, setIsProductModalOpen,
    isWarehouseModalOpen, setIsWarehouseModalOpen,
    isLocationModalOpen, setIsLocationModalOpen, activeWarehouseId,
    isSubmitting, isActionLoading,
    costCenters, projects, purchaseTaxOptions, currencies, masterUnits,
    addLine, removeLine, clearLine, updateLine, handleClearLines,
    openProductSearch, openWarehouseSearch, openLocationSearch, selectProduct, selectWarehouse, selectLocation, handleVendorSelect, onSubmit,
    handleVoid,
    handleSubmit,
    handleFormError,
    formMethods,
    user
  } = usePRForm({ isOpen, onClose, id, onSuccess });

  const { register, control, watch, setValue, formState: { errors } } = formMethods;

  // V-04: Force readOnly if status is not DRAFT (prevent editing APPROVED/PENDING PRs)
  const currentStatus = watch('status');
  const readOnly = readOnlyProp || (!!id && currentStatus !== undefined && currentStatus !== 'DRAFT');

  // Action permissions — decoupled from readOnly (which is only for input fields)
  const canSaveDraft = !readOnly; // Only editable forms can save

  // Tabs state
  const [activeTab, setActiveTab] = useState('detail');

  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';



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
    <WindowFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title={readOnly ? "รายละเอียดใบขอซื้อ (Purchase Requisition Details)" : (isEditMode ? "แก้ไขใบขอซื้อ (Edit Purchase Requisition)" : "สร้างใบขอซื้อ (Create Purchase Requisition)")}
      titleIcon={<div className="bg-red-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} /></div>}
      headerColor="bg-blue-600 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
      footer={
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
             <div className="flex items-center gap-2">
                 {isEditMode && (
                    <>
                        <button type="button" disabled className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium"><Printer size={16} className="mr-2" /> พิมพ์</button>
                        <button type="button" disabled className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium"><Copy size={16} className="mr-2" /> คัดลอก</button>
                    </>
                 )}
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} disabled={isSubmitting || isActionLoading} className="px-4 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-sm font-medium">{'ปิด'}</button>

                {/* Approve/Reject actions removed to enforce Approval (AV) Module workflow */}

                {/* Save/Submit — shown only when form is editable (DRAFT) */}
                {canSaveDraft && (
                    <button 
                      type="button" 
                      onClick={handleSubmit(onSubmit, handleFormError)} 
                      disabled={isSubmitting || isActionLoading} 
                      className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {(isSubmitting || isActionLoading) && <Loader2 className="animate-spin" size={16} />}
                      {watch('is_on_hold') === 'Y' ? 'บันทึกแบบร่าง (Draft)' : 'บันทึกและส่งอนุมัติ'}
                    </button>
                )}
            </div>
          </div>
      }
    >
      <FormProvider {...formMethods}>
          
          {/* 🎯 Hidden input for optimistic concurrency version tracking */}
          <input type="hidden" {...register('version')} />

          <ProductSearchModal 
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            selectProduct={selectProduct}
          />
          <WarehouseSearchModal
            isOpen={isWarehouseModalOpen}
            onClose={() => setIsWarehouseModalOpen(false)}
            onSelect={selectWarehouse}
          />
          <LocationSearchModal
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            warehouseId={activeWarehouseId}
            onSelect={selectLocation}
          />

          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-1.5 space-y-1">
            <div className={cardClass}>
                <PRHeader 
                    prId={id}
                    costCenters={costCenters}
                    projects={projects}
                    onVendorSelect={handleVendorSelect}
                    isEditMode={isEditMode}
                    onVoid={handleVoid}
                    readOnly={readOnly}
                />
            </div>

            <div className={`${cardClass} p-3`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {/* Item 1: วันที่กำหนดส่ง */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่กำหนดส่ง</label>
                        <Controller
                            name="delivery_date" // Wait, is it delivery_date or need_by_date? It was delivery_date in line 184
                            control={control}
                            render={({ field: { value, onChange, onBlur, ref } }) => (
                              <div className="relative w-full">
                                <input
                                  type="text"
                                  readOnly
                                  placeholder="dd/mm/yyyy"
                                  value={formatDisplayDate(value)}
                                  disabled={readOnly}
                                  onClick={(e) => { try { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker() } catch (err) { void err; } }}
                                  className="w-full h-9 pl-3 pr-8 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                                />
                                <input
                                  type="date"
                                  value={value || ''}
                                  onChange={(e) => onChange(e.target.value)}
                                  onBlur={onBlur}
                                  ref={ref}
                                  disabled={readOnly}
                                  onClick={(e) => { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  style={{ colorScheme: 'dark' }}
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
                            {...register('credit_days')}
                            disabled={readOnly}
                            placeholder="ระบุจำนวนวัน"
                            className={`w-full h-9 px-3 text-sm border rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${readOnly ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}
                        />
                    </div>

                    {/* Item 3: Vendor Quote No */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Vendor Quote No.</label>
                        <input 
                            {...register('vendor_quote_no')} 
                            disabled={readOnly} 
                            placeholder="Quote No" 
                            className={`w-full h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${readOnly ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800'}`}
                        />
                    </div>

                    {/* Item 4: ขนส่งโดย */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ขนส่งโดย</label>
                        <select 
                            {...register('shipping_method')}
                            disabled={readOnly}
                            className={`w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors?.shipping_method ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const selected = purchaseTaxOptions.find(t => String(t.value) === val);
                                  
                                  // Type safety: cast to number or null
                                  field.onChange(val ? Number(val) : null);
                                  
                                  // Snapshot Tax Rate with Explicit Trigger & Reactivity
                                  const rate = selected?.original ? Number(selected.original.tax_rate) : 0;
                                  setValue('pr_tax_rate', rate, { shouldValidate: true, shouldDirty: true });
                                }}
                                className={`w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer ${readOnly ? 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' : ''}`}
                              >
                                <option value="">เลือกภาษี</option>
                                {purchaseTaxOptions.map(tax => (
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
                            value={user?.employee?.employee_fullname || user?.username || 'N/A'}
                            readOnly
                            className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 italic"
                        />
                    </div>
                </div>
            </div>

            {/* Currency & Exchange Rate Section (Always visible) */}
            <div className={`${cardClass} p-3`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                        <Controller
                            name="pr_exchange_rate_date"
                            control={control}
                            render={({ field: { value, onChange, onBlur, ref } }) => (
                              <div className="relative w-full">
                                {/* 1. Visible Text Input */}
                                <input
                                  type="text"
                                  readOnly
                                  placeholder="dd/mm/yyyy"
                                  value={formatDisplayDate(value)}
                                  disabled={readOnly}
                                  onClick={(e) => { try { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker() } catch (err) { void err; } }}
                                  className="w-full h-9 pl-3 pr-8 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                                />
                                
                                {/* 2. Hidden Native Input overlay for click/picker */}
                                <input
                                  type="date"
                                  value={value || ''}
                                  onChange={(e) => onChange(e.target.value)}
                                  onBlur={onBlur}
                                  ref={ref}
                                  disabled={readOnly}
                                  onClick={(e) => { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  style={{ colorScheme: 'dark' }}
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
                                    className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">เลือกสกุลเงิน</option>
                                    {currencies.map((c) => (
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
                                    className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">เลือกสกุลเงิน</option>
                                    {currencies.map((c) => (
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
                            render={({ field: { value, onChange, onBlur, ref } }) => (
                                <input 
                                    ref={ref}
                                    type="number"
                                    step="0.0001"
                                    value={value ?? 1}
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    readOnly={readOnly || watch('pr_base_currency_code') === 'THB'}
                                    className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${watch('pr_base_currency_code') === 'THB' || readOnly ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500' : 'bg-white dark:bg-gray-800 font-semibold'}`}
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

            <PRFormLines 
                lines={lines}
                updateLine={updateLine}
                removeLine={removeLine}
                clearLine={clearLine}
                addLine={addLine}
                handleClearLines={handleClearLines}
                openProductSearch={openProductSearch}
                openWarehouseSearch={openWarehouseSearch}
                openLocationSearch={openLocationSearch}
                readOnly={readOnly}
                masterUnits={masterUnits}
            />

            <PRFormSummary isViewMode={readOnly} />

            <SharedRemarksTab
                activeTab={activeTab}
                onTabChange={setActiveTab}
                register={register('remark')}
                readOnly={readOnly}
                className="rounded-sm" // Match PR style
            />
        </div>
      </FormProvider>

    </WindowFormLayout>
  );
};
