import { Plus, Trash2, Package, Search, AlertCircle, Loader2, Tag } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { DeepPartial } from 'react-hook-form';
import type { QuotationLineValues, QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import type { UnitListItem } from '@/modules/master-data/inventory/types/product-types';

interface QuotationLineTableProps {
    lines: DeepPartial<QuotationLineValues>[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof QuotationLineValues, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    onQtyBlur?: (index: number) => void;
    loadingPriceLines?: Set<number>;
    uoms?: UnitListItem[];
    readOnly?: boolean;
}

const PRICE_SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
    PRICE_LIST:     { label: 'Price List',  cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' },
    PRICE_LEVEL:    { label: 'Price Level', cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50' },
    MANUAL:         { label: 'Manual',      cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50' },
};

export function QuotationLineTable({ lines, onAddLine, onRemoveLine, onLineChange, onSearchProduct, onQtyBlur, loadingPriceLines = new Set(), uoms = [], readOnly = false }: QuotationLineTableProps) {
    const { formState: { errors } } = useFormContext<QuotationFormValues>();
    
    const compactInputClass = "h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    
    const getLineError = (index: number) => {
        if (!errors.lines || !Array.isArray(errors.lines)) return undefined;
        return errors.lines[index];
    };

    const hasLineFieldError = (index: number, fieldName: keyof QuotationLineValues) => {
        const lineError = getLineError(index);
        return !!(lineError as Record<string, unknown> | undefined)?.[fieldName];
    };

    const getFieldErrorClass = (index: number, fieldName: keyof QuotationLineValues) => {
        return hasLineFieldError(index, fieldName) ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500/50" : "";
    };


    const headerThClass = "px-3 py-3 text-xs font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap";
    
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Package size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้า/บริการ — Line Items</h3>
                </div>
                {!readOnly && (
                    <button 
                        type="button" 
                        onClick={onAddLine}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        เพิ่มรายการ
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                             <th className={`${headerThClass} w-10 text-center`}>ลำดับ</th>
                             <th className={`${headerThClass} min-w-[180px]`}>รหัสสินค้า (ITEM CODE)</th>
                             <th className={`${headerThClass} min-w-[380px]`}>ชื่อสินค้า (ITEM NAME)</th>
                             <th className={`${headerThClass} w-24 text-right`}>จำนวน (QTY)</th>
                             <th className={`${headerThClass} w-32`}>หน่วย (UOM)</th>
                             <th className={`${headerThClass} w-28 text-right`}>ราคา/หน่วย</th>
                             <th className={`${headerThClass} w-28 text-right`}>ส่วนลด</th>
                             <th className={`${headerThClass} min-w-[180px]`}>หมายเหตุ (REMARK)</th>
                             <th className={`${headerThClass} w-32 text-right`}>ยอดสุทธิ</th>
                             <th className={`${headerThClass} w-14 text-center`}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {lines.map((line, index) => {
                            const isFetchingPrice = loadingPriceLines.has(index);
                            
                            // 🧪 DEBUG: See what exactly comes from the backend per line
                            if (index === 0) console.log('🧪 [QuotationLineTable] Data:', line);

                            const normalizedSource = line.price_source_name 
                                ? String(line.price_source_name).toUpperCase().replace(/\s+/g, '_') 
                                : undefined;
                            const sourceInfo = normalizedSource
                                ? PRICE_SOURCE_BADGE[normalizedSource]
                                : undefined;

                            return (
                            <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
                                <td className="px-2 py-1.5 text-center text-gray-500 font-medium">
                                    {index + 1}
                                </td>
                                <td className="px-2 py-1.5">
                                    <div className="flex gap-1">
                                        <input 
                                            value={line.item_code || ''}
                                            readOnly
                                            className={`${compactInputClass} bg-gray-50/50 italic cursor-not-allowed ${getFieldErrorClass(index, 'item_id')}`}
                                            placeholder="รหัสสินค้า"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => onSearchProduct?.(index)}
                                            disabled={readOnly}
                                            className={`p-1.5 ${getFieldErrorClass(index, 'item_id') ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center disabled:opacity-50`}
                                        >
                                            <Search size={14} />
                                        </button>
                                    </div>
                                    {hasLineFieldError(index, 'item_id') && (
                                        <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5">
                                            <AlertCircle size={10} />
                                            <span>เลือกสินค้า</span>
                                        </div>
                                    )}
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
                                        onBlur={() => {
                                            if (onQtyBlur && line.item_id) onQtyBlur(index);
                                        }}
                                        placeholder="0"
                                        maxLength={12}
                                        disabled={readOnly}
                                        className={`${compactInputClass} text-right ${getFieldErrorClass(index, 'qty')}`}
                                    />
                                    {hasLineFieldError(index, 'qty') && <span className="text-[10px] text-red-500 block text-right mt-0.5">ขั้นต่ำ 0.001</span>}
                                </td>
                                <td className="px-2 py-1.5">
                                    <select 
                                        value={line.uom_id || ''} 
                                        onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                        disabled={readOnly}
                                        className={`${compactInputClass} ${getFieldErrorClass(index, 'uom_id')}`}
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
                                    <div className="relative">
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
                                            maxLength={12}
                                            disabled={isFetchingPrice || readOnly}
                                            className={`${compactInputClass} text-right font-medium text-blue-600 pr-7 ${getFieldErrorClass(index, 'unit_price')} ${(isFetchingPrice || readOnly) ? 'opacity-50' : ''}`}
                                        />
                                        {isFetchingPrice && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <Loader2 size={14} className="text-blue-500 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {sourceInfo && !isFetchingPrice && (
                                        <div
                                            className={`inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0 rounded text-[9px] font-semibold border ${sourceInfo.cls}`}
                                            title={sourceInfo.label}
                                        >
                                            <Tag size={8} />
                                            {sourceInfo.label}
                                        </div>
                                    )}
                                    {hasLineFieldError(index, 'unit_price') && <span className="text-[10px] text-red-500 block text-right mt-0.5">ระบุราคา</span>}
                                </td>
                                 <td className="px-2 py-1.5">
                                     <input 
                                         type="text" 
                                         value={line.discount_expression ?? ''} 
                                         onChange={(e) => onLineChange(index, 'discount_expression', e.target.value)}
                                         onFocus={(e) => e.target.select()}
                                         placeholder="0%"
                                         maxLength={20}
                                         disabled={readOnly}
                                         className={`${compactInputClass} text-right`}
                                     />
                                 </td>
                                 <td className="px-2 py-1.5 text-right">
                                     <input 
                                         type="text" 
                                         value={line.note || ''} 
                                         onChange={(e) => onLineChange(index, 'note', e.target.value)}
                                         disabled={readOnly}
                                         placeholder="..."
                                         className={`${compactInputClass} italic text-gray-500`}
                                     />
                                 </td>
                                <td className={`px-2 py-1.5 text-right font-bold text-sm ${(line.line_total ?? 0) < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                    <div className="flex flex-col items-end overflow-hidden max-w-[150px]">
                                        <span className="truncate w-full text-right">{(line.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        {hasLineFieldError(index, 'line_total') && (
                                            <div className="flex items-center gap-0.5 text-[9px] font-medium text-red-500 mt-0.5">
                                                <AlertCircle size={8} />
                                                <span>ส่วนลดเกิน</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                    {!readOnly && (
                                        <button 
                                            type="button" 
                                            onClick={() => onRemoveLine(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                        {lines.length === 0 && (
                            <tr>
                                 <td colSpan={10} className="px-4 py-10 text-center text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
                                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                                    ไม่มีรายการสินค้า กรุณาคลิกเพื่อเพิ่มรายการ
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {errors.lines && !Array.isArray(errors.lines) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                    <AlertCircle size={18} />
                    <span>{(!Array.isArray(errors.lines) && (errors.lines as { message?: string })?.message) || 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'}</span>
                </div>
            )}
        </section>
    );
}
