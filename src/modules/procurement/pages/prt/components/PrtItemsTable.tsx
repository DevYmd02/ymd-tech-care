import React, { useEffect } from 'react';
import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { PrtFormValues, PrtItem } from '@/modules/procurement/types';

interface PrtItemsTableProps {
    control: Control<PrtFormValues>;
    register: UseFormRegister<PrtFormValues>;
    setValue: UseFormSetValue<PrtFormValues>;
    watch: UseFormWatch<PrtFormValues>;
    itemOptions: PrtItem[];
}

export const PrtItemsTable: React.FC<PrtItemsTableProps> = ({ 
    control, 
    register, 
    setValue, 
    watch, 
    itemOptions 
}) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const handleAddItem = () => {
        append({
            item_id: '',
            item_code: '',
            item_name: '',
            qty_return: 1,
            uom_id: 'PCS',
            unit_price_ref: 0,
            line_total: 0
        });
    };

    // Performance Optimization: 
    // Isolate the watch logic here so the parent modal doesn't re-render on every keystroke in the table.
    const items = watch('items') || [];
    
    // Create a dependency string to avoid deep object comparison issues in useEffect
    const itemsDependency = JSON.stringify(items.map(i => ({ q: i.qty_return, p: i.unit_price_ref })));

    // Auto-calculate line total when qty or price changes
    useEffect(() => {
        items.forEach((item, index) => {
            const qty = Number(item.qty_return) || 0;
            const price = Number(item.unit_price_ref) || 0;
            const total = qty * price;
            
            // Only update if value is different to avoid infinite loops
            if (total !== item.line_total) {
                setValue(`items.${index}.line_total`, total, { shouldDirty: true, shouldTouch: true });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsDependency, setValue]);

    return (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b dark:border-gray-700">
                    <tr>
                        <th className="px-4 py-3 w-10 text-center">#</th>
                        <th className="px-4 py-3 min-w-[200px]">สินค้า <br/><span className="text-xs font-normal text-gray-400">(item_id FK)*</span></th>
                        <th className="px-4 py-3 min-w-[200px]">ชื่อสินค้า</th>
                        <th className="px-4 py-3 w-24 text-right">จำนวนคืน <br/><span className="text-xs font-normal text-gray-400">(qty_return)*</span></th>
                        <th className="px-4 py-3 w-24">หน่วย <br/><span className="text-xs font-normal text-gray-400">(uom_id FK)*</span></th>
                        <th className="px-4 py-3 w-32 text-right">ราคาอ้างอิง <br/><span className="text-xs font-normal text-gray-400">(unit_price_ref)</span></th>
                        <th className="px-4 py-3 w-32 text-right">ยอดสุทธิ <br/><span className="text-xs font-normal text-gray-400">(line_total)</span></th>
                        <th className="px-4 py-3 w-20 text-center">การจัดการ</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {fields.map((field, index) => (
                        <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">{index + 1}</td>
                            <td className="px-4 py-2">
                                <select 
                                    {...register(`items.${index}.item_id` as const)}
                                    className="w-full h-8 px-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                    onChange={(e) => {
                                        const selected = itemOptions.find(i => i.id === e.target.value);
                                        if (selected) {
                                            setValue(`items.${index}.item_code`, selected.code);
                                            setValue(`items.${index}.item_name`, selected.name);
                                            setValue(`items.${index}.unit_price_ref`, selected.price);
                                            setValue(`items.${index}.uom_id`, selected.uom);
                                        }
                                    }}
                                >
                                    <option value="">-- เลือกสินค้า --</option>
                                    {itemOptions.map(item => (
                                        <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-4 py-2">
                                <input 
                                    {...register(`items.${index}.item_name` as const)}
                                    className="w-full border-none bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
                                    disabled
                                    placeholder="แสดงชื่อสินค้าอัตโนมัติ"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input 
                                    type="number"
                                    step="any"
                                    {...register(`items.${index}.qty_return` as const, { valueAsNumber: true })}
                                    className="w-full h-8 px-2 text-right bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </td>
                            <td className="px-4 py-2">
                                <select 
                                    {...register(`items.${index}.uom_id` as const)} 
                                    className="w-full h-8 px-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="PCS">PCS</option>
                                    <option value="BOX">BOX</option>
                                    <option value="SET">SET</option>
                                </select>
                            </td>
                            <td className="px-4 py-2">
                                <input 
                                    type="number"
                                    step="any"
                                    {...register(`items.${index}.unit_price_ref` as const, { valueAsNumber: true })}
                                    className="w-full h-8 px-2 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-300 outline-none text-sm"
                                    readOnly 
                                />
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                                {/* Use specific field watch to avoid re-rendering entire table when one row changes? 
                                    Actually watch('items') touches everything anyway. 
                                    For strict row isolation we would need sub-components per row, 
                                    but extracting the whole table is a big enough win for the modal parent. */}
                                {(items[index]?.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2 flex justify-center items-center gap-2">
                                <button type="button" onClick={handleAddItem} className="text-green-500 hover:text-green-600"><Plus size={16} /></button>
                                <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                    {fields.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                                ไม่มีรายการสินค้า
                                <button type="button" onClick={handleAddItem} className="ml-2 text-blue-500 hover:underline">เพิ่มรายการ</button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
