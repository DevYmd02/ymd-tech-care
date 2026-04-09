import { Plus, Trash2, Package, Search } from 'lucide-react';
import type { QuotationLineData } from '../types/quotation.types';
import type { UnitListItem } from '@/modules/master-data/inventory/types/product-types';

interface QuotationLineTableProps {
    lines: QuotationLineData[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof QuotationLineData, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    uoms?: UnitListItem[];
}

export function QuotationLineTable({ lines, onAddLine, onRemoveLine, onLineChange, onSearchProduct, uoms = [] }: QuotationLineTableProps) {
    const compactInputClass = "h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const headerThClass = "px-3 py-3 text-[10px] font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700";
    
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
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className={`${headerThClass} w-10 text-center`}>#</th>
                            <th className={`${headerThClass} min-w-[180px]`}>รหัสสินค้า (ITEM CODE)</th>
                            <th className={`${headerThClass} min-w-[220px]`}>ชื่อสินค้า (ITEM NAME)</th>
                            <th className={`${headerThClass} w-24 text-right`}>จำนวน (QTY)</th>
                            <th className={`${headerThClass} w-28`}>หน่วย (UOM)</th>
                            <th className={`${headerThClass} w-28 text-right`}>ราคา/หน่วย</th>
                            <th className={`${headerThClass} w-28 text-right`}>ส่วนลด</th>
                            <th className={`${headerThClass} w-28 text-right`}>ยอดสุทธิ</th>
                            <th className={`${headerThClass} w-14 text-center`}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {lines.map((line, index) => (
                            <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
                                <td className="px-2 py-1.5 text-center text-gray-500 font-medium">
                                    {index + 1}
                                </td>
                                <td className="px-2 py-1.5">
                                    <div className="flex gap-1">
                                        <input 
                                            value={line.item_code || ''}
                                            readOnly
                                            className={`${compactInputClass} bg-gray-50/50 italic cursor-not-allowed`}
                                            placeholder="รหัสสินค้า"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => onSearchProduct?.(index)}
                                            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center"
                                        >
                                            <Search size={14} />
                                        </button>
                                    </div>
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
                                        type="text" 
                                        value={line.qty || ''} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                onLineChange(index, 'qty', val === '' ? 0 : parseFloat(val));
                                            }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="0"
                                        className={`${compactInputClass} text-right`}
                                    />
                                </td>
                                <td className="px-2 py-1.5">
                                    <select 
                                        value={line.uom_id || ''} 
                                        onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                        className={compactInputClass}
                                    >
                                        <option value="">-- หน่วย --</option>
                                        {uoms.map((u) => (
                                            <option key={String(u.id || u.unit_id)} value={String(u.id || u.unit_id)}>
                                                {u.unit_name || u.uom_name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-2 py-1.5">
                                    <input 
                                        type="text" 
                                        value={line.unit_price || ''} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                onLineChange(index, 'unit_price', val === '' ? 0 : parseFloat(val));
                                            }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="0.00"
                                        className={`${compactInputClass} text-right font-medium text-blue-600`}
                                    />
                                </td>
                                <td className="px-2 py-1.5">
                                    <input 
                                        type="text" 
                                        value={line.line_discount_input ?? ''} 
                                        onChange={(e) => onLineChange(index, 'line_discount_input', e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="0%"
                                        className={`${compactInputClass} text-right`}
                                    />
                                </td>
                                <td className="px-2 py-1.5 text-right font-bold text-gray-900 dark:text-white text-sm">
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
