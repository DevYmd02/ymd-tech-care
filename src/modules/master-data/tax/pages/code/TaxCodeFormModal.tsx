
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { TaxGroupService } from '@/modules/master-data/tax/services/tax-group.service';
import { DialogFormLayout } from '@ui';

interface TaxCodeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    taxId?: string | null;
    onSuccess: () => void;
}

// Locally extend types to handle properties that are missing in the base types
type ExtendedTaxCode = TaxCode & {
    tax_group_id?: number | null;
    description?: string;
};

export function TaxCodeFormModal({ isOpen, onClose, taxId, onSuccess }: TaxCodeFormModalProps) {
    const isEdit = !!taxId;
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ExtendedTaxCode>();

    const { data: taxGroupsResponse, isLoading: isLoadingTaxGroups } = useQuery({
        queryKey: ['tax-groups-for-select'],
        queryFn: () => TaxGroupService.getTaxGroups(),
        enabled: isOpen,
    });

    const taxGroups = Array.isArray(taxGroupsResponse) ? taxGroupsResponse : [];

    useEffect(() => {
        if (isOpen) {
            if (taxId) {
                setIsLoading(true);
                TaxCodeService.getTaxCodeById(taxId).then((data: any) => {
                    if (data) {
                        setValue('tax_code', data.tax_code);
                        setValue('tax_name', data.tax_name);
                        setValue('description', data.description || '');
                        setValue('tax_group_id', data.tax_group_id);
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
                    description: '',
                    tax_type: 'SALES',
                    tax_group_id: undefined,
                    tax_rate: 0,
                    is_active: true
                } as ExtendedTaxCode);
            }
        }
    }, [isOpen, taxId, setValue, reset]);

    const onSubmit = async (data: ExtendedTaxCode) => {
        setIsLoading(true);
        try {
            if (isEdit && taxId) {
                await TaxCodeService.updateTaxCode(taxId, data as any);
            } else {
                await TaxCodeService.createTaxCode(data as any);
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
            <form id="tax-code-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Tax Code */}
                    <div className="flex flex-col gap-1">
                        <label className={styles.label}>
                            รหัสภาษี (Tax Code) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('tax_code', { required: 'กรุณากรอกรหัสภาษี' })}
                            className={`${styles.input} ${errors.tax_code ? 'border-red-500' : ''}`}
                            placeholder="เช่น VAT-OUT-7"
                        />
                        {errors.tax_code && (
                            <span className="text-red-500 text-xs">{errors.tax_code.message}</span>
                        )}
                    </div>

                    {/* Tax Name */}
                    <div className="flex flex-col gap-1">
                        <label className={styles.label}>
                            ชื่อภาษี (Tax Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('tax_name', { required: 'กรุณากรอกชื่อภาษี' })}
                            className={`${styles.input} ${errors.tax_name ? 'border-red-500' : ''}`}
                            placeholder="เช่น ภาษีขาย 7%"
                        />
                        {errors.tax_name && (
                            <span className="text-red-500 text-xs">{errors.tax_name.message}</span>
                        )}
                    </div>

                    {/* Tax Group */}
                    <div className="md:col-span-2 flex flex-col gap-1">
                        <label className={styles.label}>กลุ่มภาษี (Tax Group)</label>
                        <select
                            {...register('tax_group_id', { setValueAs: v => v ? Number(v) : null })}
                            className={styles.inputSelect}
                            disabled={isLoadingTaxGroups}
                        >
                            <option value="">-- ไม่ระบุ --</option>
                            {taxGroups.map((group: any) => (
                                <option key={group.tax_group_id} value={group.tax_group_id}>
                                    {group.tax_group_name || group.tax_group_code}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 flex flex-col gap-1">
                        <label className={styles.label}>คำอธิบาย (Description)</label>
                        <textarea
                            {...register('description')}
                            className={styles.input}
                            placeholder="คำอธิบายเพิ่มเติม"
                            rows={3}
                        />
                    </div>

                    {/* Tax Type */}
                    <div className="flex flex-col gap-1">
                        <label className={styles.label}>ประเภทภาษี (Tax Type)</label>
                        <select {...register('tax_type')} className={styles.inputSelect}>
                            <option value="SALES">ภาษีขาย</option>
                            <option value="PURCHASE">ภาษีซื้อ</option>
                            <option value="EXEMPT">ยกเว้น</option>
                            <option value="NONE">ไม่คิดอะไร</option>
                        </select>
                    </div>

                    {/* Tax Rate */}
                    <div className="flex flex-col gap-1">
                        <label className={styles.label}>
                            อัตราภาษี (%) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('tax_rate', {
                                required: true,
                                min: 0,
                                setValueAs: v => Number(v)
                            })}
                            className={styles.input}
                        />
                    </div>

                    {/* Active */}
                    <div className="md:col-span-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('is_active')}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                ใช้งาน (Active)
                            </span>
                        </label>
                    </div>

                </div>
            </form>
        </DialogFormLayout>
    );
}
