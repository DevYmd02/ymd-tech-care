import { memo } from 'react';
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { Search, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import type { POFormData } from '@/modules/procurement/schemas/po-schemas';
import type { UOMListItem } from '@/modules/master-data/types/master-data-types';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';

// Local UI shorthand (consistent with main modal)
const ui = {
    input:      'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed',
    select:     'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed',
    error:      'text-red-500 text-[11px] mt-1 font-semibold flex items-center gap-1',
};

// ====================================================================================
// SUB-COMPONENT: Row Total (isolated watch for performance)
// ====================================================================================
export const RowTotal = memo(({ control, index }: { control: Control<POFormData>; index: number }) => {
    const qty   = useWatch({ control, name: `po_lines.${index}.qty_ordered` }) ?? 0;
    const price = useWatch({ control, name: `po_lines.${index}.unit_price` }) ?? 0;
    const expr  = useWatch({ control, name: `po_lines.${index}.discount_expression` }) ?? '0';
    
    const qtyVal = Number(qty || 0);
    const priceVal = Number(price || 0);
    const disc  = parseDiscountAmount(expr, qtyVal * priceVal);
    const total = Math.max(0, qtyVal * priceVal - disc);
    
    return <>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
});

RowTotal.displayName = 'RowTotal';

// ====================================================================================
// MAIN COMPONENT: Line Row
// ====================================================================================
interface POFormLineRowProps {
    idx: number;
    isView: boolean;
    isLockedByQC: boolean;
    isLoadingUnits: boolean;
    units: UOMListItem[];
    handleOpenProductSearch: (index: number) => void;
    remove: (index: number) => void;
    handleAddLine: () => void;
    register: UseFormRegister<POFormData>;
    errors: FieldErrors<POFormData>;
    setValue: UseFormSetValue<POFormData>;
    control: Control<POFormData>;
}

export const POFormLineRow = memo(({ 
    idx, 
    isView, 
    isLockedByQC, 
    isLoadingUnits, 
    units, 
    handleOpenProductSearch, 
    remove, 
    handleAddLine,
    register,
    errors,
    setValue,
    control
}: POFormLineRowProps) => {
    // 🎯 Isolated watch for this specific row data
    const line = useWatch({ control, name: `po_lines.${idx}` });
    const rowError = errors.po_lines?.[idx];
    
    return (
        <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="px-3 py-2 text-center text-[13px] text-gray-600 font-medium border-r border-gray-200 dark:border-gray-700">{idx + 1}</td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <div className="relative w-full flex items-center">
                    <Controller
                        control={control}
                        name={`po_lines.${idx}.item_code`}
                        render={({ field: codeField }) => (
                            <input
                                {...codeField}
                                value={codeField.value || (line as Record<string, unknown>)?.item_code as string || (line as Record<string, unknown>)?.code as string || ''}
                                className={cn(
                                    "w-full pr-10 border rounded px-3 !h-9 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 shadow-sm",
                                    rowError?.item_id ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                                )}
                                placeholder={isView ? "" : "ค้นหารหัส..."}
                                readOnly
                            />
                        )}
                    />
                    <input type="hidden" {...register(`po_lines.${idx}.id`)} />
                    <input type="hidden" {...register(`po_lines.${idx}.item_id`)} />
                    <input type="hidden" {...register(`po_lines.${idx}.item_name`)} />
                    {!isView && !isLockedByQC && (
                        <button
                            type="button"
                            className="absolute right-1.5 z-10 p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                            title="ค้นหาสินค้า"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenProductSearch(idx);
                            }}
                        >
                            <Search size={16} className="pointer-events-none" />
                        </button>
                    )}
                </div>
                {rowError?.item_id && (
                    <p className={ui.error}>{rowError.item_id?.message}</p>
                )}
            </td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <input
                    {...register(`po_lines.${idx}.description`)}
                    className={cn(
                        `${ui.input} !h-9 text-[13px] shadow-sm`,
                        rowError?.description ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700"
                    )}
                    placeholder="รายละเอียดเพิ่มเติม"
                    readOnly={isView}
                />
            </td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <input
                    type="number" step="any"
                    {...register(`po_lines.${idx}.qty_ordered`, { valueAsNumber: true })}
                    className={cn(
                        `${ui.input} !h-9 text-center text-[13px] shadow-sm`,
                        rowError?.qty_ordered ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700"
                    )}
                    placeholder="0.000"
                    readOnly={isView || isLockedByQC}
                />
            </td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <select
                    {...register(`po_lines.${idx}.uom_id`, { valueAsNumber: true })}
                    value={line?.uom_id || ''}
                    onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setValue(`po_lines.${idx}.uom_id`, val, { shouldValidate: true });
                    }}
                    className={cn(
                        `${ui.select} !h-9 text-center px-1 text-[13px] shadow-sm`,
                        rowError?.uom_id ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700"
                    )}
                    disabled={isView || isLockedByQC || isLoadingUnits}
                >
                    <option value="">{isLoadingUnits ? 'โหลด...' : 'หน่วย'}</option>
                    {Array.isArray(units) && units.map((u: UOMListItem) => <option key={u.uom_id} value={u.uom_id}>{u.uom_name}</option>)}
                </select>
            </td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <input
                    type="number" step="any"
                    {...register(`po_lines.${idx}.unit_price`, { valueAsNumber: true })}
                    className={cn(
                        `${ui.input} !h-9 text-right text-[13px] shadow-sm`,
                        rowError?.unit_price ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700"
                    )}
                    placeholder="0.0000"
                    readOnly={isView || isLockedByQC}
                />
            </td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <input
                    type="text"
                    {...register(`po_lines.${idx}.discount_expression`)}
                    className={cn(
                        `${ui.input} !h-9 text-right text-[13px] shadow-sm`,
                        rowError?.discount_expression ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700"
                    )}
                    placeholder="0 หรือ 5%"
                    readOnly={isView || isLockedByQC}
                />
            </td>
            <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 border-r border-gray-200 dark:border-gray-700 text-[13px] bg-slate-50/50 dark:bg-slate-900/50">
                <RowTotal control={control} index={idx} />
            </td>
            <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                <select
                    {...register(`po_lines.${idx}.receipt_type`)}
                    className={cn(
                        `${ui.select} !h-9 text-center px-1 text-[13px] shadow-sm bg-white dark:bg-slate-800`,
                        rowError?.receipt_type ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : "border-slate-300 dark:border-slate-700"
                    )}
                    disabled={isView}
                >
                    <option value="GOODS">GOODS</option>
                    <option value="SERVICE">SERVICE</option>
                </select>
            </td>
            {!isView && !isLockedByQC && (
                <td className="px-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={handleAddLine}
                            className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition-colors"
                            title="แทรกรายการใหม่"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                        </button>
                        <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                            title="ลบรายการนี้"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );
}, (prevProps, nextProps) => {
    // 🎯 Performance Optimization: Deep comparison logic for React.memo
    // Only re-render if essential props change
    return (
        prevProps.idx === nextProps.idx &&
        prevProps.isView === nextProps.isView &&
        prevProps.isLockedByQC === nextProps.isLockedByQC &&
        prevProps.isLoadingUnits === nextProps.isLoadingUnits &&
        prevProps.units === nextProps.units &&
        prevProps.errors.po_lines?.[prevProps.idx] === nextProps.errors.po_lines?.[nextProps.idx]
        // Note: control, register, setValue, handleOpenProductSearch, remove, handleAddLine are stable references from hooks
    );
});

POFormLineRow.displayName = 'POFormLineRow';
