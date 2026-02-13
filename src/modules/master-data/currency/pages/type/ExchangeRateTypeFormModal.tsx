/**
 * @file ExchangeRateTypeFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลประเภทอัตราแลกเปลี่ยน (Exchange Rate Type Master Data)
 * @module currency
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layers, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { CurrencyService } from '../../services/currency.service';
import { DialogFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';
import { exchangeRateTypeSchema, type ExchangeRateTypeFormValues, type ExchangeRateType } from '../../../types/currency-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function ExchangeRateTypeFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control
    } = useForm<ExchangeRateTypeFormValues>({
        resolver: zodResolver(exchangeRateTypeSchema),
        defaultValues: {
            code: '',
            nameTh: '',
            nameEn: '',
            isActive: true
        }
    });

    const isActiveToggle = useWatch({
        control,
        name: 'isActive',
    });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                CurrencyService.getExchangeRateTypeById(editId).then((existing: ExchangeRateType | null) => {
                    if (existing) {
                        reset({
                            code: existing.code,
                            nameTh: existing.name_th,
                            nameEn: existing.name_en,
                            isActive: existing.is_active
                        });
                    }
                });
            } else {
                reset({
                    code: '',
                    nameTh: '',
                    nameEn: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: ExchangeRateTypeFormValues) => {
        try {
            let res;
            const payload = {
                code: data.code,
                name_th: data.nameTh,
                name_en: data.nameEn,
                is_active: data.isActive
            };

            if (editId) {
                res = await CurrencyService.updateExchangeRateType(editId, payload);
            } else {
                res = await CurrencyService.createExchangeRateType(payload);
            }

            if (res.success) {
                logger.log('Saved Exchange Rate Type:', data);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(res.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (error) {
            logger.error('Error saving rate type:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <Layers size={24} className="text-white" />;

    // Footer Actions
    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={onClose}
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
            onClose={onClose}
            title={editId ? 'แก้ไขข้อมูลประเภทอัตราแลกเปลี่ยน' : 'เพิ่มประเภทอัตราแลกเปลี่ยนใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Code */}
                <div>
                    <label className={styles.label}>
                        รหัสประเภทอัตราแลกเปลี่ยน <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('code')}
                        type="text"
                        placeholder="กรอกรหัสประเภทอัตราแลกเปลี่ยน (เช่น SPOT, FORWARD)"
                        className={`${styles.input} ${errors.code ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.code ? (
                        <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(30) - ห้ามเว้นว่าง (ไม่ซ้ำ)</p>
                    )}
                </div>

                {/* Name TH */}
                <div>
                    <label className={styles.label}>
                        ชื่อประเภทอัตราแลกเปลี่ยน <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('nameTh')}
                        type="text"
                        placeholder="กรอกชื่อประเภทอัตราแลกเปลี่ยน (ภาษาไทย)"
                        className={`${styles.input} ${errors.nameTh ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.nameTh ? (
                        <p className="text-red-500 text-xs mt-1">{errors.nameTh.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(200) - ห้ามเว้นว่าง</p>
                    )}
                </div>

                {/* Name EN */}
                <div>
                    <label className={styles.label}>
                        ชื่อประเภทอัตราแลกเปลี่ยน (EN) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('nameEn')}
                        type="text"
                        placeholder="Enter exchange rate type name in English"
                        className={`${styles.input} ${errors.nameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.nameEn ? (
                        <p className="text-red-500 text-xs mt-1">{errors.nameEn.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(200) - ห้ามเว้นว่าง</p>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className={styles.label}>
                        สถานะ <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={`${styles.input} cursor-pointer`}
                        value={isActiveToggle ? 'true' : 'false'}
                        onChange={(e) => setValue('isActive', e.target.value === 'true')}
                    >
                        <option value="true">ใช้งาน (Active)</option>
                        <option value="false">ไม่ใช้งาน (Inactive)</option>
                    </select>
                    <p className="text-gray-400 text-xs mt-1">boolean, default TRUE</p>
                </div>
            </div>
        </DialogFormLayout>
    );
}


