import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FileBox, Eraser, Plus, Trash2, Search } from 'lucide-react';

import type { ExtendedLine } from '@/modules/procurement/hooks/usePRForm';
import type { PRFormData } from '@/modules/procurement/types/pr-types';

interface PRFormLinesProps {
    updateLine: (index: number, field: keyof ExtendedLine, value: string | number | undefined) => void;
    removeLine: (index: number) => void;
    clearLine: (index: number) => void;
    addLine: () => void;
    handleClearLines: () => void;
    openProductSearch: (index: number) => void;
}

export const PRFormLines: React.FC<PRFormLinesProps> = React.memo(({
    updateLine,
    removeLine,
    clearLine,
    addLine,
    handleClearLines,
    openProductSearch
}) => {
    const { control } = useFormContext<PRFormData>();
    const { fields } = useFieldArray({
        control,
        name: 'lines'
    });

    const tableInputClass = 'w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 !rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 dark:text-white shadow-sm transition-all';
    const tdBaseClass = 'p-1 border-r border-gray-200 dark:border-gray-700';

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center font-bold text-gray-700 dark:text-gray-200">
                    <FileBox className="text-blue-600 mr-2" size={20} />
                    รายการสินค้า (Products)
                </div>
            </div>

            {/* Table */}
            <div className="p-0 overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse bg-white dark:bg-gray-900 text-sm">
                    <thead className="bg-blue-600 text-white text-xs">
                        <tr>
                            <th className="p-2 w-12 text-center border-r border-blue-500 sticky left-0 z-10 bg-blue-600">No.</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">รหัสสินค้า</th>
                            <th className="p-2 min-w-[180px] text-center border-r border-blue-500">ชื่อสินค้า</th>
                            <th className="p-2 w-16 text-center border-r border-blue-500">คลัง</th>
                            <th className="p-2 w-16 text-center border-r border-blue-500">ที่เก็บ</th>
                            <th className="p-2 w-28 text-center border-r border-blue-500">หน่วยนับ</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">จำนวน</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">ราคา/หน่วย</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด (บาท)</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">จำนวนเงิน</th>
                            <th className="p-2 w-24 text-center">
                                <button 
                                    type="button" 
                                    onClick={handleClearLines} 
                                    className="text-white hover:text-red-200 transition-colors"
                                    title="ล้างค่าทั้งหมด"
                                >
                                    <Eraser size={14} />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, index) => {
                            const line = field as unknown as ExtendedLine;
                            const lineDiscount = line.discount || 0;
                            const lineTotal = ((line.quantity || 0) * (line.est_unit_price || 0)) - lineDiscount;
                            return (
                                <tr key={field.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="p-1 text-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-r border-gray-300 dark:border-gray-600 sticky left-0 z-10">{index + 1}</td>
                                    <td className={tdBaseClass}><input value={line.item_code} onChange={(e) => updateLine(index, 'item_code', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                                    <td className={tdBaseClass}><input value={line.item_name} onChange={(e) => updateLine(index, 'item_name', e.target.value)} className={tableInputClass} /></td>
                                    <td className={tdBaseClass}><input value={line.warehouse || ''} onChange={(e) => updateLine(index, 'warehouse', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                                    <td className={tdBaseClass}><input value={line.location || ''} onChange={(e) => updateLine(index, 'location', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                                    <td className={tdBaseClass}>
                                        <input 
                                            type="text"
                                            value={line.uom} 
                                            onChange={(e) => updateLine(index, 'uom', e.target.value)} 
                                            className={`${tableInputClass} text-center`}
                                        />
                                    </td>
                                    <td className={tdBaseClass}><input type="number" value={line.quantity || ''} onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-center`} /></td>
                                    <td className={tdBaseClass}><input type="number" value={line.est_unit_price || ''} onChange={(e) => updateLine(index, 'est_unit_price', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-center`} /></td>
                                    <td className={tdBaseClass}>
                                        <input 
                                            type="text" 
                                            value={line.discount_input || ''} 
                                            onChange={(e) => updateLine(index, 'discount_input', e.target.value)} 
                                            className={`${tableInputClass} text-center`} 
                                        />
                                    </td>
                                    <td className={tdBaseClass}>
                                        <div className="px-2 text-right text-gray-700 dark:text-gray-300">
                                            {line.discount ? line.discount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </div>
                                    </td>
                                    <td className={`${tdBaseClass} text-right font-bold pr-2 text-gray-700 dark:text-gray-300`}>{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    
                                    {/* Action Buttons: Search, Eraser, Trash */}
                                    <td className="p-1">
                                        <div className="flex justify-center items-center space-x-2 h-8">
                                            <button type="button" className="text-blue-600 hover:text-blue-800 transition-colors" title="ค้นหา" onClick={() => openProductSearch(index)}><Search size={16} /></button>
                                            <button type="button" className="text-orange-500 hover:text-orange-700 transition-colors" onClick={() => clearLine(index)} title="ล้างค่า"><Eraser size={16} /></button>
                                            <button type="button" className="text-red-500 hover:text-red-700 transition-colors" onClick={() => removeLine(index)} title="ลบ"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer: Add Button */}
            <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={addLine} className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-xs font-bold shadow-sm transition-colors">
                    <Plus size={14} className="mr-1" /> เพิ่มรายการ
                </button>
            </div>
        </div>
    );
});

PRFormLines.displayName = 'PRFormLines';
