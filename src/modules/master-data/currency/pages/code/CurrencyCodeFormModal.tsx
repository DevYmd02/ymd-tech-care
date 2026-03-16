/**
 * @file CurrencyFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลสกุลเงิน (Currency Master Data)
 * @module currency
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Coins, Save, X, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';
import { DialogFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

interface FormValues {
    code: string;
    name_th: string;
    exchange_rate: string | number;
    is_active: boolean;
}

export function CurrencyFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<FormValues>({
        defaultValues: {
            code: '',
            name_th: '',
            exchange_rate: '',
            is_active: true
        }
    });

    const clearForm = () => {
        reset({
            code: '',
            name_th: '',
            exchange_rate: '',
            is_active: true
        });
    };

    useEffect(() => {
        if (isOpen) {
            if (editId) {
                CurrencyService.getById(editId).then((existing: any) => {
                    if (existing) {
                        reset({
                            code: existing.code || '',
                            name_th: existing.name_th || '',
                            exchange_rate: existing.exchange_rate || '',
                            is_active: existing.is_active ?? true
                        });
                    }
                });
            } else {
                clearForm();
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: FormValues) => {
        try {
            const payload = {
                code: data.code,
                name_th: data.name_th,
                exchange_rate: data.exchange_rate,
                is_active: data.is_active
            };

            let res;
            if (editId) {
                res = await CurrencyService.update(editId, payload);
            } else {
                res = await CurrencyService.create(payload);
            }

            if (res.success) {
                logger.log('Saved Currency:', data);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(res.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (error) {
            logger.error('Error saving currency:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const TitleIcon = <Coins size={24} className="text-white" />;

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <RotateCcw size={18} />
                ล้างฟอร์ม
            </button>

            <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <X size={18} />
                ยกเลิก
            </button>

            <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={editId ? 'แก้ไขข้อมูลสกุลเงิน' : 'เพิ่มสกุลเงินใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Code */}
                    <div>
                        <label className={styles.label}>
                            รหัสสกุลเงิน <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('code', { required: 'กรุณากรอกรหัสสกุลเงิน' })}
                            type="text"
                            placeholder="เช่น THB, USD"
                            className={`${styles.input} ${errors.code ? 'border-red-500' : ''}`}
                        />

                        {errors.code ? (
                            <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
                        ) : (
                            <p className="text-gray-400 text-xs mt-1">varchar(3) - ISO Currency Code</p>
                        )}
                    </div>

                    {/* Active */}
                    <div className="flex items-end pb-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 w-full">
                            <input
                                {...register('is_active')}
                                type="checkbox"
                                id="currency_is_active"
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label
                                htmlFor="currency_is_active"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                                สถานะใช้งาน (Active)
                            </label>
                        </div>
                    </div>

                </div>

                {/* Name */}
                <div>
                    <label className={styles.label}>
                        ชื่อสกุลเงิน <span className="text-red-500">*</span>
                    </label>

                    <input
                        {...register('name_th', { required: 'กรุณากรอกชื่อสกุลเงิน' })}
                        type="text"
                        placeholder="กรอกชื่อสกุลเงิน"
                        className={`${styles.input} ${errors.name_th ? 'border-red-500' : ''}`}
                    />

                    {errors.name_th && (
                        <p className="text-red-500 text-xs mt-1">{errors.name_th.message}</p>
                    )}
                </div>

                {/* Exchange Rate */}
                <div>
                    <label className={styles.label}>
                        อัตราแลกเปลี่ยน <span className="text-red-500">*</span>
                    </label>

                    <input
                        {...register('exchange_rate', { required: 'กรุณากรอกอัตราแลกเปลี่ยน' })}
                        type="number"
                        step="0.01"
                        placeholder="กรอกอัตราแลกเปลี่ยน"
                        className={`${styles.input} ${errors.exchange_rate ? 'border-red-500' : ''}`}
                    />

                    {errors.exchange_rate && (
                        <p className="text-red-500 text-xs mt-1">{errors.exchange_rate.message}</p>
                    )}
                </div>

            </div>
        </DialogFormLayout>
    );
}
