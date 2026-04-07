import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormGetValues } from 'react-hook-form';
import { Plus, Trash2, ScanBarcode, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ItemFormData } from '../hooks/useItemForm';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

interface Props {
    control: Control<ItemFormData>;
    register: UseFormRegister<ItemFormData>;
    setValue: UseFormSetValue<ItemFormData>;
    getValues: UseFormGetValues<ItemFormData>;
    errors: FieldErrors<ItemFormData>;
    units: UnitListItem[];
    editId?: number | null;
}

export const ItemBarcodeFieldArray: React.FC<Props> = ({
    control,
    register,
    setValue,
    getValues,
    errors,
    units = [],
}) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'barcodes',
    });

    // Subscribe to barcodes array to force re-render on changes and get live values
    const watchedBarcodes = useWatch({
        control,
        name: 'barcodes',
    }) || [];

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
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">ผูกบาร์โค้ดเข้ากับหน่วยนับ พร้อมกำหนดประเภทการใช้ (ซื้อ/ขาย)</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => append({ uom_id: 0, barcode: '', is_primary: false, is_purchase: true, is_sales: true })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={14} /> เพิ่มรายการบาร์โค้ด
                </button>
            </div>

            {/* List Body */}
            <div className="p-0 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">หน่วยนับ (Unit)</th>
                            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">รหัสบาร์โค้ด (Barcode Value)</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40 whitespace-nowrap">ประเภทการใช้งาน</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">หลัก</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">ลบ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {fields.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <ScanBarcode size={40} className="text-gray-400" />
                                        <p className="text-sm font-medium text-gray-500">ยังไม่มีบาร์โค้ดสำหรับสินค้านี้</p>
                                        <p className="text-xs text-gray-400">คลิกที่ปุ่มด้านบนเพื่อเพิ่มรายการใหม่</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            fields.map((field, index) => {
                                // Get actual value from useWatch to ensure reactivity
                                const isPrimary = watchedBarcodes[index]?.is_primary;

                                return (
                                    <tr key={field.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <select
                                                    {...register(`barcodes.${index}.uom_id`)}
                                                    className={`w-full h-9 bg-white dark:bg-gray-800 border ${
                                                        errors.barcodes?.[index]?.uom_id ? 'border-red-500 ring-red-500/20' : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400/50'
                                                    } rounded-lg px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm`}
                                                >
                                                    <option value="">-- เลือกหน่วยนับ --</option>
                                                    {units.map(u => (
                                                        <option key={u.uom_id} value={u.uom_id}>{u.uom_name || u.unit_name} ({u.uom_code || u.unit_code})</option>
                                                    ))}
                                                </select>
                                                {errors.barcodes?.[index]?.uom_id && (
                                                    <div className="absolute -top-6 left-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] shadow-sm animate-in fade-in slide-in-from-bottom-1">
                                                        กรุณาเลือกหน่วยนับ
                                                    </div>
                                                )}
                                            </div>
                                        </td>
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
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Purchase Toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = !!watchedBarcodes[index]?.is_purchase;
                                                        setValue(`barcodes.${index}.is_purchase`, !current, { shouldDirty: true });
                                                    }}
                                                    className={`px-3 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                                                        watchedBarcodes[index]?.is_purchase 
                                                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40 shadow-sm shadow-blue-500/10' 
                                                            : 'bg-gray-100 dark:bg-gray-800/80 text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                    title={watchedBarcodes[index]?.is_purchase ? 'จำหน่ายสำหรับหน่วยจัดซื้อ' : 'คลิกเพื่อระบุเป็นหน่วยจัดซื้อ'}
                                                >
                                                    <span className="text-[11px] font-bold">ซื้อ</span>
                                                </button>

                                                {/* Sales Toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = !!watchedBarcodes[index]?.is_sales;
                                                        setValue(`barcodes.${index}.is_sales`, !current, { shouldDirty: true });
                                                    }}
                                                    className={`px-3 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                                                        watchedBarcodes[index]?.is_sales 
                                                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                                                            : 'bg-gray-100 dark:bg-gray-800/80 text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                    title={watchedBarcodes[index]?.is_sales ? 'จำหน่ายสำหรับหน่วยขาย' : 'คลิกเพื่อระบุเป็นหน่วยขาย'}
                                                >
                                                    <span className="text-[11px] font-bold">ขาย</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentBarcodes = getValues('barcodes') || [];
                                                    const isCurrentlyPrimary = currentBarcodes[index]?.is_primary;

                                                    // Exclusive toggle logic
                                                    currentBarcodes.forEach((_, i) => {
                                                        if (i === index) {
                                                            // Toggle off if already primary, otherwise set to primary
                                                            setValue(`barcodes.${i}.is_primary`, !isCurrentlyPrimary, { shouldDirty: true });
                                                        } else {
                                                            // Deselect all others
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
                                                    <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full group-hover/primary:scale-125 transition-transform"></div>
                                                )}
                                            </button>
                                        </td>
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
                                <td colSpan={5} className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
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
        </div>
    );
};
