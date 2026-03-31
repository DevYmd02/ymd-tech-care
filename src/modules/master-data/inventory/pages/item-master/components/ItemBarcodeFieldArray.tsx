import { useFieldArray, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { Plus, Trash2, ScanBarcode, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ItemFormData } from '../hooks/useItemForm';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

interface Props {
    control: Control<ItemFormData>;
    register: UseFormRegister<ItemFormData>;
    setValue: UseFormSetValue<ItemFormData>;
    errors: FieldErrors<ItemFormData>;
    units: UnitListItem[];
    editId?: number | null;
}

export const ItemBarcodeFieldArray: React.FC<Props> = ({
    control,
    register,
    errors,
    units = [],
}) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'barcodes',
    });

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
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">ผูกบาร์โค้ดเข้ากับหน่วยนับต่างๆ ของสินค้า</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => append({ uom_id: 0, barcode: '', is_active: true })}
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
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">สถานะ</th>
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
                            fields.map((field, index) => (
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
                                                placeholder="กรอกรหัสบาร์โค้ด หรือสแกนโดยตรง"
                                                className={`w-full h-9 bg-white dark:bg-gray-800 border ${
                                                    errors.barcodes?.[index]?.barcode ? 'border-red-500 ring-red-500/20' : 'border-gray-300 dark:border-gray-600 group-hover:border-purple-400/50'
                                                } rounded-lg px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/20 outline-none transition-all shadow-sm`}
                                            />
                                            {errors.barcodes?.[index]?.barcode && (
                                                <AlertCircle size={14} className="absolute right-3 text-red-500" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer group/toggle">
                                            <input
                                                type="checkbox"
                                                {...register(`barcodes.${index}.is_active`)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500 transition-all shadow-inner"></div>
                                            <span className="ml-2 text-[10px] font-medium text-gray-500 peer-checked:text-green-600 hidden group-hover/toggle:inline-block">
                                                {field.is_active ? 'เปิด' : 'ปิด'}
                                            </span>
                                        </label>
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
                            ))
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
        </div>
    );
};
