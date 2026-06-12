/**
 * @file TransferFormHeader.tsx
 * @description ส่วน Header ของฟอร์มใบขอโอนย้ายสินค้า (Transfer Requisition)
 */

import React, { useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { ClipboardList, Search } from 'lucide-react';
import type { TransferHeaderFormData } from '../schemas/transfer.schemas';
import { CustomDateInput } from '@ui';
import { EmployeeSearchModal } from '@/modules/master-data/employee/components/EmployeeSearchModal';

interface TransferFormHeaderProps {
    branchOptions?: { id: string; name: string }[];
    empOptions?: { id: string; name: string }[];
    readOnly?: boolean;
}

export const TransferFormHeader: React.FC<TransferFormHeaderProps> = ({
    branchOptions = [],
    empOptions = [],
    readOnly = false,
}) => {
    const { register, control, formState: { errors }, setValue } = useFormContext<TransferHeaderFormData>();
    const watchedSaveEmpId = useWatch({ control, name: 'save_emp_id' });
    const watchedTransferEmpId = useWatch({ control, name: 'transfer_emp_id' });

    const [isEmpSearchOpen, setIsEmpSearchOpen] = useState(false);

    const isLocked = readOnly;
    const selectedEmpName = empOptions.find(e => e.id === watchedTransferEmpId)?.name || '';

    const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const selectClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-blue-50/10 dark:bg-blue-900/5 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20";
    
    const getErrorClass = (fieldName: keyof TransferHeaderFormData) => 
        errors[fieldName] ? "border-red-500 focus:ring-red-500 ring-2 ring-red-500/50" : "";

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <ClipboardList size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลใบขอโอนย้ายสินค้า — Header Transfer Requisition</h3>
                </div>
                <div className="flex items-center gap-6">
                    {/* Status Checkbox */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
                        <Controller
                            name="cancelflag"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="checkbox"
                                    id="cancelflag_checkbox"
                                    disabled={isLocked}
                                    checked={field.value === 'Y'}
                                    onChange={(e) => field.onChange(e.target.checked ? 'Y' : 'N')}
                                    className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 cursor-pointer disabled:opacity-50"
                                />
                            )}
                        />
                        <label htmlFor="cancelflag_checkbox" className="text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer uppercase tracking-tight">
                            ยกเลิกเอกสาร (VOID)
                        </label>
                    </div>
                </div>
            </div>

            <div className={cardSection}>
                {/* 1. เลขที่เอกสารขอโอนย้าย */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่เอกสาร <span className="text-red-500">*</span></label>
                    <Controller
                        name="transfer__req_no"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                disabled={isLocked || field.value === 'ระบบจะกรอกอัตโนมัติ'}
                                placeholder="เลขที่เอกสารขอโอนย้าย"
                                className={`${inputClass} ${getErrorClass('transfer__req_no')} ${field.value === 'ระบบจะกรอกอัตโนมัติ' ? 'italic text-gray-400 bg-gray-50' : 'font-bold text-blue-600'}`}
                            />
                        )}
                    />
                    {errors.transfer__req_no && <span className="text-[10px] text-red-500 font-medium">{errors.transfer__req_no.message}</span>}
                </div>

                {/* 2. วันที่เอกสาร */}
                <div className="space-y-1">
                    <label className={labelClass}>วันที่เอกสาร <span className="text-red-500">*</span></label>
                    <Controller
                        name="docu_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={`${inputClass} ${getErrorClass('docu_date')}`}
                            />
                        )}
                    />
                    {errors.docu_date && <span className="text-[10px] text-red-500 font-medium">{errors.docu_date.message}</span>}
                </div>

                {/* 3. สาขา */}
                <div className="space-y-1">
                    <label className={labelClass}>สาขา <span className="text-red-500">*</span></label>
                    <Controller
                        name="branch_id"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                disabled={isLocked}
                                className={`${selectClass} ${getErrorClass('branch_id')}`}
                            >
                                <option value="">-- เลือกสาขา --</option>
                                {branchOptions.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.branch_id && <span className="text-[10px] text-red-500 font-medium">{errors.branch_id.message}</span>}
                </div>

                {/* 4. ผู้บันทึก (Locked to Login User) */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้บันทึก <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={empOptions.find(e => e.id === watchedSaveEmpId)?.name || (watchedSaveEmpId ? 'กำลังโหลด...' : '-- ไม่ระบุ --')}
                            className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                        />
                        <input type="hidden" {...register('save_emp_id')} />
                    </div>
                    {errors.save_emp_id && <span className="text-[10px] text-red-500 font-medium">{errors.save_emp_id.message}</span>}
                </div>

                {/* 5. ผู้ขอโอน */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้ขอโอน <span className="text-red-500">*</span></label>
                    <div className="flex gap-1">
                        <input
                            type="text"
                            readOnly
                            placeholder="คลิกเพื่อค้นหาผู้ขอโอน"
                            value={selectedEmpName}
                            onClick={() => !isLocked && setIsEmpSearchOpen(true)}
                            className={`${inputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors ${getErrorClass('transfer_emp_id')}`}
                        />
                        {!isLocked && (
                            <button
                                type="button"
                                onClick={() => setIsEmpSearchOpen(true)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all shadow-sm active:scale-95 shrink-0 h-9 w-9 flex items-center justify-center"
                            >
                                <Search size={16} />
                            </button>
                        )}
                        <input type="hidden" {...register('transfer_emp_id')} />
                    </div>
                    {errors.transfer_emp_id && <span className="text-[10px] text-red-500 font-medium">{errors.transfer_emp_id.message}</span>}
                </div>

                {/* 7. หมายเหตุ */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                    <label className={labelClass}>หมายเหตุ</label>
                    <input
                        {...register('remark')}
                        disabled={isLocked}
                        placeholder="หมายเหตุเพิ่มเติม"
                        className={inputClass}
                    />
                </div>
            </div>

            {isEmpSearchOpen && (
                <EmployeeSearchModal
                    isOpen={isEmpSearchOpen}
                    onClose={() => setIsEmpSearchOpen(false)}
                    onSelect={(emp) => {
                        setValue('transfer_emp_id', String(emp.id));
                    }}
                />
            )}
        </section>
    );
};
