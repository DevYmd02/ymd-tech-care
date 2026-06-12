/**
 * @file TransferApproveFormLines.tsx
 * @description ส่วน Lines ของฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Form Lines)
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { ShoppingBag } from 'lucide-react';
import type { FieldArrayWithId } from 'react-hook-form';
import type { TransferApprovalFormData } from '../schemas/transfer-approval.schemas';

interface TransferApproveFormLinesProps {
    fields: FieldArrayWithId<TransferApprovalFormData, 'lines', '_id'>[];
    readOnly?: boolean;
    uomOptions?: { id: string; name: string }[];
}

const tableInputClass = "w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";

export const TransferApproveFormLines: React.FC<TransferApproveFormLinesProps> = React.memo(
    ({
        fields,
        readOnly = false,
        uomOptions = [],
    }) => {
        const { register, control, formState: { errors } } = useFormContext<TransferApprovalFormData>();
        const lineErrors = errors.lines;

        return (
            <div className="space-y-4">
                {/* ── Section Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <ShoppingBag size={20} strokeWidth={2.5} />
                        <h3 className="text-lg font-bold">รายการขออนุมัติโอนย้าย — Transaction Lines</h3>
                    </div>
                    {lineErrors && typeof lineErrors === 'object' && 'message' in lineErrors && (
                        <span className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30 animate-pulse">
                            {lineErrors.message as string}
                        </span>
                    )}
                </div>

                {/* ── Table Container ────────────────────────────────────────────── */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                    <table className="w-full min-w-[2400px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-emerald-600 text-white border-b border-emerald-500/30">
                                <th className="p-3 w-12 text-center font-bold sticky left-0 z-20 bg-emerald-600 border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">ลำดับ</th>
                                <th className="p-3 w-64 text-left font-bold sticky left-12 z-20 bg-emerald-600 border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">รหัสสินค้า</th>
                                <th className="p-3 min-w-[300px] text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">ชื่อสินค้า</th>
                                <th className="p-3 w-40 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">หน่วย</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">คลังต้นทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">ที่เก็บต้นทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">คลังปลายทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">ที่เก็บปลายทาง</th>
                                <th className="p-3 w-40 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">Lot</th>
                                <th className="p-3 w-32 text-right font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">จำนวนขอโอนย้าย</th>
                                <th className="p-3 w-32 text-right font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">จำนวนอนุมัติ <span className="text-emerald-200">*</span></th>
                                <th className="p-3 min-w-[150px] text-left font-bold uppercase tracking-wider text-[11px]">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {fields.map((field, index) => {
                                const lineErr = Array.isArray(lineErrors) ? lineErrors[index] : undefined;
                                return (
                                    <tr key={field._id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-colors group">
                                        <td className="px-2 py-1.5 text-center text-gray-500 font-medium sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                                            {index + 1}
                                        </td>

                                        {/* Item Code */}
                                        <td className="p-2 sticky left-12 z-10 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.item_code`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Item Name */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.item_name`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                         {/* UOM */}
                                         <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                             <Controller
                                                 name={`lines.${index}.uom_id`}
                                                 control={control}
                                                 render={({ field: f }) => (
                                                     <button
                                                         type="button"
                                                         disabled
                                                         className={`${tableInputClass} text-left flex items-center justify-between font-medium bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-75`}
                                                     >
                                                         <span className="truncate">
                                                             {uomOptions.find(u => String(u.id) === String(f.value))?.name || 
                                                              (f.value ? `[ID: ${f.value}]` : '-- เลือกหน่วย --')}
                                                         </span>
                                                     </button>
                                                 )}
                                             />
                                         </td>

                                        {/* Source Warehouse */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.income_inve_name`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Source Location */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.income_loca_name`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Destination Warehouse */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.out_inve_name`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Destination Location */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.out_loca_name`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Lot */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.lot_no`)}
                                                type="text"
                                                readOnly
                                                className={`${tableInputClass} bg-gray-50 dark:bg-gray-800/50 italic cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Requisition Qty */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.qty_ic`)}
                                                type="number"
                                                readOnly
                                                className={`${tableInputClass} text-right text-gray-500 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                                            />
                                        </td>

                                        {/* Approved Qty */}
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input
                                                {...register(`lines.${index}.appv_stock_qty`, { valueAsNumber: true })}
                                                type="number"
                                                disabled={readOnly}
                                                placeholder="0.00"
                                                className={`${tableInputClass} text-right font-bold text-emerald-600 ${lineErr?.appv_stock_qty ? 'border-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'}`}
                                            />
                                            {lineErr?.appv_stock_qty && <span className="text-[10px] text-red-500 font-medium block mt-0.5">{lineErr.appv_stock_qty.message}</span>}
                                        </td>

                                        {/* Remark */}
                                        <td className="p-2">
                                            <input {...register(`lines.${index}.remark`)} type="text" disabled={readOnly} className={`${tableInputClass} focus:border-emerald-500 focus:ring-emerald-500`} placeholder="หมายเหตุ" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ── Table Footer ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-end pt-2">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        รวมทั้งสิ้น: <span className="text-emerald-600 dark:text-emerald-400 ml-1">{fields.length}</span> รายการ
                    </div>
                </div>
            </div>
        );
    }
);

TransferApproveFormLines.displayName = 'TransferApproveFormLines';
