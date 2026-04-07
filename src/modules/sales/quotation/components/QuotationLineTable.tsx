import { Plus, Trash2, Package } from 'lucide-react';
import type { QuotationLineData } from '../types/quotation.types';

interface QuotationLineTableProps {
    lines: QuotationLineData[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof QuotationLineData, value: string | number) => void;
}

export function QuotationLineTable({ lines, onAddLine, onRemoveLine, onLineChange }: QuotationLineTableProps) {
    const compactInputClass = "h-8 w-full px-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors disabled:bg-gray-50 dark:disabled:bg-gray-800/50";
    
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Package size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้า/บริการ — Line Items</h3>
                </div>
                <button 
                    type="button" 
                    onClick={onAddLine}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                >
                    <Plus size={16} strokeWidth={3} />
                    เพิ่มรายการ
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-2 py-2 w-10 text-center">#</th>
                            <th className="px-2 py-2 min-w-[180px]">รหัสสินค้า (ITEM_ID)</th>
                            <th className="px-2 py-2 min-w-[220px]">ชื่อสินค้า (ITEM NAME)</th>
                            <th className="px-2 py-2 w-24 text-right">จำนวน (QTY)</th>
                            <th className="px-2 py-2 w-28">หน่วย (UOM_ID)</th>
                            <th className="px-2 py-2 w-36 text-right">ราคา/หน่วย (UNIT_PRICE)</th>
                            <th className="px-2 py-2 w-32 text-right">ส่วนลด (LINE_DISCOUNT)</th>
                            <th className="px-2 py-2 w-36 text-right">ยอดสุทธิ (LINE_TOTAL)</th>
                            <th className="px-2 py-2 w-14 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {lines.map((line, index) => (
                            <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
                                <td className="px-2 py-1.5 text-center text-gray-500 font-medium">
                                    {index + 1}
                                </td>
                                <td className="px-2 py-1.5">
                                    <select 
                                        value={line.item_id || ''} 
                                        onChange={(e) => onLineChange(index, 'item_id', e.target.value)}
                                        className={compactInputClass}
                                    >
                                        <option value="">-- เลือกสินค้า --</option>
                                    </select>
                                </td>
                                <td className="px-2 py-1.5">
                                    <input 
                                        type="text" 
                                        value={line.item_name || ''} 
                                        className={`${compactInputClass} bg-gray-50 italic cursor-not-allowed`}
                                        placeholder="ชื่อสินค้าอัตโนมัติ"
                                        readOnly
                                    />
                                </td>
                                <td className="px-2 py-1.5">
                                    <input 
                                        type="number" 
                                        value={line.qty || 0} 
                                        onChange={(e) => onLineChange(index, 'qty', parseFloat(e.target.value))}
                                        className={`${compactInputClass} text-right`}
                                    />
                                </td>
                                <td className="px-2 py-1.5">
                                    <select 
                                        value={line.uom_id || ''} 
                                        onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                        className={compactInputClass}
                                    >
                                        <option value="PCS">PCS</option>
                                        <option value="SET">SET</option>
                                    </select>
                                </td>
                                <td className="px-2 py-1.5">
                                    <input 
                                        type="number" 
                                        value={line.unit_price || 0} 
                                        onChange={(e) => onLineChange(index, 'unit_price', parseFloat(e.target.value))}
                                        className={`${compactInputClass} text-right font-medium text-blue-600`}
                                    />
                                </td>
                                <td className="px-2 py-1.5">
                                    <input 
                                        type="number" 
                                        value={line.line_discount || 0} 
                                        onChange={(e) => onLineChange(index, 'line_discount', parseFloat(e.target.value))}
                                        className={`${compactInputClass} text-right`}
                                    />
                                </td>
                                <td className="px-2 py-1.5 text-right font-bold text-gray-900 dark:text-white text-xs">
                                    {(line.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => onRemoveLine(index)}
                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {lines.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-10 text-center text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
                                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                                    ไม่มีรายการสินค้า กรุณาคลิกเพื่อเพิ่มรายการ
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
