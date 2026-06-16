/**
 * @file TransferApproveFormLines.tsx
 * @description ส่วน Lines ของฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Form Lines)
 */

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { ShoppingBag } from 'lucide-react';
import type { FieldArrayWithId } from 'react-hook-form';
import type { TransferApprovalFormData } from '../schemas/transfer-approval.schemas';
import { type ICOption, ICOptionSummaryBar } from '@/shared/ic-option';

interface TransferApproveFormLinesProps {
    fields: FieldArrayWithId<TransferApprovalFormData, 'lines', '_id'>[];
    readOnly?: boolean;
    uomOptions?: { id: string; name: string }[];
    icOptions?: ICOption;
}

const tableInputClass = "w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";

export const TransferApproveFormLines: React.FC<TransferApproveFormLinesProps> = React.memo(
    ({
        fields,
        readOnly = false,
        uomOptions = [],
        icOptions,
    }) => {
        const { register, control, watch, formState: { errors } } = useFormContext<TransferApprovalFormData>();
        const lineErrors = errors.lines;
        const hasPartialApproval = fields.some(f => Number(f.approved_qty) > 0);
        const appvFlag = watch('appv_flag');
        const totalApprovedQty = fields.reduce((sum, f) => sum + Number(f.appv_stock_qty || 0), 0);

        return (
            <div className="space-y-4">
                {/* ── Section Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 flex-wrap">
                        <ShoppingBag size={20} strokeWidth={2.5} />
                        <h3 className="text-lg font-bold">รายการขออนุมัติโอนย้าย — Transaction Lines</h3>
                        {icOptions && (
                            <div className="ml-2 border-l pl-3 border-gray-200 dark:border-gray-700 hidden xl:block">
                                <ICOptionSummaryBar options={icOptions} stockEffect={0} />
                            </div>
                        )}
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
                                <th className="p-3 w-32 text-right font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">จำนวนขอโอนย้าย</th>
                                {hasPartialApproval && (
                                    <th className="p-3 w-32 text-right font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px] text-amber-200">อนุมัติไปแล้ว</th>
                                )}
                                <th className="p-3 w-32 text-right font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">จำนวนอนุมัติ <span className="text-emerald-200">*</span></th>
                                <th className="p-3 w-40 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">หน่วย</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">คลังต้นทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">ที่เก็บต้นทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">คลังปลายทาง</th>
                                <th className="p-3 w-48 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">ที่เก็บปลายทาง</th>
                                <th className="p-3 w-40 text-left font-bold border-r border-emerald-500/30 uppercase tracking-wider text-[11px]">Lot</th>
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

                                         {/* Requisition Qty */}
                                         <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                             <input
                                                 {...register(`lines.${index}.qty_ic`, { valueAsNumber: true })}
                                                 type="number"
                                                 readOnly
                                                 className={`${tableInputClass} text-right text-gray-500 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                                             />
                                         </td>

                                         {/* Already Approved Qty */}
                                         {hasPartialApproval && (
                                             <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                                 <input
                                                     {...register(`lines.${index}.approved_qty`, { valueAsNumber: true })}
                                                     type="number"
                                                     readOnly
                                                     className={`${tableInputClass} text-right text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/10 cursor-not-allowed border-amber-200 dark:border-amber-800/50`}
                                                 />
                                             </td>
                                         )}

                                         {/* Approved Qty */}
                                         <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                             <Controller
                                                 name={`lines.${index}.appv_stock_qty`}
                                                 control={control}
                                                 render={({ field: f }) => {
                                                     const reqQty = Number(field.qty_ic || 0);
                                                     const appvQty = Number(f.value || 0);
                                                     const isPartial = appvQty > 0 && appvQty < reqQty;
                                                     return (
                                                         <div>
                                                             <input
                                                                 {...f}
                                                                 type="number"
                                                                 disabled={readOnly}
                                                                 placeholder="0.00"
                                                                 onChange={(e) => f.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                                 className={`${tableInputClass} text-right font-bold ${
                                                                     lineErr?.appv_stock_qty
                                                                         ? 'border-red-500 text-red-600'
                                                                         : isPartial
                                                                             ? 'border-amber-400 ring-1 ring-amber-300 text-amber-600 dark:text-amber-400 focus:border-amber-500 focus:ring-amber-500'
                                                                             : 'text-emerald-600 focus:border-emerald-500 focus:ring-emerald-500'
                                                                 }`}
                                                             />
                                                             {lineErr?.appv_stock_qty && <span className="text-[10px] text-red-500 font-medium block mt-0.5">{lineErr.appv_stock_qty.message}</span>}
                                                             {isPartial && !lineErr?.appv_stock_qty && (
                                                                 <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                                                                     อนุมัติบางส่วน
                                                                 </span>
                                                             )}
                                                         </div>
                                                     );
                                                 }}
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
                    <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/10 border-t border-emerald-100 dark:border-emerald-800/30">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-auto">ยอดรวมอนุมัติ:</span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-500">{totalApprovedQty}</span>
                    </div>
                </div>

                {appvFlag === 'N' && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl space-y-2 animate-form-fade-in">
                        <label className="block text-sm font-bold text-red-600 dark:text-red-400">
                            เหตุผลในการปฏิเสธการอนุมัติ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('reject_reason')}
                            rows={3}
                            placeholder="โปรดระบุเหตุผลในการปฏิเสธ..."
                            className={`w-full p-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.reject_reason ? 'border-red-500 focus:ring-red-500/20' : 'border-red-300 dark:border-red-900/50 focus:border-red-500 focus:ring-red-500/20'}`}
                        />
                        {errors.reject_reason && (
                            <span className="text-xs text-red-500">{errors.reject_reason.message}</span>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

TransferApproveFormLines.displayName = 'TransferApproveFormLines';
