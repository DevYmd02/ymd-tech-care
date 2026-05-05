/**
 * @file EmployeeFormModal.tsx
 * @description Modal for creating/editing Employee data — full field set matching M16 schema
 */

import { useWatch } from 'react-hook-form';
import { Save, X, User, MapPin, Building2, CalendarDays, FileText, Plus, Trash2 } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useEmployeeForm } from './hooks/useEmployeeForm';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: number | null;
}

// ─── Options ────────────────────────────────────────────────────────────────

const THAI_TITLE_OPTIONS = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'อื่นๆ'];
const ENG_TITLE_OPTIONS  = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Other'];

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
        sides,
        positions,
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

    const isActive = useWatch({ control, name: 'isActive' });

    // ── Footer ──────────────────────────────────────────────────────────────
    const FormFooter = (
        <div className="flex justify-end gap-3 px-6 py-4">
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
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มรหัสพนักงานใหม่'}
            titleIcon={<User className="w-5 h-5 text-white" />}
            footer={FormFooter}
        >
            <div className="p-6 space-y-8">

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
                                placeholder="EMP-001"
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
                            <label className={styles.label}>เลขประจำตัวประชาชน</label>
                            <input
                                {...register('taxIdCard')}
                                type="text"
                                placeholder="1234567890123"
                                className={styles.input}
                            />
                            <Hint text="varchar(25) - เลขประจำตัวประชาชน" />
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
                                placeholder="สมชาย ใจดี"
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
                                placeholder="Somchai Jaidee"
                                className={styles.input}
                            />
                            <Hint text="varchar(255) - ชื่อพนักงาน (Eng)" />
                        </div>
                    </div>

                    {/* Row 4: โทรศัพท์ + Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>โทรศัพท์</label>
                            <input
                                {...register('tel')}
                                type="text"
                                placeholder="081-234-5678"
                                className={styles.input}
                            />
                            <Hint text="varchar(255) - โทรศัพท์" />
                        </div>

                        <div>
                            <label className={styles.label}>E-Mail</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="employee@company.com"
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
                        <label className={styles.label}>ที่อยู่</label>
                        <textarea
                            {...register('address')}
                            rows={3}
                            placeholder="123 ถนน..."
                            className={`${styles.input} resize-y`}
                        />
                        <Hint text="text - ที่อยู่" />
                    </div>

                    {/* ตำบล อำเภอ จังหวัด รหัสไปรษณีย์ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={styles.label}>ตำบล</label>
                            <input
                                {...register('district')}
                                type="text"
                                placeholder="คลองเดย"
                                className={styles.input}
                            />
                            <Hint text="varchar(100) - ตำบล" />
                        </div>

                        <div>
                            <label className={styles.label}>อำเภอ</label>
                            <input
                                {...register('amphur')}
                                type="text"
                                placeholder="คลองเดย"
                                className={styles.input}
                            />
                            <Hint text="varchar(100) - อำเภอ" />
                        </div>

                        <div>
                            <label className={styles.label}>จังหวัด</label>
                            <input
                                {...register('province')}
                                type="text"
                                placeholder="กรุงเทพมหานคร"
                                className={styles.input}
                            />
                            <Hint text="varchar(100) - จังหวัด" />
                        </div>

                        <div>
                            <label className={styles.label}>รหัสไปรษณีย์</label>
                            <input
                                {...register('postCode')}
                                type="text"
                                placeholder="10110"
                                className={styles.input}
                            />
                            <Hint text="varchar(25) - รหัสไปรษณีย์" />
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
                            <label className={styles.label}>แผนก</label>
                            <select
                                {...register('deptId')}
                                className={`${styles.input} cursor-pointer`}
                            >
                                <option value="">-- เลือกแผนก --</option>
                                {sides.map(side => (
                                    <option
                                        key={side.side_id || side.department_id || side.emp_side_id}
                                        value={String(side.side_id || side.department_id || side.emp_side_id || '')}
                                    >
                                        {side.emp_side_code || side.side_code || side.department_code || '-'} -{' '}
                                        {side.emp_side_name || side.side_name || side.department_name || '-'}
                                    </option>
                                ))}
                            </select>
                            <Hint text="varchar(25) dept_code / uuid dept_id (FK)" />
                        </div>

                        {/* ตำแหน่ง */}
                        <div>
                            <label className={styles.label}>ตำแหน่ง</label>
                            <select
                                {...register('postId')}
                                className={`${styles.input} cursor-pointer`}
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
                            <Hint text="varchar(25) position_code / uuid post_id (FK)" />
                        </div>
                    </div>

                    {/* Row 2: กลุ่มพนักงาน + รหัสหัวหน้า */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className={styles.label}>กลุ่มพนักงาน</label>
                            <select
                                {...register('empGroupId')}
                                className={`${styles.input} cursor-pointer`}
                            >
                                <option value="">-- เลือกกลุ่มพนักงาน --</option>
                                {/* TODO: populate from emp-group API */}
                            </select>
                            <Hint text="varchar(25) emp_group_code / uuid emp_group_id (FK)" />
                        </div>

                        <div>
                            <label className={styles.label}>รหัสหัวหน้า</label>
                            <input
                                {...register('empHeadCode')}
                                type="text"
                                placeholder="EMP-001"
                                className={styles.input}
                            />
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
                                placeholder="TAX-001"
                                className={styles.input}
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
                            <input
                                {...register('empStartDate')}
                                type="date"
                                className={styles.input}
                            />
                            <Hint text="datetime(8) - วันที่เข้างาน" />
                        </div>

                        <div>
                            <label className={styles.label}>วันที่ลาออก</label>
                            <input
                                {...register('empResignDate')}
                                type="date"
                                className={styles.input}
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
                                        <span className="loading loading-spinner loading-[10px]" />
                                    ) : (
                                        <Plus className="w-3 h-3" />
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
                                                    if (field.id) handleDeleteSignature(field.id);
                                                }}
                                                title="ลบลายเซ็นต์"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
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
                            placeholder="หมายเหตุ..."
                            className={`${styles.input} resize-y`}
                        />
                        <Hint text="varchar(255) - หมายเหตุ" />
                    </div>

                    {/* Active status toggle */}
                    <div>
                        <label className={styles.label}>
                            สถานะการใช้งาน <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={`${styles.input} cursor-pointer`}
                            value={isActive ? 'true' : 'false'}
                            onChange={(e) => setValue('isActive', e.target.value === 'true')}
                        >
                            <option value="true">ใช้งาน (Active)</option>
                            <option value="false">ไม่ใช้งาน (Inactive)</option>
                        </select>
                    </div>
                </section>

            </div>
        </DialogFormLayout>
    );
};