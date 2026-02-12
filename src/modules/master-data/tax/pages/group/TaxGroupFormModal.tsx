
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { TaxGroup } from '@/modules/master-data/tax/types/tax-types';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';

interface TaxGroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId?: string | null;
    onSuccess: () => void;
}

export function TaxGroupFormModal({ isOpen, onClose, groupId, onSuccess }: TaxGroupFormModalProps) {
    const isEdit = !!groupId;
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TaxGroup>();

    useEffect(() => {
        if (isOpen) {
             if (groupId) {
                setIsLoading(true);
                TaxService.getTaxGroupById(groupId).then(data => {
                    if (data) {
                        setValue('tax_group_code', data.tax_group_code);
                        setValue('tax_type', data.tax_type);
                        setValue('tax_rate', data.tax_rate);
                        setValue('is_active', data.is_active);
                    }
                    setIsLoading(false);
                });
            } else {
                reset({
                    tax_group_code: '',
                    tax_type: 'TAX_CODE',
                    tax_rate: 0,
                    is_active: true
                });
            }
        }
    }, [isOpen, groupId, setValue, reset]);

    const onSubmit = async (data: TaxGroup) => {
        setIsLoading(true);
        try {
             if (isEdit && groupId) {
                await TaxService.updateTaxGroup(groupId, data);
            } else {
                await TaxService.createTaxGroup(data);
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
                        <select {...register('tax_type')} className={styles.inputSelect}>
                            <option value="TAX_CODE">รหัสภาษี</option>
                            <option value="LUMP_SUM">เหมาภาษี</option>
                            <option value="NONE">ไม่คิดอะไร</option>
                        </select>
                    </div>
                     <div>
                         <label className={styles.label}>อัตราภาษี (%) <span className="text-red-500">*</span></label>
                        <input 
                            type="number"
                             step="0.01"
                            {...register('tax_rate', { required: true, min: 0 })}
                            className={styles.input}
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
