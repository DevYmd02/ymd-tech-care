import React, { useMemo } from 'react';
import { Controller, useFormContext, useFieldArray, useWatch, type FieldArrayWithId } from 'react-hook-form';
import { Search, Plus, Trash2, FileText } from 'lucide-react';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { QuotationFormData } from '@/modules/procurement/schemas/vq-schemas';

export interface VQFormLinesProps {
    forceViewMode: boolean;
    isLineReadonly: boolean;
    units: UnitListItem[];
    onOpenProductSearch: (index: number) => void;
    updateLineCalculation: (index: number) => void;
    createEmptyLine: () => QuotationFormData['vq_lines'][0];
    purchaseTaxOptions: { label: string; value: string | number; original?: unknown }[];
    totals: {
        subtotal: number;
        billDiscount: number;
        taxAmount: number;
        grandTotal: number;
        totalLineDiscount: number;
    };
}

export const VQFormLines: React.FC<VQFormLinesProps> = ({
    forceViewMode,
    isLineReadonly,
    units,
    onOpenProductSearch,
    updateLineCalculation,
    createEmptyLine,
    purchaseTaxOptions,
    totals
}) => {
    const { register, control, setValue, formState: { errors } } = useFormContext<QuotationFormData>();
    
    // @Agent_Payload_Interceptor - Mapping form array
    const { fields, append, remove, insert } = useFieldArray({
        control,
        name: 'vq_lines'
    });

    const watchVqLinesRaw = useWatch({ control, name: 'vq_lines' });
    const watchVqLines = useMemo(() => watchVqLinesRaw || [], [watchVqLinesRaw]);
    const watchedLines = watchVqLines; // Alias for consistent naming
    
    const {
        subtotal,
        billDiscount: discountAmount,
        taxAmount: vatAmount,
        grandTotal,
        totalLineDiscount
    } = totals;

    const inputReadonlyClass = 'h-7 px-2 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white';
    const labelClass = 'text-gray-600 dark:text-gray-400 min-w-16';

    return (
        <>
            <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <FileText size={18} />
                            <span className="font-semibold">รายการสินค้า - Line VQ (Vendor Quotation)</span>
                        </div>
                    </div>
                  
                    <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <table className="w-full min-w-[1000px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                            <thead className="bg-indigo-700 text-white text-xs dark:bg-indigo-900">
                                <tr>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-14">ลำดับ</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-44">รหัสสินค้า</th>
                                    <th className="px-3 py-2 text-left font-medium border-r border-indigo-600 dark:border-indigo-800">รายละเอียด</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">จำนวน</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-24">หน่วย</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-32">ราคา/หน่วย</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-28">ส่วนลด</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-32">ยอดรวม</th>
                                    <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-20 whitespace-nowrap">ไม่เสนอราคา</th>
                                    {!forceViewMode && <th className="px-3 py-2 text-center font-medium border-r border-indigo-600 dark:border-indigo-800 w-16">จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field: FieldArrayWithId<QuotationFormData, "vq_lines", "id">, index: number) => {
                                    const isNoQuote = watchVqLines[index]?.no_quote;
                                    return (
                                        <tr key={field.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${isNoQuote ? 'bg-amber-50 dark:bg-amber-950/10' : ''}`}>
                                            <td className="px-3 py-2 text-center text-xs text-gray-700 dark:text-gray-300 border-r border-b border-gray-200 dark:border-gray-700">{index + 1}</td>
                                            
                                            {/* Item Code */}
                                            <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                {isLineReadonly ? (
                                                    <div className="relative">
                                                        <input {...register(`vq_lines.${index}.item_code`)} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-center cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly />
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                                            <Search size={14} />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative group/search">
                                                        <input {...register(`vq_lines.${index}.item_code`)} className="w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all" />
                                                        <button type="button" onClick={() => onOpenProductSearch(index)} className="absolute right-1 top-1 h-[24px] w-[24px] flex items-center justify-center bg-gray-200 dark:bg-slate-700 group-hover/search:bg-indigo-600 dark:group-hover/search:bg-indigo-600 text-gray-600 group-hover/search:text-white dark:text-white rounded transition-all duration-200">
                                                            <Search size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Item Description */}
                                            <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                <input {...register(`vq_lines.${index}.item_name`)} className={`w-full h-8 px-3 text-sm ${isLineReadonly ? 'bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'} dark:text-gray-400 border dark:border-gray-700 rounded text-left font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-colors`} readOnly={isLineReadonly} />
                                            </td>
                                            
                                            {/* Qty */}
                                            <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                <input 
                                                    type="number" step="any"
                                                    {...register(`vq_lines.${index}.qty`, { 
                                                        valueAsNumber: true, 
                                                        onChange: () => updateLineCalculation(index)
                                                    })} 
                                                    className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center transition-all disabled:opacity-70 disabled:cursor-not-allowed ${isLineReadonly ? 'bg-gray-100/70 dark:bg-gray-800/70 cursor-not-allowed font-medium' : ''}`} 
                                                    readOnly={isLineReadonly}
                                                />
                                            </td>
                                            
                                            {/* Unit */}
                                            <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                {isLineReadonly ? (
                                                    <input
                                                        type="text"
                                                        {...register(`vq_lines.${index}.uom_name`)}
                                                        className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded text-center cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                                                        readOnly
                                                    />
                                                ) : (
                                                    <select {...register(`vq_lines.${index}.uom_name`)} className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50">
                                                        <option value="" hidden>หน่วย</option>
                                                        {units.map((u: UnitListItem) => (
                                                            <option key={u.unit_id} value={u.unit_name}>{u.unit_name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>

                                            {/* Unit Price */}
                                            <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                <input 
                                                    type="number" step="any" disabled={isNoQuote || forceViewMode}
                                                    {...register(`vq_lines.${index}.unit_price`, { 
                                                        valueAsNumber: true,
                                                        onChange: () => updateLineCalculation(index)
                                                    })} 
                                                    className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-right transition-all ${(isNoQuote || forceViewMode) ? 'opacity-70 cursor-not-allowed disabled:bg-gray-50 font-medium' : ''}`} 
                                                    placeholder="0.00"
                                                />
                                                {watchVqLines[index]?.reference_price ? (Number(watchVqLines[index]?.reference_price) || 0) > 0 && (
                                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right flex flex-col leading-tight">
                                                        <span className="font-medium">Ref: {(Number(watchVqLines[index]?.reference_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        <span className="opacity-70">(Budget)</span>
                                                    </div>
                                                ) : null}
                                            </td>

                                            {/* Discount Raw (Amount or %) */}
                                            <td className="px-4 py-3 text-right border-r border-gray-200 dark:border-gray-700">
                                                <input 
                                                    type="text" disabled={isNoQuote || forceViewMode}
                                                    {...register(`vq_lines.${index}.discount_expression`, { 
                                                        onChange: () => updateLineCalculation(index)
                                                    })} 
                                                    className={`w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white text-right transition-all ${(isNoQuote || forceViewMode) ? 'opacity-70 cursor-not-allowed disabled:bg-gray-50 font-medium' : ''}`} 
                                                    placeholder="0 or 5%"
                                                />
                                                {(Number(watchVqLines[index]?.discount_amount) || 0) > 0 && (
                                                    <span className="text-[10px] text-rose-500 text-right pr-1 italic">
                                                        -{(Number(watchVqLines[index]?.discount_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Net Amount - @Agent_Fallback_Renderer applied safely */}
                                            <td className="p-3 text-right pr-6 border-r border-gray-200 dark:border-gray-700">
                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                                                {(Number(watchedLines?.[index]?.net_amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} 
                                                </span>
                                            </td>
                                            
                                            {/* No Quote Toggle */}
                                            <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                                                <input
                                                    type="checkbox"
                                                    {...register(`vq_lines.${index}.no_quote`)} 
                                                    className={`w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 ${forceViewMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    disabled={forceViewMode}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const val = e.target.checked;
                                                        setValue(`vq_lines.${index}.no_quote`, val);
                                                        updateLineCalculation(index);
                                                    }}
                                                />
                                            </td>

                                            {/* Actions */}
                                            {!isLineReadonly && (
                                                <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => insert(index + 1, createEmptyLine())}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                                            title="เพิ่มบรรทัดใหม่"
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                                                            title="ลบบรรทัด"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Section */}
                    {!isLineReadonly && (
                        <div className="bg-slate-100 dark:bg-slate-800/20 border-t border-gray-300 dark:border-slate-800 p-4">
                            <button
                                type="button"
                                onClick={() => append(createEmptyLine())}
                                className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                <div className="bg-indigo-100 dark:bg-indigo-900/40 p-1 rounded">
                                    <Plus size={16} />
                                </div>
                                เพิ่มรายการสินค้า (Add Row)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- TOTAL SUMMARY & CALCULATIONS - @Agent_Fallback_Renderer applied safely --- */}
            <div className="mt-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden">
                    <div className="p-3 bg-white dark:bg-gray-900">
                        <div className="flex justify-end">
                            <div className="w-full md:w-[480px] space-y-2 text-sm">

                                {/* รวม (Subtotal) */}
                                <div className="flex justify-between items-center">
                                    <span className={labelClass}>รวม (Subtotal)</span>
                                    <input 
                                        value={(Number(subtotal) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                        readOnly 
                                        className={`w-36 ${inputReadonlyClass} bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-600 text-slate-800 dark:text-yellow-200 font-medium`} 
                                    />
                                </div>
                                
                                {/* ส่วนลดท้ายบิล (Discount) — 3 fields */}
                                <div className="flex justify-between items-center">
                                    <span className={labelClass}>ส่วนลดรวม</span>
                                    <div className="flex items-center gap-1">
                                        <Controller
                                            name="discount_expression"
                                            control={control}
                                            render={({ field }) => (
                                                <input 
                                                    type="text" 
                                                    {...field}
                                                    className="w-16 h-7 px-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-right focus:ring-1 focus:ring-indigo-500"
                                                    placeholder="0 or 5%"
                                                    disabled={forceViewMode}
                                                />
                                            )}
                                        />
                                        <span className="text-gray-400 dark:text-gray-500">-</span>
                                        <input 
                                            value={(Number(discountAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                            readOnly 
                                            className={`w-28 ${inputReadonlyClass}`} 
                                        />
                                        <span className="text-gray-400 dark:text-gray-500">-</span>
                                        <input 
                                            value={(Number(totalLineDiscount || 0) + Number(discountAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                            readOnly 
                                            className={`w-28 ${inputReadonlyClass} text-red-600 dark:text-red-400 font-bold`} 
                                        />
                                    </div>
                                </div>

                                {/* ภาษี VAT */}
                                <div className="flex justify-between items-center relative">
                                    <span className={labelClass}>ภาษี VAT</span>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            value={(Number(vatAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                            readOnly 
                                            className={`w-20 ${inputReadonlyClass}`} 
                                        />
                                        {/* Tax Code Select */}
                                        <Controller
                                            name="tax_code_id"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    value={field.value ? String(field.value) : ''}
                                                    disabled={forceViewMode}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const selected = purchaseTaxOptions.find(t => String(t.value) === val);
                                                        field.onChange(selected ? selected.value : val);
                                                    }}
                                                    className={`h-7 px-1 text-xs bg-white dark:bg-gray-800 border ${errors.tax_code_id ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} rounded text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[140px] ${forceViewMode ? 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-70' : ''}`}
                                                >
                                                    <option value="">เลือกภาษี</option>
                                                    {purchaseTaxOptions.map((tax) => (
                                                        <option key={tax.value} value={tax.value}>
                                                            {tax.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        />
                                        <span className="text-gray-400 dark:text-gray-500">-</span>
                                        <input 
                                            value={(Number(vatAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                            readOnly 
                                            className={`w-28 ${inputReadonlyClass} bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 font-medium`} 
                                        />
                                    </div>
                                    {errors.tax_code_id && <p className="text-red-500 text-[10px] absolute -bottom-3.5 left-20 font-medium whitespace-nowrap">{errors.tax_code_id.message}</p>}
                                </div>

                                {/* รวมทั้งสิ้น (Grand Total) */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">รวมทั้งสิ้น (Grand Total)</span>
                                    <input 
                                        value={(Number(grandTotal || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                                        readOnly 
                                        className="w-36 h-8 px-2 text-right font-bold bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-600 rounded text-blue-600 dark:text-yellow-200 text-lg shadow-inner" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
