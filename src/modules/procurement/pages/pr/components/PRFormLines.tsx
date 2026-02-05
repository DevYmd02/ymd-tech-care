import React from 'react';
import { FileBox, Eraser, Plus, Trash2 } from 'lucide-react';

import type { ExtendedLine } from '../../../hooks/usePRForm';

interface PRFormLinesProps {
    lines: ExtendedLine[];
    updateLine: (index: number, field: keyof ExtendedLine, value: string | number) => void;
    removeLine: (index: number) => void;
    addLine: () => void;
    handleClearLines: () => void;
    openProductSearch: (index: number) => void;
}

export const PRFormLines: React.FC<PRFormLinesProps> = ({
    lines,
    updateLine,
    removeLine,
    addLine,
    handleClearLines,
    openProductSearch
}) => {
    const tableInputClass = 'w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 !rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 dark:text-white shadow-sm transition-all';
    const tdBaseClass = 'p-1 border-r border-gray-200 dark:border-gray-700';

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center font-bold text-gray-700 dark:text-gray-200">
                    <FileBox className="text-blue-600 mr-2" size={20} />
                    รายการสินค้า (Products)
                </div>
                <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                    <Plus size={14} /> เพิ่มรายการ
                </button>
            </div>
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
                            <th className="p-2 w-24 text-center border-r border-blue-500">จำนวนเงิน</th>
                            <th className="p-2 w-24 text-center">
                                <button type="button" onClick={handleClearLines} className="text-white hover:text-red-200"><Eraser size={14} /></button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="p-1 text-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-r border-gray-300 dark:border-gray-600 sticky left-0 z-10">{index + 1}</td>
                                <td className={tdBaseClass}><div className="flex gap-1"><input value={line.item_code} readOnly className={`${tableInputClass} text-center`} /><button type="button" onClick={() => openProductSearch(index)} className="bg-blue-600 text-white p-1 rounded"><Plus size={14} /></button></div></td>
                                <td className={tdBaseClass}><input value={line.item_name} onChange={(e) => updateLine(index, 'item_name', e.target.value)} className={tableInputClass} /></td>
                                <td className={tdBaseClass}><input value={line.warehouse || ''} onChange={(e) => updateLine(index, 'warehouse', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                                <td className={tdBaseClass}><input value={line.location || ''} onChange={(e) => updateLine(index, 'location', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                                <td className={tdBaseClass}><input value={line.uom} onChange={(e) => updateLine(index, 'uom', e.target.value)} className={`${tableInputClass} text-center`} /></td>
                                <td className={tdBaseClass}><input type="number" value={line.quantity || ''} onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-center`} /></td>
                                <td className={tdBaseClass}><input type="number" value={line.est_unit_price || ''} onChange={(e) => updateLine(index, 'est_unit_price', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-right`} /></td>
                                <td className={tdBaseClass}><input type="number" value={line.discount || ''} onChange={(e) => updateLine(index, 'discount', parseFloat(e.target.value) || 0)} className={`${tableInputClass} text-right`} /></td>
                                <td className={tdBaseClass}><div className={`${tableInputClass} text-right bg-blue-50/50 flex items-center justify-end font-semibold text-blue-700`}>{(line.est_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div></td>
                                <td className="p-1 text-center flex justify-center gap-1">
                                    <button type="button" onClick={() => removeLine(index)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
