import React, { useState } from 'react';
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormGetValues } from 'react-hook-form';
import { Plus, Trash2, ScanBarcode, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import type { ItemFormData } from '../hooks/useItemForm';
import { UOMPickerModal, type UOMPickerItem } from '@ui';

interface Props {
    control: Control<ItemFormData>;
    register: UseFormRegister<ItemFormData>;
    setValue: UseFormSetValue<ItemFormData>;
    getValues: UseFormGetValues<ItemFormData>;
    errors: FieldErrors<ItemFormData>;
    /** UOM Conversion items ของ item นี้ — ใช้ใน picker แทน standard units */
    uomConversions: UOMPickerItem[];
    editId?: number | null;
    onSave?: () => void;
    isSaving?: boolean;
}

export const ItemBarcodeFieldArray: React.FC<Props> = ({
    control,
    register,
    setValue,
    getValues,
    errors,
    uomConversions = [],
    editId,
    onSave,
    isSaving = false,
}) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'barcodes',
    });

    // ควบคุมว่า row ไหน (index) กำลังเปิด UOM Picker อยู่
    const [openPickerIndex, setOpenPickerIndex] = useState<number | null>(null);

    // Subscribe to barcodes array เพื่อ force re-render และ get live values
    const watchedBarcodes = useWatch({
        control,
        name: 'barcodes',
    }) || [];

    // Handle การเลือกหน่วยนับจาก Picker
    const handleUOMSelect = (pickerItem: UOMPickerItem) => {
        if (openPickerIndex === null) return;
        // เก็บ from_unit_id ใน form (save mutation จะ resolve เป็น conversion_id อัตโนมัติ)
        setValue(`barcodes.${openPickerIndex}.item_uom_id`, pickerItem.from_unit_id, {
            shouldDirty: true,
            shouldValidate: true,
        });

        // ถ้าใน UOM ที่เลือกมีบาร์โค้ดผูกอยู่แล้ว ให้ดึงมาใส่ในช่องบาร์โค้ดของแถวนี้โดยอัตโนมัติ เพื่อป้องกันข้อมูลขัดแย้ง
        if (pickerItem.barcode) {
            setValue(`barcodes.${openPickerIndex}.barcode`, pickerItem.barcode, {
                shouldDirty: true,
                shouldValidate: true,
            });
        }

        setOpenPickerIndex(null);
    };

    return (
        <div className="mt-6 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all">
            {/* Header Section */}
            <div className="px-4 py-3 bg-purple-50/50 dark:bg-purple-900/10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <ScanBarcode size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">จัดการบาร์โค้ดสินค้า (Barcode Management)</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">ผูกบาร์โค้ดเข้ากับหน่วยนับสินค้า</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => append({ item_uom_id: 0, barcode: '', is_primary: false })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={14} /> เพิ่มรายการบาร์โค้ด
                    </button>
                    {editId && (
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle2 size={14} /> {isSaving ? 'กำลังบันทึก...' : 'บันทึกบาร์โค้ดทั้งหมด'}
                        </button>
                    )}
                </div>
            </div>

            {/* List Body */}
            <div className="p-0 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">หน่วยนับ (Unit)</th>
                            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">รหัสบาร์โค้ด (Barcode Value)</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">หลัก</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">ลบ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {fields.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <ScanBarcode size={40} className="text-gray-400" />
                                        <p className="text-sm font-medium text-gray-500">ยังไม่มีบาร์โค้ดสำหรับสินค้านี้</p>
                                        <p className="text-xs text-gray-400">คลิกที่ปุ่มด้านบนเพื่อเพิ่มรายการใหม่</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            fields.map((field, index) => {
                                const isPrimary = watchedBarcodes[index]?.is_primary;
                                const currentFromUnitId = Number(watchedBarcodes[index]?.item_uom_id) || 0;

                                // หา conversion ที่ตรงกับค่าปัจจุบัน เพื่อแสดงชื่อหน่วย
                                const selectedConversion = uomConversions.find(
                                    c => c.from_unit_id === currentFromUnitId
                                );
                                const hasError = !!errors.barcodes?.[index]?.item_uom_id;

                                return (
                                    <tr key={field.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        {/* UOM Picker Button */}
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenPickerIndex(index)}
                                                    className={`w-full h-9 bg-white dark:bg-gray-800 border ${
                                                        hasError
                                                            ? 'border-red-500 ring-1 ring-red-500/30'
                                                            : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400/60 hover:border-purple-500 dark:hover:border-purple-500'
                                                    } rounded-lg px-3 text-sm text-left flex items-center justify-between gap-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500`}
                                                >
                                                    <span className={`truncate font-medium ${
                                                        selectedConversion
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-gray-400 dark:text-gray-500'
                                                    }`}>
                                                        {selectedConversion ? selectedConversion.from_unit_name : '-- เลือกหน่วย --'}
                                                    </span>
                                                    <ChevronDown
                                                        size={14}
                                                        className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors"
                                                    />
                                                </button>

                                                {/* Hidden register สำหรับ RHF validation */}
                                                <input
                                                    type="hidden"
                                                    {...register(`barcodes.${index}.item_uom_id`)}
                                                />

                                                {hasError && (
                                                    <div className="absolute -top-6 left-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] shadow-sm animate-in fade-in slide-in-from-bottom-1">
                                                        กรุณาเลือกหน่วยนับ
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Barcode Input */}
                                        <td className="px-4 py-3">
                                            <div className="relative flex items-center">
                                                <input
                                                    {...register(`barcodes.${index}.barcode`)}
                                                    placeholder="กรอกรหัสบาร์โค้ด"
                                                    className={`w-full h-9 bg-white dark:bg-gray-800 border ${
                                                        errors.barcodes?.[index]?.barcode ? 'border-red-500 ring-red-500/20' : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400/50'
                                                    } rounded-lg px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm`}
                                                />
                                                {errors.barcodes?.[index]?.barcode && (
                                                    <AlertCircle size={14} className="absolute right-3 text-red-500" />
                                                )}
                                            </div>
                                        </td>

                                        {/* Primary Toggle */}
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentBarcodes = getValues('barcodes') || [];
                                                    const isCurrentlyPrimary = currentBarcodes[index]?.is_primary;
                                                    currentBarcodes.forEach((_, i) => {
                                                        if (i === index) {
                                                            setValue(`barcodes.${i}.is_primary`, !isCurrentlyPrimary, { shouldDirty: true });
                                                        } else {
                                                            setValue(`barcodes.${i}.is_primary`, false, { shouldDirty: true });
                                                        }
                                                    });
                                                }}
                                                className={`group/primary relative inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                                                    isPrimary
                                                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-2 border-purple-500 shadow-sm'
                                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                                title={isPrimary ? 'ยกเลิกสถานะหลัก' : 'ตั้งเป็นบาร์โค้ดหลัก'}
                                            >
                                                {isPrimary ? (
                                                    <CheckCircle2 size={16} fill="currentColor" className="animate-in zoom-in duration-200" />
                                                ) : (
                                                    <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full group-hover/primary:scale-125 transition-transform" />
                                                )}
                                            </button>
                                        </td>

                                        {/* Remove Button */}
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="ลบรายการ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {fields.length > 0 && (
                        <tfoot>
                            <tr className="bg-gray-50/30 dark:bg-gray-800/30">
                                <td colSpan={4} className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                        <CheckCircle2 size={10} className="text-green-500" />
                                        พบทั้งหมด {fields.length} รายการบาร์โค้ด
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* UOM Picker Modal — render ครั้งเดียวนอก loop */}
            <UOMPickerModal
                isOpen={openPickerIndex !== null}
                onClose={() => setOpenPickerIndex(null)}
                onSelect={handleUOMSelect}
                items={uomConversions}
                selectedFromUnitId={
                    openPickerIndex !== null
                        ? (Number(watchedBarcodes[openPickerIndex]?.item_uom_id) || undefined)
                        : undefined
                }
                title="เลือกหน่วยนับสำหรับบาร์โค้ด"
                zIndex={70}
            />
        </div>
    );
};
