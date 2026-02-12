
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';

interface TaxCodeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    taxId?: string | null;
    onSuccess: () => void;
}

export function TaxCodeFormModal({ isOpen, onClose, taxId, onSuccess }: TaxCodeFormModalProps) {
    const isEdit = !!taxId;
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TaxCode>();

    useEffect(() => {
        if (isOpen) {
            if (taxId) {
                setIsLoading(true);
                TaxService.getTaxCodeById(taxId).then(data => {
                    if (data) {
                        setValue('tax_code', data.tax_code);
                        setValue('tax_name', data.tax_name);
                        setValue('tax_type', data.tax_type);
                        setValue('tax_rate', data.tax_rate);
                        setValue('is_active', data.is_active);
                    }
                    setIsLoading(false);
                });
            } else {
                reset({
                    tax_code: '',
                    tax_name: '',
                    tax_type: 'SALES',
                    tax_rate: 0,
                    is_active: true
                });
            }
        }
    }, [isOpen, taxId, setValue, reset]);

    const onSubmit = async (data: TaxCode) => {
        setIsLoading(true);
        try {
            if (isEdit && taxId) {
                await TaxService.updateTaxCode(taxId, data);
            } else {
                await TaxService.createTaxCode(data);
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
                form="tax-code-form"
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
            title={isEdit ? 'แก้ไขรหัสภาษี' : 'สร้างรหัสภาษีใหม่'}
            footer={footer}
            isLoading={isLoading}
        >
             <form id="tax-code-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={styles.label}>รหัสภาษี (Tax Code) <span className="text-red-500">*</span></label>
                        <input 
                            {...register('tax_code', { required: 'กรุณากรอกรหัสภาษี' })}
                            className={`${styles.input} ${errors.tax_code ? 'border-red-500' : ''}`}
                            placeholder="เช่น VAT-OUT-7"
                        />
                        {errors.tax_code && <span className="text-red-500 text-xs">{errors.tax_code.message}</span>}
                    </div>
                    <div>
                        <label className={styles.label}>ชื่อภาษี (Tax Name) <span className="text-red-500">*</span></label>
                        <input 
                            {...register('tax_name', { required: 'กรุณากรอกชื่อภาษี' })}
                            className={`${styles.input} ${errors.tax_name ? 'border-red-500' : ''}`}
                            placeholder="เช่น ภาษีขาย 7%"
                        />
                         {errors.tax_name && <span className="text-red-500 text-xs">{errors.tax_name.message}</span>}
                    </div>
                    <div>
                        <label className={styles.label}>ประเภทภาษี (Tax Type)</label>
                        <select {...register('tax_type')} className={styles.inputSelect}>
                            <option value="SALES">ภาษีขาย</option>
                            <option value="PURCHASE">ภาษีซื้อ</option>
                            <option value="EXEMPT">ยกเว้น</option>
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
