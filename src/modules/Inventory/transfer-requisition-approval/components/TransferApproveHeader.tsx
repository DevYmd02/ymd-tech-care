/**
 * @file TransferApproveHeader.tsx
 * @description ส่วน Header ของฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Header)
 */

import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { ClipboardList } from 'lucide-react';
import type { TransferApprovalFormData } from '../schemas/transfer-approval.schemas';
import { CustomDateInput } from '@ui';

interface TransferApproveHeaderProps {
    branchOptions?: { id: string; name: string }[];
    empOptions?: { id: string; name: string }[];
    readOnly?: boolean;
}

export const TransferApproveHeader: React.FC<TransferApproveHeaderProps> = ({
    branchOptions = [],
    empOptions = [],
    readOnly = false,
}) => {
    const { register, control, formState: { errors } } = useFormContext<TransferApprovalFormData>();
    const watchedSaveEmpId = useWatch({ control, name: 'save_emp_id' });
    const watchedSaveEmpName = useWatch({ control, name: 'save_emp_name' });
    const watchedAppvEmpId = useWatch({ control, name: 'appv_emp_id' });
    const watchedAppvEmpName = useWatch({ control, name: 'appv_emp_name' });
    const watchedTransferEmpId = useWatch({ control, name: 'transfer_emp_id' });
    const watchedTransferEmpName = useWatch({ control, name: 'transfer_emp_name' });
    const watchedDocuItemName = useWatch({ control, name: 'docu_item_name' });

    const isLocked = readOnly;

    const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const selectClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-emerald-50/10 dark:bg-emerald-900/5 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/20";
    
    const getErrorClass = (fieldName: keyof TransferApprovalFormData) => 
        errors[fieldName] ? "border-red-500 focus:ring-red-500 ring-2 ring-red-500/50" : "";

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <ClipboardList size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลใบขอโอนย้ายสินค้า — Header Transfer Requisition</h3>
                </div>
                <div className="flex items-center gap-6">
                    {/* Status Checkbox */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
                        <Controller
                            name="cancel_flag"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="checkbox"
                                    id="cancel_flag_checkbox"
                                    disabled={isLocked}
                                    checked={field.value === 'Y'}
                                    onChange={(e) => field.onChange(e.target.checked ? 'Y' : 'N')}
                                    className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500 cursor-pointer disabled:opacity-50"
                                />
                            )}
                        />
                        <label htmlFor="cancel_flag_checkbox" className="text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer uppercase tracking-tight">
                            ยกเลิกเอกสาร (VOID)
                        </label>
                    </div>
                </div>
            </div>

            <div className={cardSection}>
                {/* 1. เอกสารขอโอนย้ายอ้างอิง */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่เอกสาร <span className="text-red-500">*</span></label>
                    <div className="flex gap-1">
                        <Controller
                            name="transfer_req_no"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    type="text"
                                    readOnly
                                    placeholder="ระบบจะแสดงเลขที่เอกสารอัตโนมัติ"
                                    className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                                />
                            )}
                        />
                    </div>
                    {errors.transfer_req_id && <span className="text-[10px] text-red-500 font-medium">{errors.transfer_req_id.message}</span>}
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
                                onChange={() => {}}
                                disabled={true}
                                className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                            />
                        )}
                    />
                </div>

                {/* 3. รายการเอกสาร */}
                <div className="space-y-1">
                    <label className={labelClass}>รายการเอกสาร <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        readOnly
                        value={watchedDocuItemName || ''}
                        placeholder="รายการเอกสาร"
                        className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                    />
                </div>

                {/* 4. สาขา */}
                <div className="space-y-1">
                    <label className={labelClass}>สาขา <span className="text-red-500">*</span></label>
                    <Controller
                        name="branch_id"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                disabled={true}
                                className={`${selectClass} bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                            >
                                <option value="">-- เลือกสาขา --</option>
                                {branchOptions.map(b => (
                                    <option key={b.id} value={String(b.id)}>{b.name}</option>
                                ))}
                            </select>
                        )}
                    />
                </div>

                {/* 5. ผู้บันทึก (ของใบขอโอน) */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้บันทึก <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        readOnly
                        value={watchedSaveEmpName || empOptions.find(e => String(e.id) === String(watchedSaveEmpId))?.name || (watchedSaveEmpId ? 'กำลังโหลด...' : '-- ไม่ระบุ --')}
                        className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                    />
                </div>

                {/* 6. ผู้ขอโอน */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้ขอโอน <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        readOnly
                        value={watchedTransferEmpName || empOptions.find(e => String(e.id) === String(watchedTransferEmpId))?.name || '-- ไม่ระบุ --'}
                        placeholder="ผู้ขอโอน"
                        className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                    />
                </div>

                {/* 7. หมายเหตุ */}
                <div className="md:col-span-2 lg:col-span-2 space-y-1">
                    <label className={labelClass}>หมายเหตุ</label>
                    <input
                        {...register('remark')}
                        disabled={true}
                        placeholder="หมายเหตุการขอโอนย้าย"
                        className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 pt-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <ClipboardList size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลการอนุมัติ — Approval Information</h3>
                </div>
            </div>

            <div className={cardSection}>
                {/* 1. เลขที่เอกสารอนุมัติ */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่อนุมัติใบขอโอนย้ายสินค้า <span className="text-red-500">*</span></label>
                    <Controller
                        name="appv_transfer_no"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                disabled={isLocked || field.value === 'ระบบจะกรอกอัตโนมัติ'}
                                placeholder="เลขที่อนุมัติใบขอโอนย้ายสินค้า"
                                className={`${inputClass} ${getErrorClass('appv_transfer_no')} ${field.value === 'ระบบจะกรอกอัตโนมัติ' ? 'italic text-gray-400 bg-gray-50' : 'font-bold text-emerald-600'}`}
                            />
                        )}
                    />
                    {errors.appv_transfer_no && <span className="text-[10px] text-red-500 font-medium">{errors.appv_transfer_no.message}</span>}
                </div>

                {/* 2. ผู้อนุมัติ */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้อนุมัติ <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={watchedAppvEmpName || empOptions.find(e => String(e.id) === String(watchedAppvEmpId))?.name || (watchedAppvEmpId ? 'กำลังโหลด...' : '-- ไม่ระบุ --')}
                            className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                        />
                        <input type="hidden" {...register('appv_emp_id')} />
                    </div>
                    {errors.appv_emp_id && <span className="text-[10px] text-red-500 font-medium">{errors.appv_emp_id.message}</span>}
                </div>

                {/* 3. วันที่อนุมัติ */}
                <div className="space-y-1">
                    <label className={labelClass}>วันที่อนุมัติ <span className="text-red-500">*</span></label>
                    <Controller
                        name="appv_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={`${inputClass} ${getErrorClass('appv_date')}`}
                            />
                        )}
                    />
                    {errors.appv_date && <span className="text-[10px] text-red-500 font-medium">{errors.appv_date.message}</span>}
                </div>
            </div>
        </section>
    );
};
