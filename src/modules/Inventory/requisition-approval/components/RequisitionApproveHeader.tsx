import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { ClipboardList } from 'lucide-react';
import type { RequisitionApproveFormData } from '../schemas/requisition-approval.schemas';
import { CustomDateInput } from '@ui';

interface RequisitionApproveHeaderProps {
    deptOptions?: { id: string; name: string }[];
    jobOptions?: { id: string; name: string }[];
    branchOptions?: { id: string; name: string }[];
    empOptions?: { id: string; name: string }[];
}

export const RequisitionApproveHeader: React.FC<RequisitionApproveHeaderProps> = ({
    deptOptions = [],
    jobOptions = [],
    branchOptions = [],
    empOptions = [],
}) => {
    const { control } = useFormContext<RequisitionApproveFormData>();
    const watchedSaveEmpId = useWatch({ control, name: 'save_emp_id' });
    const status = useWatch({ control, name: 'status' });
    const isFinalized = status === 'APPROVED' || status === 'REJECTED';

    const inputClass = "h-9 w-full px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 cursor-not-allowed shadow-sm font-medium";
    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-emerald-50/10 dark:bg-emerald-900/5 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/20";
    
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <ClipboardList size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลใบขอเบิก — Header Requisition</h3>
                </div>
            </div>

            <div className={cardSection}>
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่เอกสาร</label>
                    <Controller
                        name="issue_req_no"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                disabled
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* วันที่เอกสาร */}
                <div className="space-y-1">
                    <label className={labelClass}>วันที่เอกสาร</label>
                    <Controller
                        name="docu_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={() => {}}
                                disabled
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* สาขา */}
                <div className="space-y-1">
                    <label className={labelClass}>สาขา</label>
                    <Controller
                        name="branch_id"
                        control={control}
                        render={({ field }) => (
                            <input
                                value={branchOptions.find(b => b.id === field.value)?.name || field.value || '-'}
                                disabled
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* แผนก */}
                <div className="space-y-1">
                    <label className={labelClass}>แผนก</label>
                    <Controller
                        name="emp_dept_id"
                        control={control}
                        render={({ field }) => (
                            <input
                                value={deptOptions.find(d => d.id === field.value)?.name || field.value || '-'}
                                disabled
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* JOB */}
                <div className="space-y-1">
                    <label className={labelClass}>JOB</label>
                    <Controller
                        name="job_id"
                        control={control}
                        render={({ field }) => (
                            <input
                                value={jobOptions.find(j => j.id === field.value)?.name || field.value || '-'}
                                disabled
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* ผู้บันทึก */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้บันทึก</label>
                    <input
                        type="text"
                        disabled
                        value={empOptions.find(e => e.id === watchedSaveEmpId)?.name || watchedSaveEmpId || '-'}
                        className={inputClass}
                    />
                </div>

                {/* ผู้ขอเบิก */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้ขอเบิก</label>
                    <Controller
                        name="audit_emp_id"
                        control={control}
                        render={({ field }) => (
                            <input
                                value={empOptions.find(e => e.id === field.value)?.name || field.value || '-'}
                                disabled
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* หมายเหตุ */}
                <div className="lg:col-span-4 space-y-1">
                    <label className={labelClass}>หมายเหตุ</label>
                    <Controller
                        name="remark"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                disabled
                                className={inputClass}
                            />
                        )}
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
                {/* เลขที่อนุมัติใบขอเบิก */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่อนุมัติใบขอเบิก</label>
                    <Controller
                        name="approval_no"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                disabled={isFinalized}
                                placeholder="ระบบจะสร้างอัตโนมัติเมื่ออนุมัติ"
                                className={isFinalized ? inputClass : "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"}
                            />
                        )}
                    />
                </div>

                {/* ผู้อนุมัติ */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้อนุมัติ <span className="text-red-500">*</span></label>
                    <Controller
                        name="approval_emp_id"
                        control={control}
                        render={({ field }) => (
                            isFinalized ? (
                                <input
                                    value={empOptions.find(e => String(e.id) === String(field.value))?.name || field.value || '-'}
                                    disabled
                                    className={inputClass}
                                />
                            ) : (
                                <select
                                    {...field}
                                    className="h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"
                                >
                                    <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">-- เลือกผู้อนุมัติ --</option>
                                    {empOptions.map(emp => (
                                        <option key={emp.id} value={emp.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            )
                        )}
                    />
                </div>

                {/* วันที่อนุมัติ */}
                <div className="space-y-1">
                    <label className={labelClass}>วันที่อนุมัติ</label>
                    <Controller
                        name="approved_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isFinalized}
                                className={isFinalized ? inputClass : "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white"}
                            />
                        )}
                    />
                </div>
            </div>
        </section>
    );
};
