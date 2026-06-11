/**
 * @file TransferFormLines.tsx
 * @description ส่วน Lines ของฟอร์มใบขอโอนย้ายสินค้า (Transfer Requisition)
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Plus, Trash2, ShoppingBag, Search } from 'lucide-react';
import type { FieldArrayWithId } from 'react-hook-form';
import type { TransferHeaderFormData, TransferLineFormData } from '../schemas/transfer.schemas';

interface TransferFormLinesProps {
    fields: FieldArrayWithId<TransferHeaderFormData, 'lines', '_id'>[];
    addLine: () => void;
    removeLine: (index: number) => void;
    updateLine: (index: number, field: keyof TransferLineFormData | null, value: TransferLineFormData | unknown) => void;
    readOnly?: boolean;
    uomOptions?: { id: string; name: string }[];
    onSearchProduct?: (index: number) => void;
    onSearchSourceWarehouse?: (index: number) => void;
    onSearchSourceLocation?: (index: number, warehouseId?: string) => void;
    onSearchDestWarehouse?: (index: number) => void;
    onSearchDestLocation?: (index: number, warehouseId?: string) => void;
    onSearchLot?: (index: number, itemId?: string) => void;
    onOpenUomPicker?: (index: number) => void;
}

const tableInputClass = "w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";

export const TransferFormLines: React.FC<TransferFormLinesProps> = React.memo(
    ({
        fields,
        addLine,
        removeLine,
        readOnly = false,
        uomOptions = [],
        onSearchProduct,
        onSearchSourceWarehouse,
        onSearchSourceLocation,
        onSearchDestWarehouse,
        onSearchDestLocation,
        onSearchLot,
        onOpenUomPicker,
    }) => {
        const { register, control, getValues, formState: { errors } } = useFormContext<TransferHeaderFormData>();
        const lineErrors = errors.lines;

        return (
            <div className="space-y-4">
                {/* ── Section Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <ShoppingBag size={20} strokeWidth={2.5} />
                        <h3 className="text-lg font-bold">รายการสินค้าขอโอนย้าย — Transaction Lines</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {lineErrors && typeof lineErrors === 'object' && 'message' in lineErrors && (
                            <span className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30 animate-pulse">
                                {lineErrors.message as string}
                            </span>
                        )}
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={addLine}
                                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                            >
                                <Plus size={16} strokeWidth={3} />
                                เพิ่มรายการสินค้าใหม่
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Table Container ────────────────────────────────────────────── */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                    <table className="w-full min-w-[2500px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-blue-600 text-white border-b border-blue-500/30">
                                <th className="p-3 w-12 text-center font-bold sticky left-0 z-20 bg-blue-600 border-r border-blue-500/30 uppercase tracking-wider text-[11px]">ลำดับ</th>
                                <th className="p-3 w-64 text-left font-bold sticky left-12 z-20 bg-blue-600 border-r border-blue-500/30 uppercase tracking-wider text-[11px]">รหัสสินค้า</th>
                                <th className="p-3 min-w-[300px] text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">ชื่อสินค้า</th>
                                <th className="p-3 w-40 text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">หน่วย <span className="text-blue-200">*</span></th>
                                <th className="p-3 w-48 text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">คลังต้นทาง <span className="text-blue-200">*</span></th>
                                <th className="p-3 w-48 text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">ที่เก็บต้นทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">คลังปลายทาง <span className="text-blue-200">*</span></th>
                                <th className="p-3 w-48 text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">ที่เก็บปลายทาง</th>
                                <th className="p-3 w-40 text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">Lot</th>
                                <th className="p-3 w-32 text-right font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">จำนวน <span className="text-blue-200">*</span></th>
                                <th className="p-3 min-w-[150px] text-left font-bold border-r border-blue-500/30 uppercase tracking-wider text-[11px]">หมายเหตุ</th>
                                {!readOnly && <th className="p-3 w-14 text-center sticky right-0 z-20 bg-blue-600 uppercase tracking-wider text-[11px]">ลบ</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {fields.map((field, index) => {
                                const lineErr = Array.isArray(lineErrors) ? lineErrors[index] : undefined;
                                return (
                                    <tr key={field._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
                                        <td className="px-2 py-1.5 text-center text-gray-500 font-medium sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                                            {index + 1}
                                        </td>

                                        {/* Item Code */}
                                        <td className="p-2 sticky left-12 z-10 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                                            <div className="flex gap-1">
                                                <input
                                                    {...register(`lines.${index}.item_code`)}
                                                    type="text"
                                                    readOnly
                                                    onClick={() => !readOnly && onSearchProduct?.(index)}
                                                    placeholder="รหัสสินค้า"
                                                    className={`${tableInputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors ${lineErr?.item_id ? 'border-red-500' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => onSearchProduct?.(index)}
                                                    disabled={readOnly}
                                                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center disabled:opacity-50"
                                                >
                                                    <Search size={16} />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Item Name */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.item_name`)}
                                                type="text"
                                                readOnly
                                                placeholder="ชื่อสินค้า"
                                                className={`${tableInputClass} bg-gray-50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* UOM */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <Controller
                                                name={`lines.${index}.uom_id`}
                                                control={control}
                                                render={({ field: f }) => {
                                                    const itemId = getValues(`lines.${index}.item_id`);
                                                    return (
                                                        <button
                                                            type="button"
                                                            disabled={readOnly || !itemId}
                                                            onClick={() => onOpenUomPicker?.(index)}
                                                            className={`${tableInputClass} text-left flex items-center justify-between font-medium disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:opacity-60 disabled:cursor-not-allowed ${lineErr?.uom_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                        >
                                                            <span className="truncate">
                                                                {uomOptions.find(u => String(u.id) === String(f.value))?.name || 
                                                                 (f.value ? `[ID: ${f.value}]` : '-- เลือกหน่วย --')}
                                                            </span>
                                                            {!readOnly && !!itemId && <span className="text-gray-400 text-[10px] ml-1 shrink-0">▼</span>}
                                                        </button>
                                                    );
                                                }}
                                            />
                                        </td>

                                        {/* Source Warehouse (income_inve_id) */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.income_inve_name`)}
                                                type="text"
                                                readOnly
                                                onClick={() => !readOnly && onSearchSourceWarehouse?.(index)}
                                                placeholder="-- เลือกคลังต้นทาง --"
                                                className={`${tableInputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors ${lineErr?.income_inve_id ? 'border-red-500' : ''}`}
                                            />
                                        </td>

                                        {/* Source Location (income_loca_id) */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.income_loca_name`)}
                                                type="text"
                                                readOnly
                                                onClick={() => {
                                                    if (readOnly) return;
                                                    const whId = getValues(`lines.${index}.income_inve_id`);
                                                    onSearchSourceLocation?.(index, whId);
                                                }}
                                                placeholder="-- เลือกที่เก็บต้นทาง --"
                                                className={`${tableInputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors`}
                                            />
                                        </td>

                                        {/* Destination Warehouse (out_inve_id) */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.out_inve_name`)}
                                                type="text"
                                                readOnly
                                                onClick={() => !readOnly && onSearchDestWarehouse?.(index)}
                                                placeholder="-- เลือกคลังปลายทาง --"
                                                className={`${tableInputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors ${lineErr?.out_inve_id ? 'border-red-500' : ''}`}
                                            />
                                        </td>

                                        {/* Destination Location (out_loca_id) */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.out_loca_name`)}
                                                type="text"
                                                readOnly
                                                onClick={() => {
                                                    if (readOnly) return;
                                                    const whId = getValues(`lines.${index}.out_inve_id`);
                                                    onSearchDestLocation?.(index, whId);
                                                }}
                                                placeholder="-- เลือกที่เก็บปลายทาง --"
                                                className={`${tableInputClass} bg-blue-50/30 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100/50 transition-colors`}
                                            />
                                        </td>

                                        {/* Lot */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.lot_no`)}
                                                type="text"
                                                readOnly
                                                onClick={() => {
                                                    if (readOnly) return;
                                                    const itemId = getValues(`lines.${index}.item_id`);
                                                    onSearchLot?.(index, itemId);
                                                }}
                                                placeholder="-- เลือก Lot --"
                                                className={`${tableInputClass} bg-emerald-50/30 dark:bg-emerald-900/10 cursor-pointer hover:bg-emerald-100/50 transition-colors`}
                                            />
                                        </td>

                                        {/* Qty */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.qty_ic`, { valueAsNumber: true })}
                                                type="number"
                                                disabled={readOnly}
                                                placeholder="0.00"
                                                className={`${tableInputClass} text-right font-bold text-blue-600 ${lineErr?.qty_ic ? 'border-red-500' : ''}`}
                                            />
                                            {lineErr?.qty_ic && <span className="text-[10px] text-red-500 font-medium block mt-0.5">{lineErr.qty_ic.message}</span>}
                                        </td>

                                        {/* Remark */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input {...register(`lines.${index}.remark`)} type="text" disabled={readOnly} className={tableInputClass} placeholder="หมายเหตุ" />
                                        </td>

                                        {/* Action */}
                                        {!readOnly && (
                                            <td className="p-2 text-center sticky right-0 z-10 bg-white dark:bg-gray-900 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.1)]">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
                                                    title="ลบรายการ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ── Table Footer ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-end pt-2">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        รวมทั้งสิ้น: <span className="text-blue-600 dark:text-blue-400 ml-1">{fields.length}</span> รายการ
                    </div>
                </div>
            </div>
        );
    }
);

TransferFormLines.displayName = 'TransferFormLines';
