/**
 * @file LotNoFormModal.tsx
 */
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hash, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { LotNoService } from '@/modules/master-data/inventory/services/inventory-master.service';
import type { LotNoFormData } from '@/modules/master-data/inventory/types/inventory-master.types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';

const schema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัส').max(50),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อ').max(200),
    nameEn: z.string(),
    isActive: z.boolean()
});

type FormValues = z.infer<typeof schema>;
interface Props { isOpen: boolean; onClose: () => void; editId?: number | null; onSuccess?: () => void; }

export function LotNoFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, control, setError, clearErrors } = useForm<FormValues>({ 
        resolver: zodResolver(schema), 
        defaultValues: { code: '', nameTh: '', nameEn: '', isActive: true } 
    });

    const codeValue = useWatch({ control, name: 'code' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['lotno-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return LotNoService.getAll({ code: debouncedCode });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1 && isOpen,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.id !== editId
            );

            if (isDuplicate) {
                setError('code', { type: 'manual', message: 'รหัส Lot No ซ้ำในระบบ' });
            } else if (errors.code?.message === 'รหัส Lot No ซ้ำในระบบ') {
                clearErrors('code');
            }
        }
    }, [duplicateCheckData, debouncedCode, editId, setError, clearErrors, errors.code?.message]);

    useEffect(() => { if (isOpen) { if (editId) LotNoService.getById(editId).then(e => { if (e) reset({ code: e.code, nameTh: e.name_th, nameEn: '', isActive: true }); }); else reset({ code: '', nameTh: '', nameEn: '', isActive: true }); } }, [isOpen, editId, reset]);
    const onSubmit = async (data: FormValues) => { 
        const payload: LotNoFormData = { ...data };
        const result = editId ? await LotNoService.update(editId, payload) : await LotNoService.create(payload); 
        if (result.success) { if (onSuccess) onSuccess(); onClose(); } else alert(result.message); 
    };

    return (
        <DialogFormLayout isOpen={isOpen} onClose={onClose} title={editId ? 'แก้ไข Lot No สินค้า' : 'เพิ่ม Lot No ใหม่'} titleIcon={<Hash size={24} className="text-white" />} footer={<div className="flex justify-end gap-3 p-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 border border-gray-300"><X size={18} />ยกเลิก</button><button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"><Save size={18} />{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button></div>}>
            <div className="p-6 space-y-6">
                <div><label className={styles.label}>รหัส Lot No <span className="text-red-500">*</span></label><input {...register('code')} className={`${styles.input} ${errors.code ? 'border-red-500' : ''}`} placeholder="LOT-2024-001" />{errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}</div>
                <div><label className={styles.label}>ชื่อ Lot No (ไทย) <span className="text-red-500">*</span></label><input {...register('nameTh')} className={`${styles.input} ${errors.nameTh ? 'border-red-500' : ''}`} />{errors.nameTh && <p className="text-red-500 text-xs mt-1">{errors.nameTh.message}</p>}</div>
            </div>
        </DialogFormLayout>
    );
}


