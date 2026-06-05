import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Package } from 'lucide-react';
import type { RequisitionApproveFormData } from '../schemas/requisition-approval.schemas';
import { formatNumber } from '@/shared/utils';

export const RequisitionApproveFormLines: React.FC = () => {
    const { register, watch, setValue } = useFormContext<RequisitionApproveFormData>();
    const lines = watch('lines') || [];
    const status = watch('status');
    const isFinalized = status === 'APPROVED' || status === 'REJECTED';

    const thClass = "px-4 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50";
    const tdClass = "px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800";

    const allChecked = lines.length > 0 && lines.every((_, index) => watch(`lines.${index}.is_approved`));

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        lines.forEach((_, index) => {
            setValue(`lines.${index}.is_approved`, checked);
        });
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Package size={20} strokeWidth={2.5} />
                <h3 className="text-lg font-bold">รายการสินค้า — Transaction Lines</h3>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                <table className="w-full min-w-[1000px] border-collapse text-left">
                    <thead>
                        <tr>
                            <th className={`${thClass} text-center w-[50px]`}>
                                <input
                                    type="checkbox"
                                    disabled={isFinalized}
                                    checked={allChecked}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </th>
                            <th className={`${thClass} text-center w-[60px]`}>ลำดับ</th>
                            <th className={`${thClass} w-[150px]`}>รหัสสินค้า</th>
                            <th className={thClass}>ชื่อสินค้า</th>
                            <th className={`${thClass} w-[100px] text-center`}>หน่วย</th>
                            <th className={`${thClass} w-[110px] text-right`}>จำนวนเบิก</th>
                            <th className={`${thClass} w-[130px] text-right`}>จำนวนอนุมัติ</th>
                            <th className={`${thClass} w-[130px]`}>คลัง</th>
                            <th className={`${thClass} w-[130px]`}>ที่เก็บ</th>
                            <th className={`${thClass} w-[120px]`}>Lot No.</th>
                            <th className={thClass}>หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900/30">
                        {lines.length > 0 ? (
                            lines.map((line, idx) => {
                                const isLineApproved = watch(`lines.${idx}.is_approved`);
                                return (
                                    <tr key={line.docu_item_line_id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                        <td className={`${tdClass} text-center`}>
                                            <input
                                                type="checkbox"
                                                disabled={isFinalized}
                                                {...register(`lines.${idx}.is_approved`)}
                                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        <td className={`${tdClass} text-center font-medium`}>{line.listno}</td>
                                        <td className={`${tdClass} font-semibold text-gray-700 dark:text-gray-300`}>{line.item_code || '-'}</td>
                                        <td className={tdClass}>
                                            <div className="font-semibold text-gray-900 dark:text-white">{line.item_name || '-'}</div>
                                        </td>
                                        <td className={`${tdClass} text-center`}>{line.uom_id || '-'}</td>
                                        <td className={`${tdClass} text-right font-bold text-gray-600 dark:text-gray-400`}>
                                            {formatNumber(line.qty_ic)}
                                        </td>
                                        <td className={`${tdClass} text-right`}>
                                            <input
                                                type="number"
                                                step="any"
                                                disabled={isFinalized || !isLineApproved}
                                                {...register(`lines.${idx}.qty_approved`, { valueAsNumber: true })}
                                                className="w-24 px-2 py-1 text-right text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800/50"
                                            />
                                        </td>
                                        <td className={`${tdClass} truncate max-w-[130px]`}>{line.warehouse_name || line.warehouse_id || '-'}</td>
                                        <td className={`${tdClass} truncate max-w-[130px]`}>{line.location_name || line.location_id || '-'}</td>
                                        <td className={tdClass}>
                                            {line.lot_no ? (
                                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold font-mono">
                                                    {line.lot_no}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">-</span>
                                            )}
                                        </td>
                                        <td className={`${tdClass} text-gray-500 italic max-w-[150px] truncate`}>{line.remark || '-'}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={11} className="px-4 py-8 text-center text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/10">
                                    ไม่มีรายการสินค้า
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

