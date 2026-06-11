/**
 * @file RequisitionFormHeader.tsx
 * @description ส่วน Header ของฟอร์มใบขอเบิก (Issue Requisition)
 * @pattern ตาม Sales pattern (Premium styling, Balanced grid, Header section)
 */

import React, { useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { ClipboardList, Search } from 'lucide-react';
import type { RequisitionHeaderFormData } from '../schemas/requisition.schemas';
import type { DocLinkOption } from '../types/requisition.types';
import { CustomDateInput } from '@ui';
import { EmployeeSearchModal } from '@/modules/master-data/employee/components/EmployeeSearchModal';

interface RequisitionFormHeaderProps {
    docLinks: DocLinkOption[];
    deptOptions?: { id: string; name: string }[];
    jobOptions?: { id: string; name: string }[];
    branchOptions?: { id: string; name: string }[];
    empOptions?: { id: string; name: string }[];
    readOnly?: boolean;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export const RequisitionFormHeader: React.FC<RequisitionFormHeaderProps> = ({
    docLinks,
    deptOptions = [],
    jobOptions = [],
    branchOptions = [],
    empOptions = [],
    readOnly = false,
}) => {
    const { register, control, formState: { errors }, setValue } = useFormContext<RequisitionHeaderFormData>();
    const watchedCreatedByEmpId = useWatch({ control, name: 'created_by_emp_id' });
    const watchedRequestByEmpId = useWatch({ control, name: 'request_by_emp_id' });

    const [isEmpSearchOpen, setIsEmpSearchOpen] = useState(false);

    const isLocked = readOnly;
    const selectedEmpName = empOptions.find(e => e.id === watchedRequestByEmpId)?.name || '';

    // Premium Styles from Sales Pattern
    const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const selectClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-blue-50/10 dark:bg-blue-900/5 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20";
    
    const getErrorClass = (fieldName: keyof RequisitionHeaderFormData) => 
        errors[fieldName] ? "border-red-500 focus:ring-red-500 ring-2 ring-red-500/50" : "";

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <ClipboardList size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลใบขอเบิก — Header Requisition</h3>
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
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่เอกสาร <span className="text-red-500">*</span></label>
                    <Controller
                        name="issue_req_no"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                disabled={isLocked || field.value === 'ระบบจะกรอกอัตโนมัติ'}
                                placeholder="เลขที่เอกสาร (Unique)"
                                className={`${inputClass} ${getErrorClass('issue_req_no')} ${field.value === 'ระบบจะกรอกอัตโนมัติ' ? 'italic text-gray-400 bg-gray-50' : 'font-bold text-blue-600'}`}
                            />
                        )}
                    />
                    {errors.issue_req_no && <span className="text-[10px] text-red-500 font-medium">{errors.issue_req_no.message}</span>}
                </div>

                {/* 2. รายการเอกสาร */}
                <div className="space-y-1">
                    <label className={labelClass}>รายการเอกสาร <span className="text-red-500">*</span></label>
                    <Controller
                        name="docu_item_no"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                disabled={isLocked}
                                className={`${selectClass} ${getErrorClass('docu_item_no')}`}
                            >
                                <option value="">-- เลือกรายการเอกสาร --</option>
                                {docLinks.map(d => (
                                    <option key={d.docu_type_id} value={String((d.docu_item_no || 1) - 1)}>
                                        {d.docu_type_code ? `${d.docu_type_code} – ` : ''}{d.docu_name_th ?? d.docu_name_en}
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.docu_item_no && <span className="text-[10px] text-red-500 font-medium">{errors.docu_item_no.message}</span>}
                </div>

                {/* 3. วันที่เอกสาร */}
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

                {/* 4. สาขา */}
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

                {/* 5. แผนก */}
                <div className="space-y-1">
                    <label className={labelClass}>แผนก <span className="text-red-500">*</span></label>
                    <Controller
                        name="emp_dept_id"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                disabled={isLocked}
                                className={`${selectClass} ${getErrorClass('emp_dept_id')}`}
                            >
                                <option value="">-- เลือกแผนก --</option>
                                {deptOptions.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.emp_dept_id && <span className="text-[10px] text-red-500 font-medium">{errors.emp_dept_id.message}</span>}
                </div>

                {/* 6. JOB */}
                <div className="space-y-1">
                    <label className={labelClass}>JOB <span className="text-red-500">*</span></label>
                    <Controller
                        name="job_id"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                disabled={isLocked}
                                className={`${selectClass} ${getErrorClass('job_id')}`}
                            >
                                <option value="">-- เลือก Job --</option>
                                {jobOptions.map(j => (
                                    <option key={j.id} value={j.id}>{j.name}</option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.job_id && <span className="text-[10px] text-red-500 font-medium">{errors.job_id.message}</span>}
                </div>

                {/* 7. ผู้บันทึก (Locked to Login User) */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้บันทึก <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={empOptions.find(e => e.id === watchedCreatedByEmpId)?.name || (watchedCreatedByEmpId ? 'กำลังโหลด...' : '-- ไม่ระบุ --')}
                            className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 italic text-gray-500 font-medium border-gray-200 dark:border-gray-700 cursor-not-allowed`}
                        />
                        {/* Hidden input to keep created_by_emp_id in the form state */}
                        <input type="hidden" {...register('created_by_emp_id')} />
                    </div>
                    {errors.created_by_emp_id && <span className="text-[10px] text-red-500 font-medium">{errors.created_by_emp_id.message}</span>}
                </div>

                {/* 8. ผู้ขอเบิก */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้ขอเบิก <span className="text-red-500">*</span></label>
                    <div className="flex gap-1">
                        <input
                            type="text"
                            readOnly
                            placeholder="คลิกเพื่อค้นหาผู้ขอเบิก"
                            value={selectedEmpName}
                            onClick={() => !isLocked && setIsEmpSearchOpen(true)}
                            className={`${inputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors ${getErrorClass('request_by_emp_id')}`}
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
                        <input type="hidden" {...register('request_by_emp_id')} />
                    </div>
                    {errors.request_by_emp_id && <span className="text-[10px] text-red-500 font-medium">{errors.request_by_emp_id.message}</span>}
                </div>



                {/* 11. หมายเหตุ */}
                <div className="lg:col-span-2 space-y-1">
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
                        setValue('request_by_emp_id', String(emp.id ?? emp.employee_id ?? ''));
                    }}
                />
            )}
        </section>
    );
};
