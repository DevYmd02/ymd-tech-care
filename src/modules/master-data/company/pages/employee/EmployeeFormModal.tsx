/**
 * @file EmployeeFormModal.tsx
 * @description Modal for creating/editing Employee data — with a two-step flow for Account Setup
 */

import { Controller } from 'react-hook-form';
import { Save, User, MapPin, Building2, CalendarDays, FileText, Plus, Trash2, Check, Lock, ShieldCheck, KeyRound, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { SavingOverlay } from '@/shared/components/ui/feedback/SavingOverlay';
import { useEmployeeForm } from './hooks/useEmployeeForm';
import type { EmployeeAddress, EmployeeMaster } from '@company/types/employee.types';
import type { EmployeeDeptMaster } from '@company/types/employee-dept.types';
import type { PositionMaster } from '@company/types/position.types';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';
import { EmployeeSignatureManager } from '@/modules/master-data/employee/components/EmployeeSignatureManager';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: number | null;
}

// ─── Options ────────────────────────────────────────────────────────────────

const THAI_TITLE_OPTIONS = ['นาย', 'นาง', 'นางสาว'];
const ENG_TITLE_OPTIONS  = ['Mr.', 'Mrs.', 'Ms.'];

const EMP_TYPE_OPTIONS = [
    { value: 'S', label: 'S - พนักงานขาย' },
    { value: 'G', label: 'G - พนักงานปกติ' },
];

