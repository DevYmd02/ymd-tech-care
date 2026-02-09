/**
 * @file GradeFormModal.tsx
 */
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { GradeService } from '../../services/inventory-master.service';

const schema = z.object({ code: z.string().min(1, 'กรุณากรอกรหัส').max(20), nameTh: z.string().min(1, 'กรุณากรอกชื่อ').max(200), nameEn: z.string().max(200), isActive: z.boolean() });
type FormValues = z.infer<typeof schema>;
interface Props { isOpen: boolean; onClose: () => void; editId?: string | null; onSuccess?: () => void; }

export function GradeFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, control, setValue } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { code: '', nameTh: '', nameEn: '', isActive: true } });
    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => { if (isOpen) { if (editId) GradeService.getById(editId).then(e => { if (e) reset({ code: e.code, nameTh: e.name_th, nameEn: e.name_en || '', isActive: e.is_active }); }); else reset({ code: '', nameTh: '', nameEn: '', isActive: true }); } }, [isOpen, editId, reset]);
    const onSubmit = async (data: FormValues) => { const result = editId ? await GradeService.update(editId, data) : await GradeService.create(data); if (result.success) { if (onSuccess) onSuccess(); onClose(); } else alert(result.message); };

    return (
        <DialogFormLayout isOpen={isOpen} onClose={onClose} title={editId ? 'แก้ไขเกรดสินค้า' : 'เพิ่มเกรดใหม่'} titleIcon={<Star size={24} className="text-white" />} footer={<div className="flex justify-end gap-3 p-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 border border-gray-300"><X size={18} />ยกเลิก</button><button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"><Save size={18} />{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>}>
            <div className="p-6 space-y-6">
                <div><label className={styles.label}>รหัสเกรด <span className="text-red-500">*</span></label><input {...register('code')} className={`${styles.input} ${errors.code ? 'border-red-500' : ''}`} />{errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}</div>
                <div><label className={styles.label}>ชื่อเกรด (ไทย) <span className="text-red-500">*</span></label><input {...register('nameTh')} className={`${styles.input} ${errors.nameTh ? 'border-red-500' : ''}`} />{errors.nameTh && <p className="text-red-500 text-xs mt-1">{errors.nameTh.message}</p>}</div>
                <div><label className={styles.label}>ชื่อเกรด (EN)</label><input {...register('nameEn')} className={styles.input} /></div>
                <div><label className={styles.label}>สถานะ</label><select className={`${styles.input} cursor-pointer`} value={isActive ? 'true' : 'false'} onChange={(e) => setValue('isActive', e.target.value === 'true')}><option value="true">ใช้งาน</option><option value="false">ไม่ใช้งาน</option></select></div>
            </div>
        </DialogFormLayout>
    );
}
