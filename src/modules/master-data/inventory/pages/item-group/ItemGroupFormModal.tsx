/**
 * @file ItemGroupFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลกลุ่มสินค้า
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { ItemGroupService } from '../../services/inventory-master.service';

const schema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัส').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อ (ไทย)').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    nameEn: z.string().max(200, 'ชื่อ (EN) ต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function ItemGroupFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, control, setValue } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { code: '', nameTh: '', nameEn: '', isActive: true }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (editId) {
                ItemGroupService.getById(editId).then(existing => {
                    if (existing) {
                        reset({ code: existing.code, nameTh: existing.name_th, nameEn: existing.name_en || '', isActive: existing.is_active });
                    }
                });
            } else {
                reset({ code: '', nameTh: '', nameEn: '', isActive: true });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: FormValues) => {
        try {
            const result = editId ? await ItemGroupService.update(editId, data) : await ItemGroupService.create(data);
            if (result.success) { if (onSuccess) onSuccess(); onClose(); }
            else { alert(result.message || 'เกิดข้อผิดพลาด'); }
        } catch { alert('เกิดข้อผิดพลาดในการบันทึก'); }
    };

    const TitleIcon = <Layers size={24} className="text-white" />;
    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 border border-gray-300"><X size={18} />ยกเลิก</button>
            <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"><Save size={18} />{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
    );

    return (
        <DialogFormLayout isOpen={isOpen} onClose={onClose} title={editId ? 'แก้ไขข้อมูลกลุ่มสินค้า' : 'เพิ่มกลุ่มสินค้าใหม่'} titleIcon={TitleIcon} footer={FormFooter}>
            <div className="p-6 space-y-6">
                <div>
                    <label className={styles.label}>รหัสกลุ่มสินค้า <span className="text-red-500">*</span></label>
                    <input {...register('code')} type="text" placeholder="กรอกรหัส" className={`${styles.input} ${errors.code ? 'border-red-500' : ''}`} />
                    {errors.code ? <p className="text-red-500 text-xs mt-1">{errors.code.message}</p> : <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE</p>}
                </div>
                <div>
                    <label className={styles.label}>ชื่อกลุ่มสินค้า (ไทย) <span className="text-red-500">*</span></label>
                    <input {...register('nameTh')} type="text" placeholder="กรอกชื่อ (ไทย)" className={`${styles.input} ${errors.nameTh ? 'border-red-500' : ''}`} />
                    {errors.nameTh && <p className="text-red-500 text-xs mt-1">{errors.nameTh.message}</p>}
                </div>
                <div>
                    <label className={styles.label}>ชื่อกลุ่มสินค้า (EN)</label>
                    <input {...register('nameEn')} type="text" placeholder="กรอกชื่อ (English)" className={styles.input} />
                </div>
                <div>
                    <label className={styles.label}>สถานะ <span className="text-red-500">*</span></label>
                    <select className={`${styles.input} cursor-pointer`} value={isActive ? 'true' : 'false'} onChange={(e) => setValue('isActive', e.target.value === 'true')}>
                        <option value="true">ใช้งาน (Active)</option>
                        <option value="false">ไม่ใช้งาน (Inactive)</option>
                    </select>
                </div>
            </div>
        </DialogFormLayout>
    );
}


