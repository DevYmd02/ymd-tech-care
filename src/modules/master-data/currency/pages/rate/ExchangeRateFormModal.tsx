/**
 * @file ExchangeRateFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลอัตราแลกเปลี่ยน (Exchange Rate Master Data)
 * @module currency
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrendingUp, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';
import { DialogFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';
import { exchangeRateSchema, type ExchangeRateFormValues, type Currency, type ExchangeRateType, type ExchangeRate } from '@currency/types/currency-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function ExchangeRateFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [rateTypes, setRateTypes] = useState<ExchangeRateType[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control
    } = useForm<ExchangeRateFormValues>({
        resolver: zodResolver(exchangeRateSchema),
        defaultValues: {
            currencyId: '',
            currencyTypeId: '',
            rateDate: new Date().toISOString().split('T')[0],
            buyRate: 0,
            saleRate: 0,
            allowAdjust: 0,
            exchangeRound: 2,
            remark: '',
            isActive: true
        }
    });

    const isActive = useWatch({
        control,
        name: 'isActive',
    });

    // Load Options
    useEffect(() => {
        if (isOpen) {
            const fetchOptions = async () => {
                setIsLoadingOptions(true);
                try {
                    const [currRes, typeRes] = await Promise.all([
                        CurrencyService.getCurrencies(),
                        CurrencyService.getExchangeRateTypes()
                    ]);
                    setCurrencies(currRes.items.filter((c: Currency) => c.is_active));
                    setRateTypes(typeRes.items.filter((t: ExchangeRateType) => t.is_active));
                } catch (error) {
                    logger.error('[ExchangeRateFormModal] Error fetching options:', error);
                } finally {
                    setIsLoadingOptions(false);
                }
            };
            fetchOptions();
        }
    }, [isOpen]);

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                CurrencyService.getExchangeRateById(editId).then((existing: ExchangeRate | null) => {
                    if (existing) {
                        reset({
                            currencyId: existing.currency_id,
                            currencyTypeId: existing.currency_type_id,
                            rateDate: existing.rate_date.split('T')[0],
                            buyRate: existing.buy_rate,
                            saleRate: existing.sale_rate,
                            allowAdjust: existing.allow_adjust,
                            fee: existing.fee || 0,
                            exchangeRound: existing.exchange_round,
                            remark: existing.remark || '',
                            isActive: existing.is_active
                        });
                    }
                });
            } else {
                reset({
                    currencyId: '',
                    currencyTypeId: '',
                    rateDate: new Date().toISOString().split('T')[0],
                    buyRate: 0,
                    saleRate: 0,
                    allowAdjust: 0,
                    fee: 0,
                    exchangeRound: 2,
                    remark: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: ExchangeRateFormValues) => {
        try {
            let res;
            const payload = {
                currency_id: data.currencyId,
                currency_type_id: data.currencyTypeId,
                rate_date: data.rateDate,
                buy_rate: data.buyRate,
                sale_rate: data.saleRate,
                allow_adjust: data.allowAdjust,
                fee: data.fee || 0,
                exchange_round: data.exchangeRound,
                remark: data.remark || '',
                is_active: data.isActive
            };

            if (editId) {
                res = await CurrencyService.updateExchangeRate(editId, payload);
            } else {
                res = await CurrencyService.createExchangeRate(payload);
            }

            if (res.success) {
                logger.log('Saved Exchange Rate:', data);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(res.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (error) {
            logger.error('Error saving exchange rate:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <TrendingUp size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขข้อมูลอัตราแลกเปลี่ยน' : 'เพิ่มอัตราแลกเปลี่ยนใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                    {/* Currency */}
                    <div>
                        <label className={styles.label}>
                            สกุลเงิน <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('currencyId')}
                            disabled={isLoadingOptions}
                            className={`${styles.input} ${errors.currencyId ? 'border-red-500 focus:ring-red-200' : ''}`}
                        >
                            <option value="">-- เลือกสกุลเงิน --</option>
                            {currencies.map(c => (
                                <option key={c.currency_id} value={c.currency_id}>
                                    {c.currency_code} - {c.name_th}
                                </option>
                            ))}
                        </select>
                        {errors.currencyId && <p className="text-red-500 text-xs mt-1">{errors.currencyId.message}</p>}
                        <p className="text-gray-400 text-xs mt-1 text-[10px]">uuid, FK→currency_master, PK - สามารถเว้นว่างได้</p>
                    </div>

                    {/* Rate Type */}
                    <div>
                        <label className={styles.label}>
                            ประเภทอัตราแลกเปลี่ยน <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('currencyTypeId')}
                            disabled={isLoadingOptions}
                            className={`${styles.input} ${errors.currencyTypeId ? 'border-red-500 focus:ring-red-200' : ''}`}
                        >
                            <option value="">-- เลือกประเภทอัตราแลกเปลี่ยน --</option>
                            {rateTypes.map(t => (
                                <option key={t.currency_type_id} value={t.currency_type_id}>
                                    {t.code} - {t.name_th}
                                </option>
                            ))}
                        </select>
                        {errors.currencyTypeId && <p className="text-red-500 text-xs mt-1">{errors.currencyTypeId.message}</p>}
                        <p className="text-gray-400 text-xs mt-1 text-[10px]">uuid, PK - สามารถเว้นว่างได้</p>
                    </div>
                </div>

                {/* Rate Date */}
                <div>
                    <label className={styles.label}>
                        วันที่อัตรา <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('rateDate')}
                        type="date"
                        className={`${styles.input} ${errors.rateDate ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.rateDate && <p className="text-red-500 text-xs mt-1">{errors.rateDate.message}</p>}
                    <p className="text-gray-400 text-xs mt-1 text-[10px]">datetime(8) - ห้ามเว้นว่าง</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Buy Rate */}
                    <div>
                        <label className={styles.label}>
                            อัตราซื้อ (Buy Rate) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('buyRate', { valueAsNumber: true })}
                            type="number"
                            step="0.0001"
                            placeholder="0"
                            className={`${styles.input} ${errors.buyRate ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.buyRate && <p className="text-red-500 text-xs mt-1">{errors.buyRate.message}</p>}
                        <p className="text-gray-400 text-xs mt-1 text-[10px]">float(8) - ห้ามเว้นว่าง</p>
                    </div>

                    {/* Sale Rate */}
                    <div>
                        <label className={styles.label}>
                            อัตราขาย (Sale Rate) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('saleRate', { valueAsNumber: true })}
                            type="number"
                            step="0.0001"
                            placeholder="0"
                            className={`${styles.input} ${errors.saleRate ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.saleRate && <p className="text-red-500 text-xs mt-1">{errors.saleRate.message}</p>}
                        <p className="text-gray-400 text-xs mt-1 text-[10px]">float(8) - ห้ามเว้นว่าง</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Allow Adjust */}
                    <div>
                        <label className={styles.label}>
                            อนุญาตปรับ (Allow Adjust) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('allowAdjust', { valueAsNumber: true })}
                            type="number"
                            step="0.0001"
                            placeholder="0"
                            className={`${styles.input} ${errors.allowAdjust ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.allowAdjust && <p className="text-red-500 text-xs mt-1">{errors.allowAdjust.message}</p>}
                        <p className="text-gray-400 text-xs mt-1 text-[10px]">float(8) - ห้ามเว้นว่าง</p>
                    </div>

                    {/* Fee (New Field) */}
                    <div>
                        <label className={styles.label}>
                            ค่าธรรมเนียม (Fee)
                        </label>
                        <input
                            {...register('fee', { valueAsNumber: true })}
                            type="number"
                            step="0.0001"
                            placeholder="0"
                            className={`${styles.input} ${errors.fee ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                         {errors.fee && <p className="text-red-500 text-xs mt-1">{errors.fee.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* exchange_round (Decimal Places) */}
                    <div>
                        <label className={styles.label}>
                            วิธีจัดอัตราแลกเปลี่ยน (ทศนิยม) <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('exchangeRound')}
                            className={`${styles.input} ${errors.exchangeRound ? 'border-red-500 focus:ring-red-200' : ''}`}
                        >
                            <option value="2">2 ตำแหน่ง</option>
                            <option value="4">4 ตำแหน่ง</option>
                            <option value="6">6 ตำแหน่ง</option>
                        </select>
                        {errors.exchangeRound && <p className="text-red-500 text-xs mt-1">{errors.exchangeRound.message}</p>}
                        <p className="text-gray-400 text-xs mt-1 text-[10px]">smallint(2) - ห้ามเว้นว่าง</p>
                    </div>
                </div>

                {/* Remark */}
                <div>
                    <label className={styles.label}>
                        หมายเหตุ (Remark)
                    </label>
                    <textarea
                        {...register('remark')}
                        placeholder="กรอกหมายเหตุ (ถ้ามี)"
                        className={`${styles.input} min-h-[80px]`}
                    />
                    {errors.remark && <p className="text-red-500 text-xs mt-1">{errors.remark.message}</p>}
                    <p className="text-gray-400 text-xs mt-1 text-[10px]">varchar(255) - สามารถเว้นว่างได้</p>
                </div>

                {/* Status */}
                <div>
                    <label className={styles.label}>
                        สถานะ <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={`${styles.input} cursor-pointer`}
                        value={isActive ? 'true' : 'false'}
                        onChange={(e) => setValue('isActive', e.target.value === 'true')}
                    >
                        <option value="true">ใช้งาน (Active)</option>
                        <option value="false">ไม่ใช้งาน (Inactive)</option>
                    </select>
                    <p className="text-gray-400 text-xs mt-1 text-[10px]">boolean, default TRUE</p>
                </div>
            </div>
        </DialogFormLayout>
    );
}


