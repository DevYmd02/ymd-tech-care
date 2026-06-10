import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Calculator } from 'lucide-react';
import type { RequisitionApproveFormData } from '../schemas/requisition-approval.schemas';
import { formatNumber } from '@/shared/utils';

export const RequisitionApproveFormSummary: React.FC = () => {
    const { watch, control } = useFormContext<RequisitionApproveFormData>();
    const watchedLines = watch('lines');
    const lines = React.useMemo(() => watchedLines || [], [watchedLines]);
    const status = watch('status') as 'PENDING' | 'APPROVED' | 'REJECTED';

    // Calculate total approved qty dynamically
    const qtyTotal = React.useMemo(() => {
        if (status === 'REJECTED') return 0;
        return lines.reduce((sum, l) => sum + (l.is_approved ? Number(l.qty_approved || 0) : 0), 0);
    }, [lines, status]);

    // Group and sum quantities by UOM name
    const uomSummary = React.useMemo(() => {
        const groups: Record<string, { uom_name: string; qty_ic: number; qty_approved: number; conversion_info?: string }> = {};
        lines.forEach(l => {
            const uomName = l.uom_name || '-';
            const rawL = l as Record<string, unknown>;
            if (!groups[uomName]) {
                groups[uomName] = { uom_name: uomName, qty_ic: 0, qty_approved: 0 };
            }
            groups[uomName].qty_ic += Number(l.qty_ic || 0);
            
            const appQty = status === 'REJECTED' ? 0 : (l.is_approved ? Number(l.qty_approved || 0) : 0);
            groups[uomName].qty_approved += appQty;
            
            const factor = Number(rawL.conversion_factor);
            const toUomName = String(rawL.to_uom_name || '');
            if (factor > 1 && toUomName) {
                groups[uomName].conversion_info = `(1 ${uomName} = ${factor} ${toUomName})`;
            }
        });
        return Object.values(groups);
    }, [lines, status]);

    return (
        <section className="flex flex-col lg:flex-row justify-between gap-8 mt-6">
            {/* Left side: Approval notes and reject reason input */}
            <div className="flex-1 space-y-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic leading-relaxed">
                        * กรุณาตรวจสอบข้อมูลรายการสินค้า คลังสินค้า ที่เก็บ และล็อตให้ถูกต้องก่อนทำการตัดสินใจอนุมัติ 
                        หากปฏิเสธการอนุมัติ (Reject) จำเป็นต้องระบุเหตุผลในการปฏิเสธด้วยทุกครั้ง
                    </p>
                </div>

                {status === 'REJECTED' && (
                    <div className="space-y-1.5 animate-form-fade-in">
                        <label className="block text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">
                            เหตุผลในการปฏิเสธการอนุมัติ <span className="text-red-500">*</span>
                        </label>
                        <Controller
                            name="reject_reason"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    placeholder="ระบุเหตุผลในการปฏิเสธ..."
                                    rows={3}
                                    className="w-full p-3 text-sm bg-white dark:bg-gray-800 border border-red-300 focus:border-red-500 dark:border-red-900/50 dark:focus:border-red-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 text-gray-900 dark:text-white transition-all shadow-sm"
                                />
                            )}
                        />
                    </div>
                )}
            </div>

            {/* Right side: Requisition Stats Summary Card */}
            <div className="w-full lg:w-[360px] space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-sm">
                    <Calculator size={18} />
                    <span>สรุปข้อมูลการขอเบิก</span>
                </div>

                <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                        <span className="font-medium">จำนวนรายการสินค้า:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {lines.length} รายการ
                        </span>
                    </div>
                </div>

                {/* UOM Breakdown summary */}
                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                        ยอดรวมอนุมัติแยกตามหน่วย
                    </span>
                    <div className="space-y-2">
                        {uomSummary.map((group, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 dark:text-gray-400 font-semibold">{group.uom_name}</span>
                                    {group.conversion_info && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                            {group.conversion_info}
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-emerald-600 dark:text-emerald-500">
                                        {formatNumber(group.qty_approved)}
                                    </span>
                                    {group.qty_approved !== group.qty_ic && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                            (จาก {formatNumber(group.qty_ic)})
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-black text-gray-400 uppercase">TOTAL APPROVED QTY</span>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter">
                                {formatNumber(qtyTotal)}
                            </span>
                        </div>
                        <div className="mt-1">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest">
                                หน่วยรวมทุกประเภท
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
