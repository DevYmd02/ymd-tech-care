/**
 * @file SalesAreaFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลเขตการขาย (Sales Area/Zone)
 * @module sales
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { SalesZoneService } from '@/modules/master-data/company/services/company.service';
import type { SalesZoneFormData } from '@/modules/master-data/types/master-data-types';

// ====================================================================================
// SCHEMA
// ====================================================================================

const areaSchema = z.object({
    zoneCode: z.string()
        .min(1, 'กรุณากรอกรหัสเขตการขาย')
        .max(20, 'รหัสเขตการขายต้องไม่เกิน 20 ตัวอักษร'),
    zoneName: z.string()
        .min(1, 'กรุณากรอกชื่อเขตการขาย (ไทย)')
        .max(200, 'ชื่อเขตการขายต้องไม่เกิน 200 ตัวอักษร'),
    zoneNameEn: z.string()
        .max(200, 'ชื่อเขตการขาย (Eng) ต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

type AreaFormValues = z.infer<typeof areaSchema>;

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

export function SalesAreaFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue
    } = useForm<AreaFormValues>({
        resolver: zodResolver(areaSchema),
        defaultValues: {
            zoneCode: '',
            zoneName: '',
            zoneNameEn: '',
            isActive: true
        }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchData = async () => {
                    const data = await SalesZoneService.get(editId);
                    if (data) {
                        reset({
                            zoneCode: data.zone_code,
                            zoneName: data.zone_name,
                            zoneNameEn: data.zone_name_en || '',
                            isActive: data.is_active
                        });
                    }
                };
                fetchData();
            } else {
                reset({
                    zoneCode: '',
                    zoneName: '',
                    zoneNameEn: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: AreaFormValues) => {
        try {
            if (editId) {
                await SalesZoneService.update(editId, data);
            } else {
                await SalesZoneService.create(data as SalesZoneFormData);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save sales area:', error);
        }
    };

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <MapPin size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขเขตการขาย' : 'เพิ่มเขตการขายใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Code */}
                <div>
                    <label className={styles.label}>
                        รหัสเขตการขาย <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('zoneCode')}
                        type="text"
                        placeholder="กรอกรหัสเขตการขาย (เช่น AREA-BKK)"
                        className={`${styles.input} ${errors.zoneCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.zoneCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.zoneCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE</p>
                    )}
                </div>

                {/* Name TH */}
                <div>
                    <label className={styles.label}>
                        ชื่อเขตการขาย (ไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('zoneName')}
                        type="text"
                        placeholder="กรอกชื่อเขตการขาย (เช่น กรุงเทพและปริมณฑล)"
                        className={`${styles.input} ${errors.zoneName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.zoneName && (
                        <p className="text-red-500 text-xs mt-1">{errors.zoneName.message}</p>
                    )}
                </div>

                {/* Name EN */}
                <div>
                    <label className={styles.label}>
                        ชื่อเขตการขาย (Eng)
                    </label>
                    <input
                        {...register('zoneNameEn')}
                        type="text"
                        placeholder="e.g. Bangkok and Metropolitan"
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
