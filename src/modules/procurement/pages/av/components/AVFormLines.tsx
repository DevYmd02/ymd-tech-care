import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FileBox, AlertTriangle } from 'lucide-react';
import type { AVFormData, AVLineFormData } from '../schemas/av.schema';

interface AVFormLinesProps {
    lines: AVLineFormData[];
    updateLine: (index: number, field: keyof AVLineFormData, value: boolean | number | string) => void;
    readOnly?: boolean;
}

export const AVFormLines: React.FC<AVFormLinesProps> = React.memo(({
    lines,
    updateLine,
    readOnly = false
}) => {
    const { register, watch: watchForm } = useFormContext<AVFormData>();
    const watchedLines = watchForm('lines') as AVLineFormData[];
    const headerVendorId = watchForm('preferred_vendor_id');

    const tableInputClass = 'w-full h-8 px-3 text-sm border border-gray-300 dark:border-gray-600 !rounded-xl text-gray-900 bg-gray-50 dark:bg-gray-800 dark:text-white transition-all focus:outline-none';
    const lockedInputClass = 'w-full h-8 px-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 !rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-sm';
    const tdBaseClass = 'p-1 border-r border-gray-200 dark:border-gray-700';

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center font-bold text-gray-700 dark:text-gray-200">
                    <FileBox className="text-blue-600 mr-2" size={20} />
                    รายการสินค้าที่ขออนุมัติ (Products Approval)
                </div>
            </div>

            {/* Table */}
            <div className="p-0 overflow-x-auto">
                <table className="w-full min-w-[1400px] border-collapse bg-white dark:bg-gray-900 text-sm">
                    <thead className="bg-blue-600 text-white text-xs">
                        <tr>
                            <th className="p-2 w-10 text-center border-r border-blue-500 sticky left-0 z-20 bg-blue-600">✓</th>
                            <th className="p-2 w-10 text-center border-r border-blue-500 sticky left-[40px] z-20 bg-blue-600">No.</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">รหัสสินค้า</th>
                            <th className="p-2 min-w-[180px] text-center border-r border-blue-500">ชื่อสินค้า</th>
                            <th className="p-2 w-16 text-center border-r border-blue-500">คลัง</th>
                            <th className="p-2 w-16 text-center border-r border-blue-500">ที่เก็บ</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">หน่วยนับ</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500 bg-blue-700">จำนวนที่ขอ</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500 bg-green-600">ยอดอนุมัติ</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">ราคา/หน่วย</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด (บาท)</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">จำนวนเงิน</th>
                            <th className="p-2 min-w-[150px] text-center">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((_, index) => {
                            const line = watchedLines[index] || {};
                            const isApproved = !!line.is_approved;
                            const approvedQty = Number(line.approved_qty) || 0;
                            const requestedQty = Number(line.requested_qty || line.qty) || 0;
                            
                            const lineDiscount = line.discount || 0;
                            const lineTotal = isApproved ? Math.max(0, (approvedQty * (line.est_unit_price || 0)) - lineDiscount) : 0;
                            
                            // Detect Duplicate Line item_id
                            const isDuplicateItem = watchedLines.some((l, idx) => 
                                idx !== index && 
                                l.item_id && 
                                line.item_id && 
                                Number(l.item_id) === Number(line.item_id)
                            );

                            return (
                                <tr key={index} className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${!isApproved ? 'bg-gray-100/50 dark:bg-gray-800/50 opacity-60' : 'hover:bg-blue-50 dark:hover:bg-gray-800'}`}>
                                    <td className="p-1 text-center border-r border-gray-300 dark:border-gray-600 sticky left-0 z-10 bg-slate-100 dark:bg-slate-800">
                                        <input
                                          type="checkbox"
                                          disabled={readOnly}
                                          checked={isApproved}
                                          onChange={(e) => updateLine(index, 'is_approved', e.target.checked)}
                                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                        />
                                    </td>
                                    <td className="p-1 text-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-r border-gray-300 dark:border-gray-600 sticky left-[40px] z-10">{index + 1}</td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className="flex items-center gap-1">
                                            {isDuplicateItem && (
                                                <span className="flex-shrink-0 text-red-500" title="รายการสินค้านี้ซ้ำ"><AlertTriangle size={14} /></span>
                                            )}
                                            {line.item_id && headerVendorId && line._item_vendor_id && line._item_vendor_id !== headerVendorId && (
                                                <span className="flex-shrink-0 text-amber-500" title="สินค้านี้ปกติจัดซื้อจากผู้ขายรายอื่น"><AlertTriangle size={14} /></span>
                                            )}
                                            <input 
                                                value={line.item_code || ''} 
                                                readOnly
                                                className={`${lockedInputClass} text-center flex-1`} 
                                            />
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <input 
                                            value={line.item_name || ''} 
                                            readOnly
                                            className={lockedInputClass} 
                                        />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className={`${lockedInputClass} w-full text-center flex items-center justify-center`}>
                                            <span className="truncate">{line.warehouse_code || line.warehouse_id || '-'}</span>
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className={`${lockedInputClass} w-full text-center flex items-center justify-center`}>
                                            <span className="truncate">{line.location_name || line.location || '-'}</span>
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className={`${lockedInputClass} text-center flex items-center justify-center`}>
                                            {line.uom || '-'}
                                        </div>
                                    </td>
                                    
                                    <td className={`${tdBaseClass} bg-blue-50 dark:bg-blue-900/10`}>
                                        <div className="w-full h-8 px-3 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {requestedQty.toLocaleString()}
                                        </div>
                                    </td>

                                    <td className={`${tdBaseClass} bg-green-50 dark:bg-green-900/10`}>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                {...register(`lines.${index}.approved_qty`, { 
                                                    valueAsNumber: true,
                                                    onChange: (e) => updateLine(index, 'approved_qty', parseFloat(e.target.value) || 0)
                                                })} 
                                                disabled={!isApproved || readOnly}
                                                className={`w-full h-8 px-3 text-sm text-center font-bold bg-white dark:bg-gray-800 border !rounded-xl focus:outline-none focus:ring-2 shadow-sm transition-all 
                                                    ${!isApproved ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-700' : ''} 
                                                    ${isApproved && approvedQty > requestedQty ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-green-300 dark:border-green-700 text-green-700 focus:ring-green-500'}`} 
                                            />
                                            {isApproved && approvedQty !== requestedQty && approvedQty > 0 && (
                                                <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-4 rounded-full ${approvedQty > requestedQty ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} 
                                                     title={approvedQty > requestedQty ? "ยอดอนุมัติเกินยอดขอซื้อ" : "ยอดอนุมัติถูกแก้ไข"} />
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className={`${lockedInputClass} text-center flex items-center justify-center`}>
                                            {Number(line.est_unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className={`${lockedInputClass} text-center flex items-center justify-center`}>
                                            {line.line_discount_raw || '-'}
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className="px-2 h-8 flex items-center justify-end text-gray-700 dark:text-gray-300 text-sm">
                                            {line.discount ? line.discount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </div>
                                    </td>
                                    
                                    <td className={`${tdBaseClass} text-right font-bold pr-2 flex items-center justify-end h-8 text-gray-700 dark:text-gray-300`}>
                                        {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    
                                    <td className="p-1">
                                        <input 
                                            type="text" 
                                            {...register(`lines.${index}.remark`)} 
                                            disabled={!isApproved || readOnly}
                                            placeholder="หมายเหตุ..."
                                            className={`${tableInputClass} ${!isApproved ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-500 focus:bg-white'} bg-white`} 
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

AVFormLines.displayName = 'AVFormLines';
