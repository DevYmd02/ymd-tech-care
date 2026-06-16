/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Package } from 'lucide-react';
import type { TransferOutFormValues } from '../schemas/transfer-out.schemas';
import { ICOptionSummaryBar, type ICOption } from '@/shared/ic-option';

interface Props {
    warehouses?: any[];
    uoms?: any[];
    readOnly?: boolean;
    icOptions?: ICOption;
}

export const TransferOutFormLines: React.FC<Props> = ({ warehouses, uoms, icOptions }) => {
    const { control, watch } = useFormContext<TransferOutFormValues>();
    
    const { fields } = useFieldArray({
        control,
        name: 'lines'
    });
    
    const formStockEffect = watch('stock_effect_ic');
    const stockEffect = (formStockEffect !== undefined && formStockEffect !== null) 
        ? formStockEffect 
        : (icOptions?.stock_effect ?? -1);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 shrink-0">
                    <Package size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้า — Item Lines</h3>
                    {icOptions && (
                        <div className="ml-2 border-l pl-3 border-gray-200 dark:border-gray-700 hidden xl:block">
                            <ICOptionSummaryBar options={icOptions} stockEffect={stockEffect} />
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
                <table className="w-full min-w-[2400px] border-collapse text-sm">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-amber-600 text-white border-b border-amber-500/30">
                            <th className="p-3 w-12 text-center font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">ลำดับ</th>
                            <th className="p-3 w-48 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">รหัสสินค้า (Item ID)</th>
                            <th className="p-3 min-w-[300px] text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">ชื่อสินค้า</th>
                            <th className="p-3 w-32 text-right font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">จำนวน</th>
                            <th className="p-3 w-32 text-right font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">อนุมัติแล้ว</th>
                            <th className="p-3 w-40 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">หน่วย</th>
                            <th className="p-3 w-48 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">คลังต้นทาง</th>
                            <th className="p-3 w-48 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">ที่เก็บต้นทาง</th>
                            <th className="p-3 w-48 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">คลังปลายทาง</th>
                            <th className="p-3 w-48 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">ที่เก็บปลายทาง</th>
                            <th className="p-3 w-40 text-left font-bold border-r border-amber-500/30 uppercase tracking-wider text-[11px]">รหัสล็อต</th>
                            <th className="p-3 min-w-[200px] text-left font-bold uppercase tracking-wider text-[11px]">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                        {fields.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="p-8 text-center text-gray-400 dark:text-gray-500 italic">
                                    ไม่มีรายการสินค้า
                                </td>
                            </tr>
                        ) : (
                            fields.map((field: any, index) => {
                                const uomFound = uoms?.find((u: any) => String(u.uom_id || u.id) === String(field.uom_id));
                                const uomName = (field.uom_name && String(field.uom_name) !== String(field.uom_id)) ? field.uom_name : (uomFound?.uom_name || uomFound?.uom_name_th || uomFound?.uom_name_en || field.uom_id || '-');
                                const fromWhName = warehouses?.find((w: any) => String(w.warehouse_id) === String(field.from_warehouse_id))?.warehouse_name || field.from_warehouse_id || '-';
                                const toWhName = warehouses?.find((w: any) => String(w.warehouse_id) === String(field.to_warehouse_id))?.warehouse_name || field.to_warehouse_id || '-';
                                const fromLocDisplay = field.from_location_name || field.from_location_code || field.from_location_id || '-';
                                const toLocDisplay = field.to_location_name || field.to_location_code || field.to_location_id || '-';
                                const lotDisplay = field.lot_no || field.lot_number || field.lot_id || '-';
                                
                                const inputClass = "w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 cursor-not-allowed shadow-sm focus:outline-none";

                                return (
                                    <tr key={field._id || index} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors group">
                                        <td className="p-3 text-center text-gray-500 font-medium border-r border-gray-100 dark:border-gray-800">
                                            {index + 1}
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={`${inputClass} font-semibold`} value={field.item_code || field.item_id || '-'} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={`${inputClass} italic`} value={field.item_name || field.item_desc || '-'} title={field.item_name || field.item_desc || '-'} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={`${inputClass} text-right font-bold text-amber-600`} value={Number(field.req_qty || field.qty || 0).toLocaleString()} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={`${inputClass} text-right font-bold text-emerald-600`} value={Number(field.qty_approved || 0).toLocaleString()} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={inputClass} value={uomName} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={inputClass} value={fromWhName} title={fromWhName} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={inputClass} value={fromLocDisplay} title={fromLocDisplay} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={inputClass} value={toWhName} title={toWhName} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={inputClass} value={toLocDisplay} title={toLocDisplay} />
                                        </td>
                                        <td className="p-2 border-r border-gray-100 dark:border-gray-800">
                                            <input type="text" readOnly className={inputClass} value={lotDisplay} title={lotDisplay} />
                                        </td>
                                        <td className="p-2">
                                            <input type="text" readOnly className={`${inputClass} !bg-white dark:!bg-gray-800`} value={field.remarks || field.remark || ''} placeholder="-" title={field.remarks || field.remark || ''} />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-end pt-2">
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    รวมทั้งสิ้น: <span className="text-amber-600 dark:text-amber-400 ml-1">{fields.length}</span> รายการ
                </div>
            </div>
        </section>
    );
};