const EMP_STATUS_OPTIONS = [
    { value: '1', label: 'ทำงาน' },
    { value: '2', label: 'พักงาน' },
    { value: '3', label: 'ลาออก' },
    { value: '4', label: 'เกษียณ' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-gray-800/60">
        <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-400/80">{title}</h3>
    </div>
);



// ─── Main Component ──────────────────────────────────────────────────────────

export const EmployeeFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        branches,
        departments,
        positions,
        heads,
        addressFields,
        appendAddress,
        removeAddress,
        isSubmitting,
        handleSave,
        handleSaveAccount,
        accountForm,
        step,
        createdEmployee,
        control,
        setStep,
        setCreatedEmployee,
        initialData,
        resetAll,
        onClose: handleCloseAttempt
    } = useEmployeeForm(editId ?? null, isOpen, handleClose, onSuccess);

    const { register: registerAccount, formState: { errors: accountErrors } } = accountForm;

    function handleClose() {
        onClose();
        // Reset after closing to avoid UI lag
        setTimeout(() => {
            resetAll();
        }, 300);
    }

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={handleCloseAttempt}
            title={
                step === 1 ? (isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่') : 
                step === 2 ? (isEdit ? 'แก้ไขบัญชีผู้ใช้' : 'กำหนดบัญชีผู้ใช้') : 
                'จัดการลายเซ็น'
            }
            width="max-w-[1200px]"
            footer={
                <div className="flex items-center justify-between w-full px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    {step === 1 ? (
                        <>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <Controller
                                        control={control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <>
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                                            </>
                                        )}
                                    />
                                </label>
                                <Controller
                                    control={control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            สถานะการใช้งาน {field.value ? '(Active)' : '(Inactive)'}
                                        </span>
                                    )}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseAttempt}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    ยกเลิก
                                </button>

                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (initialData) setCreatedEmployee(initialData);
                                            setStep(2);
                                        }}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        จัดการบัญชีผู้ใช้
                                    </button>
                                )}

                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-semibold flex items-center gap-2 border border-indigo-200 transition-all"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        จัดการลายเซ็น
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลพนักงาน'}
                                </button>
                            </div>
                        </>
                    ) : step === 2 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => onSuccess()}
                                className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                ไว้ภายหลัง (Skip)
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAccount}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <ShieldCheck className="w-4 h-4" />
                                )}
                                ยืนยันกำหนดรหัสผ่าน
                            </button>
                        </>
                    ) : (
                        <div className="flex justify-end w-full">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                กลับไปหน้าข้อมูลพนักงาน
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="relative">
                <SavingOverlay isVisible={isSubmitting} />

                {/* Stepper UI (Only for Create Mode) */}
                {!isEdit && (
                    <div className="flex items-center justify-center gap-4 py-8 border-b border-gray-100 dark:border-gray-800/50 mb-6 bg-white dark:bg-transparent">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/10' : 'bg-emerald-500 text-white'}`}>
                                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                            </div>
                            <span className={`text-sm font-bold ${step === 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>ข้อมูลพนักงาน</span>
                        </div>
                        <div className={`h-[2px] w-12 bg-gray-200 dark:bg-gray-700 ${step > 1 ? 'bg-emerald-300 dark:bg-emerald-500/50' : ''}`} />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/10' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600'}`}>
                                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
                            </div>
                            <span className={`text-sm font-bold ${step === 2 ? 'text-indigo-600 dark:text-indigo-400' : step > 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>กำหนดบัญชีผู้ใช้</span>
                        </div>
                        <div className={`h-[2px] w-12 bg-gray-200 dark:bg-gray-700 ${step > 2 ? 'bg-emerald-300 dark:bg-emerald-500/50' : ''}`} />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 3 ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/10' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600'}`}>
                                3
                            </div>
                            <span className={`text-sm font-bold ${step === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600'}`}>จัดการลายเซ็น</span>
                        </div>
                    </div>
                )}

                <div className="px-8 pb-8">
                    {step === 1 ? (
                        <div className="animate-in fade-in duration-500 space-y-10">
                            {/* SECTION 1 — ข้อมูลพื้นฐาน */}
                            <section>
                                <SectionHeader icon={<User className="w-4 h-4" />} title="ข้อมูลพื้นฐาน" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={styles.label}>รหัสพนักงาน <span className="text-red-500">*</span></label>
                                        <input {...register('employee_code')} type="text" className={`${styles.input} ${errors.employee_code ? 'border-red-500' : ''}`} disabled={isEdit} />
                                        {errors.employee_code && <p className="text-red-500 text-xs mt-1">{errors.employee_code.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                                        <input {...register('tax_id')} type="text" className={styles.input} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={styles.label}>คำนำหน้า (ไทย) <span className="text-red-500">*</span></label>
                                        <select {...register('employee_title_th')} className={`${styles.input} ${errors.employee_title_th ? 'border-red-500' : ''}`}>
                                            <option value="">-- เลือกคำนำหน้า --</option>
                                            {THAI_TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        {errors.employee_title_th && <p className="text-red-500 text-xs mt-1">{errors.employee_title_th.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>คำนำหน้า (Eng)</label>
                                        <select {...register('employee_title_en')} className={styles.input}>
                                            <option value="">-- Select Title --</option>
                                            {ENG_TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={styles.label}>ชื่อ (ไทย) <span className="text-red-500">*</span></label>
                                        <input {...register('employee_firstname_th')} type="text" className={`${styles.input} ${errors.employee_firstname_th ? 'border-red-500' : ''}`} />
                                        {errors.employee_firstname_th && <p className="text-red-500 text-xs mt-1">{errors.employee_firstname_th.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>นามสกุล (ไทย) <span className="text-red-500">*</span></label>
                                        <input {...register('employee_lastname_th')} type="text" className={`${styles.input} ${errors.employee_lastname_th ? 'border-red-500' : ''}`} />
                                        {errors.employee_lastname_th && <p className="text-red-500 text-xs mt-1">{errors.employee_lastname_th.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={styles.label}>ชื่อ (Eng)</label>
                                        <input {...register('employee_firstname_en')} type="text" className={styles.input} />
                                    </div>
                                    <div>
                                        <label className={styles.label}>นามสกุล (Eng)</label>
                                        <input {...register('employee_lastname_en')} type="text" className={styles.input} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={styles.label}>โทรศัพท์ <span className="text-red-500">*</span></label>
                                        <input {...register('phone')} type="text" className={`${styles.input} ${errors.phone ? 'border-red-500' : ''}`} />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>E-Mail <span className="text-red-500">*</span></label>
                                        <input {...register('email')} type="email" className={`${styles.input} ${errors.email ? 'border-red-500' : ''}`} />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 2 — ที่อยู่ */}
                            <section>
                                <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100 dark:border-gray-800/60">
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400"><MapPin className="w-4 h-4" /></span>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-gray-400/80">ที่อยู่</h3>
                                    </div>
                                    <button type="button" onClick={() => appendAddress({ address_type: 'CONTACT', address: '', sub_district: '', district: '', province: '', postal_code: '', country: 'Thailand', contact_person: '' })} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                                        <Plus className="w-3 h-3" /> เพิ่มที่อยู่
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {addressFields.map((field: EmployeeAddress & { id: string }, index: number) => (
                                        <div key={field.id} className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-transparent relative shadow-sm hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                                            {addressFields.length > 1 && (
                                                <button type="button" onClick={() => removeAddress(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                <div>
                                                    <label className={styles.label}>ประเภทที่อยู่</label>
                                                    <select {...register(`addresses.${index}.address_type`)} className={styles.input}>
                                                        <option value="CONTACT">CONTACT - ที่อยู่ติดต่อ</option>
                                                        <option value="REGISTERED">REGISTERED - ที่อยู่ตามทะเบียนบ้าน</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className={styles.label}>ผู้ติดต่อ</label>
                                                    <input {...register(`addresses.${index}.contact_person`)} type="text" className={styles.input} />
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className={styles.label}>รายละเอียดที่อยู่ <span className="text-red-500">*</span></label>
                                                <textarea {...register(`addresses.${index}.address`)} rows={2} className={`${styles.input} ${errors.addresses?.[index]?.address ? 'border-red-500' : ''}`} placeholder="บ้านเลขที่, หมู่, ซอย, ถนน..." />
                                                {errors.addresses?.[index]?.address && <p className="text-red-500 text-xs mt-1">{errors.addresses[index].address.message}</p>}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                <div>
                                                    <label className={styles.label}>เขต/อำเภอ <span className="text-red-500">*</span></label>
                                                    <input {...register(`addresses.${index}.district`)} type="text" className={`${styles.input} ${errors.addresses?.[index]?.district ? 'border-red-500' : ''}`} />
                                                    {errors.addresses?.[index]?.district && <p className="text-red-500 text-xs mt-1">{errors.addresses[index].district.message}</p>}
                                                </div>
                                                <div>
                                                    <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                                    <input {...register(`addresses.${index}.province`)} type="text" className={`${styles.input} ${errors.addresses?.[index]?.province ? 'border-red-500' : ''}`} />
                                                    {errors.addresses?.[index]?.province && <p className="text-red-500 text-xs mt-1">{errors.addresses[index].province.message}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                                    <input {...register(`addresses.${index}.postal_code`)} type="text" className={`${styles.input} ${errors.addresses?.[index]?.postal_code ? 'border-red-500' : ''}`} />
                                                    {errors.addresses?.[index]?.postal_code && <p className="text-red-500 text-xs mt-1">{errors.addresses[index].postal_code.message}</p>}
                                                </div>
                                                <div>
                                                    <label className={styles.label}>ประเทศ <span className="text-red-500">*</span></label>
                                                    <input {...register(`addresses.${index}.country`)} type="text" className={`${styles.input} ${errors.addresses?.[index]?.country ? 'border-red-500' : ''}`} />
                                                    {errors.addresses?.[index]?.country && <p className="text-red-500 text-xs mt-1">{errors.addresses[index].country.message}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* SECTION 3 — ข้อมูลองค์กร */}
                            <section>
                                <SectionHeader icon={<Building2 className="w-4 h-4" />} title="ข้อมูลองค์กร" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={styles.label}>สาขา <span className="text-red-500">*</span></label>
                                        <select {...register('branch_id', { setValueAs: (v: string) => v === "" ? null : Number(v) })} className={`${styles.input} ${errors.branch_id ? 'border-red-500' : ''}`}>
                                            <option value="">-- เลือกสาขา --</option>
                                            {branches?.map((b: BranchListItem) => <option key={b.branch_id || b.id} value={b.branch_id || b.id}>{b.branch_code} - {b.branch_name}</option>)}
                                        </select>
                                        {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>แผนก <span className="text-red-500">*</span></label>
                                        <select {...register('emp_dept_id', { setValueAs: (v: string) => v === "" ? null : Number(v) })} className={`${styles.input} ${errors.emp_dept_id ? 'border-red-500' : ''}`}>
                                            <option value="">-- เลือกแผนก --</option>
                                            {departments.map((dept: EmployeeDeptMaster) => <option key={dept.emp_dept_id || dept.id} value={dept.emp_dept_id || dept.id}>{dept.emp_dept_code || dept.dept_code} - {dept.emp_dept_name || dept.dept_name}</option>)}
                                        </select>
                                        {errors.emp_dept_id && <p className="text-red-500 text-xs mt-1">{errors.emp_dept_id.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={styles.label}>ตำแหน่ง <span className="text-red-500">*</span></label>
                                        <select {...register('position_id', { setValueAs: (v: string) => v === "" ? null : Number(v) })} className={`${styles.input} ${errors.position_id ? 'border-red-500' : ''}`}>
                                            <option value="">-- เลือกตำแหน่ง --</option>
                                            {positions.map((pos: PositionMaster) => <option key={pos.position_id} value={pos.position_id}>{pos.position_code} - {pos.position_name}</option>)}
                                        </select>
                                        {errors.position_id && <p className="text-red-500 text-xs mt-1">{errors.position_id.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>ประเภทพนักงาน</label>
                                        <select {...register('emp_type')} className={styles.input}>
                                            {EMP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={styles.label}>ผู้บังคับบัญชา (Superior)</label>
                                        <select {...register('employee_head_id', { setValueAs: (v: string) => v === "" ? null : Number(v) })} className={styles.input}>
                                            <option value="">-- เลือกผู้บังคับบัญชา --</option>
                                            {heads.map((h: EmployeeMaster) => (
                                                <option key={h.id} value={h.id}>
                                                    {h.employee_code} - {h.employee_firstname_th} {h.employee_lastname_th}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 4 — วันที่และสถานะ */}
                            <section>
                                <SectionHeader icon={<CalendarDays className="w-4 h-4" />} title="วันที่และสถานะ" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className={styles.label}>วันที่เริ่มงาน <span className="text-red-500">*</span></label>
                                        <Controller
                                            control={control}
                                            name="employee_startdate"
                                            render={({ field }) => (
                                                <CustomDateInput value={field.value || ''} onChange={field.onChange} className={`${styles.input} ${errors.employee_startdate ? 'border-red-500' : ''}`} />
                                            )}
                                        />
                                        {errors.employee_startdate && <p className="text-red-500 text-xs mt-1">{errors.employee_startdate.message}</p>}
                                    </div>
                                    <div>
                                        <label className={styles.label}>วันที่ลาออก</label>
                                        <Controller
                                            control={control}
                                            name="employee_resigndate"
                                            render={({ field }) => (
                                                <CustomDateInput value={field.value || ''} onChange={field.onChange} className={styles.input} />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.label}>สถานะ</label>
                                        <select {...register('employee_status', { setValueAs: (v: string) => v === "" ? null : Number(v) })} className={styles.input}>
                                            {EMP_STATUS_OPTIONS.map(o => <option key={o.value} value={Number(o.value)}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 5 — อื่นๆ */}
                            <section>
                                <SectionHeader icon={<FileText className="w-4 h-4" />} title="อื่นๆ" />
                                <div>
                                    <label className={styles.label}>หมายเหตุ</label>
                                    <textarea {...register('remark')} rows={3} className={styles.input} />
                                </div>
                            </section>
                        </div>
                    ) : step === 2 ? (
                        <div className="max-w-md mx-auto py-10 animate-in slide-in-from-right duration-500">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-sm">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? 'จัดการบัญชีผู้ใช้' : 'สร้างพนักงานสำเร็จ!'}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                                    {isEdit ? 'คุณสามารถแก้ไขชื่อผู้ใช้และรหัสผ่านสำหรับ' : 'คุณต้องการกำหนดชื่อผู้ใช้และรหัสผ่านสำหรับ'} <br />
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {createdEmployee?.employee_firstname_th || createdEmployee?.first_name} {createdEmployee?.employee_lastname_th || createdEmployee?.last_name}
                                    </span> {isEdit ? 'ได้ที่นี่' : 'เลยหรือไม่?'}
                                </p>
                            </div>

                            <div className="space-y-6 bg-white dark:bg-slate-800/40 p-8 rounded-3xl border border-gray-100 dark:border-gray-800/60 shadow-2xl backdrop-blur-sm">
                                <div>
                                    <label className={styles.label}>ชื่อผู้ใช้ (Username)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            {...registerAccount('username')}
                                            type="text"
                                            className={`${styles.input} pl-10 ${accountErrors.username ? 'border-red-500' : ''}`}
                                            placeholder="ตัวอย่าง: somchai_j"
                                        />
                                    </div>
                                    {accountErrors.username && <p className="text-red-500 text-[10px] mt-1">{accountErrors.username.message}</p>}
                                </div>

                                <div>
                                    <label className={styles.label}>รหัสผ่าน (Password)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <KeyRound className="w-4 h-4" />
                                        </div>
                                        <input
                                            {...registerAccount('password')}
                                            type="password"
                                            className={`${styles.input} pl-10 ${accountErrors.password ? 'border-red-500' : ''}`}
                                            placeholder="อย่างน้อย 6 ตัวอักษร"
                                        />
                                    </div>
                                    {accountErrors.password && <p className="text-red-500 text-[10px] mt-1">{accountErrors.password.message}</p>}
                                </div>

                                <div>
                                    <label className={styles.label}>ยืนยันรหัสผ่าน</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            {...registerAccount('confirmPassword')}
                                            type="password"
                                            className={`${styles.input} pl-10 ${accountErrors.confirmPassword ? 'border-red-500' : ''}`}
                                            placeholder="ระบุรหัสผ่านอีกครั้ง"
                                        />
                                    </div>
                                    {accountErrors.confirmPassword && <p className="text-red-500 text-[10px] mt-1">{accountErrors.confirmPassword.message}</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right duration-500 max-w-4xl mx-auto py-6">
                            <EmployeeSignatureManager 
                                employeeId={editId || createdEmployee?.id || createdEmployee?.employee_id || 0} 
                                onClose={() => setStep(1)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </DialogFormLayout>
    );
};