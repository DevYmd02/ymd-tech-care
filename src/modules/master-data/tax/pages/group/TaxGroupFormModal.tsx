import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { TaxGroup } from '@/modules/master-data/tax/types/tax-types';
import { TaxGroupService } from '@/modules/master-data/tax/services/tax-group.service';
import { DialogFormLayout } from '@ui';

interface TaxGroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | number | null;
    initialData?: TaxGroup | null;
    onSuccess: () => void;
}

type TaxGroupFormValues = {
    tax_group_code: string;
    tax_type: TaxGroup['tax_type'];
    tax_rate: number;
    description?: string;
    is_active: boolean;
};

export function TaxGroupFormModal({ isOpen, onClose, editId, initialData, onSuccess }: TaxGroupFormModalProps) {
    const isEdit = !!editId;
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TaxGroupFormValues>();

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            reset({
                tax_group_code: initialData.tax_group_code || '',
                tax_type: initialData.tax_type || '',
                tax_rate: initialData.tax_rate ?? 0,
                description: initialData.description || '',
                is_active: initialData.is_active ?? true
            });
            return;
        }

        if (editId) {
            setIsLoading(true);
            TaxGroupService.getTaxGroupById(String(editId)).then(data => {
                if (data) {
                    setValue('tax_group_code', data.tax_group_code);
                    setValue('tax_type', data.tax_type);
                    setValue('tax_rate', data.tax_rate);
                    setValue('description', data.description || '');
                    setValue('is_active', data.is_active);
                }
                setIsLoading(false);
            });
        } else {
            reset({
                tax_group_code: '',
                tax_type: 'NONE',
                tax_rate: 0,
                description: '',
                is_active: true
            });
        }
    }, [isOpen, editId, initialData, reset, setValue]);

    const onSubmit = async (data: TaxGroupFormValues) => {
        setIsLoading(true);
        try {
            if (isEdit && editId) {
                await TaxGroupService.updateTaxGroup(String(editId), data);
            } else {
                await TaxGroupService.createTaxGroup(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <button
                type="button"
                onClick={onClose}
                className={styles.btnSecondary}
            >
                ยกเลิก
            </button>
            <button
                type="submit"
                form="tax-group-form"
                disabled={isLoading}
                className={styles.btnPrimary}
            >
                <div className="flex items-center gap-2">
                    <Save size={18} />
                    {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                </div>
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'แก้ไขกลุ่มภาษี' : 'สร้างกลุ่มภาษีใหม่'}
            footer={footer}
            isLoading={isLoading}
        >
            <form id="tax-group-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={styles.label}>รหัสกลุ่มภาษี (Tax Group Code) <span className="text-red-500">*</span></label>
                        <input
                            {...register('tax_group_code', { required: 'กรุณากรอกรหัสกลุ่มภาษี' })}
                            className={`${styles.input} ${errors.tax_group_code ? 'border-red-500' : ''}`}
                            placeholder="เช่น TG-VAT-7"
                        />
                        {errors.tax_group_code && <span className="text-red-500 text-xs">{errors.tax_group_code.message}</span>}
                    </div>
                    <div>
                        <label className={styles.label}>ประเภทภาษี (Tax Type)</label>
                        <select {...register('tax_type')} className={styles.input}>
                            <option value="NONE">ไม่คิดภาษี</option>
                            <option value="EXCLUDE">แยกนอก</option>
                            <option value="INCLUDE">รวมใน</option>
                        </select>
                    </div>
                    <div>
                        <label className={styles.label}>อัตราภาษี (%) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('tax_rate', { required: true, min: 0, valueAsNumber: true })}
                            className={styles.input}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className={styles.label}>คำอธิบาย</label>
                        <input
                            {...register('description')}
                            className={styles.input}
                            placeholder="กรอกคำอธิบาย"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('is_active')}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">ใช้งาน (Active)</span>
                        </label>
                    </div>
                </div>
            </form>
        </DialogFormLayout>
    );
}
