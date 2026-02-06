/**
 * @file BrandFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลยี่ห้อสินค้า
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { BrandService } from '../../services/inventory-master.service';

const schema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัส').max(20),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อ (ไทย)').max(200),
    nameEn: z.string().max(200),
    isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props { isOpen: boolean; onClose: () => void; editId?: string | null; onSuccess?: () => void; }

export function BrandFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, control, setValue } = useForm<FormValues>({
        resolver: zodResolver(schema), defaultValues: { code: '', nameTh: '', nameEn: '', isActive: true }
    });
    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (editId) BrandService.getById(editId).then(existing => { if (existing) reset({ code: existing.code, nameTh: existing.name_th, nameEn: existing.name_en || '', isActive: existing.is_active }); });
            else reset({ code: '', nameTh: '', nameEn: '', isActive: true });
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: FormValues) => {
        const result = editId ? await BrandService.update(editId, data) : await BrandService.create(data);
        if (result.success) { if (onSuccess) onSuccess(); onClose(); } else alert(result.message || 'เกิดข้อผิดพลาด');
    };

    return (
        <DialogFormLayout isOpen={isOpen} onClose={onClose} title={editId ? 'แก้ไขข้อมูลยี่ห้อสินค้า' : 'เพิ่มยี่ห้อสินค้าใหม่'} titleIcon={<Award size={24} className="text-white" />} footer={
            <div className="flex justify-end gap-3 p-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 border border-gray-300"><X size={18} />ยกเลิก</button>
                <button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"><Save size={18} />{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
        }>
            <div className="p-6 space-y-6">
                <div><label className={styles.label}>รหัสยี่ห้อ <span className="text-red-500">*</span></label><input {...register('code')} type="text" placeholder="กรอกรหัส" className={`${styles.input} ${errors.code ? 'border-red-500' : ''}`} />{errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}</div>
                <div><label className={styles.label}>ชื่อยี่ห้อ (ไทย) <span className="text-red-500">*</span></label><input {...register('nameTh')} type="text" placeholder="กรอกชื่อ" className={`${styles.input} ${errors.nameTh ? 'border-red-500' : ''}`} />{errors.nameTh && <p className="text-red-500 text-xs mt-1">{errors.nameTh.message}</p>}</div>
                <div><label className={styles.label}>ชื่อยี่ห้อ (EN)</label><input {...register('nameEn')} type="text" placeholder="กรอกชื่อ (English)" className={styles.input} /></div>
                <div><label className={styles.label}>สถานะ <span className="text-red-500">*</span></label><select className={`${styles.input} cursor-pointer`} value={isActive ? 'true' : 'false'} onChange={(e) => setValue('isActive', e.target.value === 'true')}><option value="true">ใช้งาน (Active)</option><option value="false">ไม่ใช้งาน (Inactive)</option></select></div>
            </div>
        </DialogFormLayout>
    );
}
