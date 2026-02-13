/**
 * @file SalesChannelFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลช่องทางการขาย (Sales Channel)
 * @module sales
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { SalesChannelService } from '@/modules/master-data/company/services/company.service';
import type { SalesChannelFormData } from '@/modules/master-data/types/master-data-types';

// ====================================================================================
// SCHEMA
// ====================================================================================

const channelSchema = z.object({
    channelCode: z.string()
        .min(1, 'กรุณากรอกรหัสช่องทางการขาย')
        .max(20, 'รหัสช่องทางการขายต้องไม่เกิน 20 ตัวอักษร'),
    channelName: z.string()
        .min(1, 'กรุณากรอกชื่อช่องทางการขาย (ไทย)')
        .max(200, 'ชื่อช่องทางการขายต้องไม่เกิน 200 ตัวอักษร'),
    channelNameEn: z.string()
        .max(200, 'ชื่อช่องทางการขาย (Eng) ต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

type ChannelFormValues = z.infer<typeof channelSchema>;

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export function SalesChannelFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue
    } = useForm<ChannelFormValues>({
        resolver: zodResolver(channelSchema),
        defaultValues: {
            channelCode: '',
            channelName: '',
            channelNameEn: '',
            isActive: true
        }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchData = async () => {
                    const data = await SalesChannelService.get(editId);
                    if (data) {
                        reset({
                            channelCode: data.channel_code,
                            channelName: data.channel_name,
                            channelNameEn: data.channel_name_en || '',
                            isActive: data.is_active
                        });
                    }
                };
                fetchData();
            } else {
                reset({
                    channelCode: '',
                    channelName: '',
                    channelNameEn: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: ChannelFormValues) => {
        try {
            if (editId) {
                await SalesChannelService.update(editId, data);
            } else {
                await SalesChannelService.create(data as SalesChannelFormData);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save sales channel:', error);
        }
    };

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <Store size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขช่องทางการขาย' : 'เพิ่มช่องทางการขายใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Code */}
                <div>
                    <label className={styles.label}>
                        รหัสช่องทางการขาย <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('channelCode')}
                        type="text"
                        placeholder="กรอกรหัสช่องทางการขาย (เช่น ONLINE)"
                        className={`${styles.input} ${errors.channelCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.channelCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.channelCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE</p>
                    )}
                </div>

                {/* Name TH */}
                <div>
                    <label className={styles.label}>
                        ชื่อช่องทางการขาย (ไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('channelName')}
                        type="text"
                        placeholder="กรอกชื่อช่องทางการขาย (เช่น ขายออนไลน์)"
                        className={`${styles.input} ${errors.channelName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.channelName && (
                        <p className="text-red-500 text-xs mt-1">{errors.channelName.message}</p>
                    )}
                </div>

                {/* Name EN */}
                <div>
                    <label className={styles.label}>
                        ชื่อช่องทางการขาย (Eng)
                    </label>
                    <input
                        {...register('channelNameEn')}
                        type="text"
                        placeholder="e.g. Online Channel"
                        className={styles.input}
                    />
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
                </div>
            </div>
        </DialogFormLayout>
    );
}

