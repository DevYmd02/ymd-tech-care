/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFormContext, Controller } from 'react-hook-form';
import { ClipboardList } from 'lucide-react';
import type { TransferInFormValues } from '../schemas/transfer-in.schemas';
import { CustomDateInput } from '@ui';

interface TransferInFormHeaderProps {
    readOnly?: boolean;
    pendingData?: any;
    branches?: any[];
    employees?: any[];
    departments?: any[];
    projects?: any[];
}

export function TransferInFormHeader({ readOnly = false, pendingData, branches, employees, departments, projects = [] }: TransferInFormHeaderProps) {
    const { register, control, watch } = useFormContext<TransferInFormValues>();
    const isLocked = readOnly;

    const branchId = watch('branch_id');
    const deptId = watch('emp_dept_id');
    const creatorId = watch('created_by_emp_id');
    
    const branchName = branches?.find(b => String(b.branch_id) === String(branchId))?.branch_name || branchId;
    
    const creator = employees?.find(e => String(e.employee_id || e.id) === String(creatorId));
    const creatorName = creator ? (creator.employee_fullname || `${creator.employee_firstname_th || ''} ${creator.employee_lastname_th || ''}`.trim() || creatorId) : creatorId;
    
    const actualDeptId = creator?.department_id || creator?.emp_dept_id || deptId;
    const deptName = creator?.department?.department_name || creator?.emp_dept_name || departments?.find(d => String(d.emp_dept_id || d.department_id || d.id) === String(actualDeptId))?.department_name || departments?.find(d => String(d.emp_dept_id || d.department_id || d.id) === String(actualDeptId))?.emp_dept_name || actualDeptId;

    const getInputClass = (disabled: boolean) => 
        disabled 
            ? "h-9 w-full px-3 text-sm bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400 font-medium cursor-not-allowed shadow-sm"
            : "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all shadow-sm";

    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-emerald-50/10 dark:bg-emerald-900/5 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/20";
    
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <ClipboardList size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลใบรับโอนย้ายสินค้าเข้า — Header Transfer In</h3>
                </div>
            </div>

            <div className={cardSection}>
                {/* 1. หมายเลขเอกสาร */}
                <div className="space-y-1">
                    <label className={labelClass}>หมายเลขเอกสาร (Document No)</label>
                    <input
                        value={watch('transfer_in_no') || 'รอสร้างเอกสาร...'}
                        disabled={true}
                        readOnly
                        className={getInputClass(true)}
                    />
                    <input type="hidden" {...register('transfer_in_no')} />
                </div>

                {/* 1.1 หมายเลขเอกสารอ้างอิงอนุมัติ */}
                <div className="space-y-1">
                    <label className={labelClass}>อ้างอิงอนุมัติ (Ref. Approval)</label>
                    <input
                        value={pendingData?.appv_transfer_no || watch('appv_transfer_id') || '-'}
                        disabled={true}
                        readOnly
                        className={getInputClass(true)}
                    />
                    <input type="hidden" {...register('appv_transfer_id')} />
                </div>

                {/* 2. วันที่เอกสาร */}
                <div className="space-y-1">
                    <label className={labelClass}>วันที่เอกสาร</label>
                    <Controller
                        name="transfer_in_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={getInputClass(isLocked)}
                            />
                        )}
                    />
                </div>

                {/* 3. สาขา */}
                <div className="space-y-1">
                    <label className={labelClass}>สาขา (Branch ID)</label>
                    <input
                        value={branchName || ''}
                        disabled={true}
                        readOnly
                        className={getInputClass(true)}
                    />
                    <input type="hidden" {...register('branch_id')} />
                </div>

                {/* 4. แผนก */}
                <div className="space-y-1">
                    <label className={labelClass}>แผนก (Dept ID)</label>
                    <input
                        value={deptName || ''}
                        disabled={true}
                        readOnly
                        className={getInputClass(true)}
                    />
                    <input type="hidden" value={creator?.department_id || creator?.emp_dept_id || deptId || ''} {...register('emp_dept_id')} />
                </div>

                {/* 5. ผู้บันทึก */}
                <div className="space-y-1">
                    <label className={labelClass}>ผู้บันทึก</label>
                    <div className="relative">
                        <input
                            type="text"
                            readOnly
                            value={creatorName || (creatorId ? 'กำลังโหลด...' : '-- ไม่ระบุ --')}
                            className={`${getInputClass(true)} italic`}
                        />
                        <input type="hidden" {...register('created_by_emp_id')} />
                    </div>
                </div>

                {/* 6. โครงการ (Project ID) */}
                <div className="space-y-1">
                    <label className={labelClass}>โครงการ (Project ID)</label>
                    <select
                        {...register('project_id')}
                        disabled={isLocked}
                        className={getInputClass(isLocked)}
                    >
                        <option value="">-- ระบุโครงการ (ถ้ามี) --</option>
                        {projects?.map(project => (
                            <option key={project.project_id || project.id} value={String(project.project_id || project.id)}>
                                {project.project_code ? `[${project.project_code}] ` : ''}{project.project_name || project.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 7. หมายเหตุ */}
                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                    <label className={labelClass}>หมายเหตุ</label>
                    <input
                        {...register('remarks')}
                        disabled={isLocked}
                        placeholder="หมายเหตุเพิ่มเติม"
                        className={getInputClass(isLocked)}
                    />
                </div>
            </div>
        </section>
    );
};
