/**
 * @file EmployeeFormModal.tsx
 * @description Modal for creating/editing Employee data — full field set matching M16 schema
 */

import { Controller } from 'react-hook-form';
import { Save, X, User, MapPin, Building2, CalendarDays, FileText, Plus, Trash2 } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { SavingOverlay } from '@/shared/components/ui/feedback/SavingOverlay';
import { useEmployeeForm } from './hooks/useEmployeeForm';

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
    { value: '1', label: '1 - ทำงาน' },
    { value: '2', label: '2 - พักงาน' },
    { value: '3', label: '3 - ลาออก' },
    { value: '4', label: '4 - เกษียณ' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Section header with icon and divider */
const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-blue-600 dark:text-blue-400">{icon}</span>
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
    </div>
);

/** Hint text shown below an input */
const Hint = ({ text }: { text: string }) => (
    <p className="text-gray-400 text-xs mt-1">{text}</p>
);

// ─── Main Component ──────────────────────────────────────────────────────────



export const EmployeeFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        departments,
        positions,
        employeeGroups,
        heads,
        signatureFields,
        isSubmitting,
        isUploading,
        isDeleting,
        handleSave,
        handleUploadSignature,
        handleDeleteSignature,
        setValue,
        control,
    } = useEmployeeForm(editId ?? null, isOpen, onSuccess);

    // ── Footer ──────────────────────────────────────────────────────────────
    const FormFooter = (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            {/* Status Toggle on the left */}
            <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                    <Controller
                        control={control}
                        name="isActive"
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
                    name="isActive"
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
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-2 transition-colors border border-gray-300 dark:border-gray-600 font-medium"
                    onClick={onClose}
                >
                    <X className="w-4 h-4" />
                    ยกเลิก
                </button>
                <button
                    type="button"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 font-medium"
                    onClick={handleSave}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    บันทึก
                </button>
            </div>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มรหัสพนักงานใหม่'}
            titleIcon={<User className="w-5 h-5 text-white" />}
            footer={FormFooter}
        >
            <div className="p-6 space-y-8 relative">
                <SavingOverlay isVisible={isSubmitting} />

                {/* ════════════════════════════════════════
                    SECTION 1 — ข้อมูลพื้นฐาน
                ════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={<User className="w-4 h-4" />} title="ข้อมูลพื้นฐาน" />

                    {/* Row 1: รหัสพนักงาน + เลขบัตรประชาชน */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={styles.label}>
                                รหัสพนักงาน <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('employeeCode')}
                                type="text"
                                className={`${styles.input} ${errors.employeeCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                                disabled={isEdit}
                            />
                            {errors.employeeCode ? (
                                <p className="text-red-500 text-xs mt-1">{errors.employeeCode.message}</p>
                            ) : (
                                <Hint text="varchar(25) - รหัสพนักงาน (ไม่ซ้ำ)" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>
                                เลขประจำตัวประชาชน <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('taxIdCard')}
                                type="text"
                                className={`${styles.input} ${errors.taxIdCard ? 'border-red-500 focus:ring-red-200' : ''}`}
                                onInput={(e) => {
                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                }}
                            />
                            {errors.taxIdCard ? (
                                <p className="text-red-500 text-xs mt-1">{errors.taxIdCard.message}</p>
                            ) : (
                                <Hint text="varchar(25) - เลขประจำตัวประชาชน" />
                            )}
                        </div>
                    </div>

                    {/* Row 2: คำนำหน้า Thai + Eng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={styles.label}>
                                คำนำหน้า (ไทย) <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('empTitle')}
                                className={`${styles.input} cursor-pointer ${errors.empTitle ? 'border-red-500' : ''}`}
                            >
                                <option value="">-- เลือกคำนำหน้า --</option>
                                {THAI_TITLE_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {errors.empTitle ? (
                                <p className="text-red-500 text-xs mt-1">{errors.empTitle.message}</p>
                            ) : (
                                <Hint text="varchar(50) - คำนำหน้า" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>คำนำหน้า (Eng)</label>
                            <select
                                {...register('empTitleEng')}
                                className={`${styles.input} cursor-pointer`}
                            >
                                <option value="">-- Select Title --</option>
                                {ENG_TITLE_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <Hint text="varchar(255) - คำนำหน้า (Eng)" />
                        </div>
                    </div>

                    {/* Row 3: ชื่อพนักงาน Thai + Eng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={styles.label}>
                                ชื่อพนักงาน (ไทย) <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('empName')}
                                type="text"
                                className={`${styles.input} ${errors.empName ? 'border-red-500' : ''}`}
                            />
                            {errors.empName ? (
                                <p className="text-red-500 text-xs mt-1">{errors.empName.message}</p>
                            ) : (
                                <Hint text="varchar(255) - ชื่อพนักงาน (Required)" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>ชื่อพนักงาน (Eng)</label>
                            <input
                                {...register('empNameEng')}
                                type="text"
                                className={styles.input}
                            />
                            <Hint text="varchar(255) - ชื่อพนักงาน (Eng)" />
                        </div>
                    </div>

                    {/* Row 4: โทรศัพท์ + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>
                                โทรศัพท์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('tel')}
                                type="text"
                                className={`${styles.input} ${errors.tel ? 'border-red-500 focus:ring-red-200' : ''}`}
                                onInput={(e) => {
                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                }}
                            />
                            {errors.tel ? (
                                <p className="text-red-500 text-xs mt-1">{errors.tel.message}</p>
                            ) : (
                                <Hint text="varchar(255) - โทรศัพท์" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>E-Mail</label>
                            <input
                                {...register('email')}
                                type="email"
                                className={`${styles.input} ${errors.email ? 'border-red-500' : ''}`}
                            />
                            {errors.email ? (
                                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                            ) : (
                                <Hint text="varchar(255) - E-Mail" />
                            )}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════
                    SECTION 2 — ที่อยู่
                ════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={<MapPin className="w-4 h-4" />} title="ที่อยู่" />

                    {/* Address full width */}
                    <div className="mb-4">
                        <label className={styles.label}>
                            ที่อยู่ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('address')}
                            rows={3}
                            className={`${styles.input} resize-y ${errors.address ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.address ? (
                            <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                        ) : (
                            <Hint text="text - ที่อยู่" />
                        )}
                    </div>

                    {/* ตำบล อำเภอ จังหวัด รหัสไปรษณีย์ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={styles.label}>
                                ตำบล <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('district')}
                                type="text"
                                className={`${styles.input} ${errors.district ? 'border-red-500 focus:ring-red-200' : ''}`}
                            />
                            {errors.district ? (
                                <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>
                            ) : (
                                <Hint text="varchar(100) - ตำบล" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>
                                อำเภอ <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('amphur')}
                                type="text"
                                className={`${styles.input} ${errors.amphur ? 'border-red-500 focus:ring-red-200' : ''}`}
                            />
                            {errors.amphur ? (
                                <p className="text-red-500 text-xs mt-1">{errors.amphur.message}</p>
                            ) : (
                                <Hint text="varchar(100) - อำเภอ" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>
                                จังหวัด <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('province')}
                                type="text"
                                className={`${styles.input} ${errors.province ? 'border-red-500 focus:ring-red-200' : ''}`}
                            />
                            {errors.province ? (
                                <p className="text-red-500 text-xs mt-1">{errors.province.message}</p>
                            ) : (
                                <Hint text="varchar(100) - จังหวัด" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>
                                รหัสไปรษณีย์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('postCode')}
                                type="text"
                                className={`${styles.input} ${errors.postCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                                onInput={(e) => {
                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                }}
                            />
                            {errors.postCode ? (
                                <p className="text-red-500 text-xs mt-1">{errors.postCode.message}</p>
                            ) : (
                                <Hint text="varchar(25) - รหัสไปรษณีย์" />
                            )}
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════
                    SECTION 3 — ข้อมูลองค์กร
                ════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={<Building2 className="w-4 h-4" />} title="ข้อมูลองค์กร" />

                    {/* Row 1: แผนก (dept) + ตำแหน่ง (position) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* แผนก */}
                        <div>
                            <label className={styles.label}>
                                แผนก <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('deptId')}
                                className={`${styles.input} cursor-pointer ${errors.deptId ? 'border-red-500' : ''}`}
                            >
                                <option value="">-- เลือกแผนก --</option>
                                {departments.map(dept => (
                                    <option
                                        key={dept.emp_dept_id || dept.id}
                                        value={String(dept.emp_dept_id || dept.id || '')}
                                    >
                                        {dept.emp_dept_code || dept.dept_code || '-'} -{' '}
                                        {dept.emp_dept_name || dept.dept_name || '-'}
                                    </option>
                                ))}
                            </select>
                            {errors.deptId ? (
                                <p className="text-red-500 text-xs mt-1">{errors.deptId.message}</p>
                            ) : (
                                <Hint text="varchar(25) dept_code / uuid dept_id (FK)" />
                            )}
                        </div>

                        {/* ตำแหน่ง */}
                        <div>
                            <label className={styles.label}>
                                ตำแหน่ง <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('postId')}
                                className={`${styles.input} cursor-pointer ${errors.postId ? 'border-red-500' : ''}`}
                                onChange={(e) => {
                                    const pos = positions.find(p => String(p.position_id) === e.target.value);
                                    setValue('postId', e.target.value);
                                    setValue('positionCode', pos?.position_code || '');
                                    setValue('positionId', Number(e.target.value) || 0);
                                }}
                            >
                                <option value="">-- เลือกตำแหน่ง --</option>
                                {positions.map(pos => (
                                    <option key={pos.position_id} value={String(pos.position_id)}>
                                        {pos.position_code} - {pos.position_name}
                                    </option>
                                ))}
                            </select>
                            {errors.postId ? (
                                <p className="text-red-500 text-xs mt-1">{errors.postId.message}</p>
                            ) : (
                                <Hint text="varchar(25) position_code / uuid post_id (FK)" />
                            )}
                        </div>
                    </div>

                    {/* Row 2: กลุ่มพนักงาน + รหัสหัวหน้า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={styles.label}>
                                กลุ่มพนักงาน <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('empGroupId')}
                                className={`${styles.input} cursor-pointer ${errors.empGroupId ? 'border-red-500' : ''}`}
                            >
                                <option value="">-- เลือกกลุ่มพนักงาน --</option>
                                {employeeGroups.map(group => (
                                    <option key={group.employee_group_id} value={String(group.employee_group_id)}>
                                        {group.employee_group_code} - {group.employee_group_name}
                                    </option>
                                ))}
                            </select>
                            {errors.empGroupId ? (
                                <p className="text-red-500 text-xs mt-1">{errors.empGroupId.message}</p>
                            ) : (
                                <Hint text="varchar(25) emp_group_code / uuid emp_group_id (FK)" />
                            )}
                        </div>

                        <div>
                            <label className={styles.label}>รหัสหัวหน้า</label>
                            <select
                                {...register('empHead')}
                                className={`${styles.input} cursor-pointer`}
                            >
                                <option value="">-- เลือกหัวหน้างาน --</option>
                                {heads.map(head => (
                                    <option key={head.employee_id || head.id} value={String(head.employee_id || head.id)}>
                                        {head.employee_code || '-'} - {head.employee_name || '-'}
                                    </option>
                                ))}
                            </select>
                            <Hint text="varchar(25) emp_head_code / uuid emp_head" />
                        </div>
                    </div>

                    {/* Row 3: ประเภทพนักงาน + เลขผู้เสียภาษี */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>ประเภทพนักงาน</label>
                            <select
                                {...register('empType')}
                                className={`${styles.input} cursor-pointer`}
                            >
                                {EMP_TYPE_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <Hint text="boolean - ประเภทพนักงาน" />
                        </div>

                        <div>
                            <label className={styles.label}>เลขประจำตัวผู้เสียภาษี</label>
                            <input
                                {...register('taxId')}
                                type="text"
                                className={styles.input}
                                onInput={(e) => {
                                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                                }}
                            />
                            <Hint text="varchar(25) - เลขประจำตัวผู้เสียภาษี" />
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════
                    SECTION 4 — วันที่สำคัญ
                ════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={<CalendarDays className="w-4 h-4" />} title="วันที่สำคัญ" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={styles.label}>วันที่เข้างาน</label>
                            <Controller
                                control={control}
                                name="empStartDate"
                                render={({ field }) => (
                                    <CustomDateInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        className={styles.input}
                                    />
                                )}
                            />
                            <Hint text="datetime(8) - วันที่เข้างาน" />
                        </div>

                        <div>
                            <label className={styles.label}>วันที่ลาออก</label>
                            <Controller
                                control={control}
                                name="empResignDate"
                                render={({ field }) => (
                                    <CustomDateInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        className={styles.input}
                                    />
                                )}
                            />
                            <Hint text="datetime(8) - วันที่ลาออก" />
                        </div>

                        <div>
                            <label className={styles.label}>สถานะ</label>
                            <select
                                {...register('empStatus')}
                                className={`${styles.input} cursor-pointer`}
                            >
                                {EMP_STATUS_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <Hint text="boolean - สถานะ" />
                        </div>
                    </div>
                </section>

                {/* ════════════════════════════════════════
                    SECTION 5 — อื่นๆ
                ════════════════════════════════════════ */}
                <section>
                    <SectionHeader icon={<FileText className="w-4 h-4" />} title="อื่นๆ" />

                    {/* ลายเซ็นต์พนักงาน - Multiple Management UI */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className={styles.label}>ลายเซ็นต์พนักงาน</label>
                            {isEdit && (
                                <button
                                    type="button"
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-50"
                                    disabled={isUploading}
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) handleUploadSignature(file);
                                        };
                                        input.click();
                                    }}
                                >
                                    {isUploading ? (
                                        <span className="loading loading-spinner loading-[10px]" aria-hidden="true" />
                                    ) : (
                                        <Plus className="w-3 h-3" aria-hidden="true" />
                                    )}
                                    เพิ่มลายเซ็นต์
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                            {!isEdit ? (
                                <div className="col-span-full py-6 text-center">
                                    <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 italic">กรุณาบันทึกข้อมูลพนักงานก่อนจัดการลายเซ็นต์</p>
                                </div>
                            ) : signatureFields.length === 0 ? (
                                <div className="col-span-full py-8 text-center">
                                    <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 italic">ยังไม่มีลายเซ็นต์ กดปุ่ม "เพิ่มลายเซ็นต์" เพื่อเริ่มอัปโหลด</p>
                                </div>
                            ) : (
                                signatureFields.map((field, index) => (
                                    <div key={field.id} className="relative group bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm transition-all hover:shadow-md">
                                        {/* Preview Area */}
                                        <div className="w-full h-24 rounded-md bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-2">
                                            {field.previewUrl ? (
                                                <img 
                                                    src={field.previewUrl} 
                                                    alt={`Signature ${index + 1}`} 
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : (
                                                <FileText className="w-6 h-6 text-gray-300" />
                                            )}
                                        </div>

                                        {/* Info & Actions */}
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[10px] font-medium text-gray-500 truncate max-w-[100px]">
                                                {`ลายเซ็นต์ #${index + 1}`}
                                            </span>
                                            <button
                                                type="button"
                                                className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors disabled:opacity-50"
                                                disabled={isDeleting}
                                                onClick={() => {
                                                    if (field.emp_signature_id) handleDeleteSignature(field.emp_signature_id);
                                                }}
                                                title="ลบลายเซ็นต์"
                                                aria-label={`ลบลายเซ็นต์ที่ ${index + 1}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Hint text={isEdit ? "จัดการหลายลายเซ็นต์ได้ทันที (ระบบจะบันทึกแยกจากข้อมูลหลัก)" : "ระบบรองรับหลายลายเซ็นต์ แต่ต้องสร้างพนักงานก่อน"} />
                    </div>

                    {/* หมายเหตุ */}
                    <div className="mb-4">
                        <label className={styles.label}>หมายเหตุ</label>
                        <textarea
                            {...register('remark')}
                            rows={3}
                            className={`${styles.input} resize-y`}
                        />
                        <Hint text="varchar(255) - หมายเหตุ" />
                    </div>

                </section>

            </div>
        </DialogFormLayout>
    );
};