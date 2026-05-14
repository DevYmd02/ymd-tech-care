import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FileBox, Eraser, Plus, Trash2, Search, AlertTriangle } from 'lucide-react';
import type { FieldArrayWithId } from 'react-hook-form';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import type { UOMListItem } from '@/modules/master-data/types/master-data-types';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';

interface PRFormLinesProps {
    lines: FieldArrayWithId<PRFormData, "lines", "id">[];
    updateLine: (index: number, field: keyof PRLineFormData, value: string | number | undefined) => void;
    removeLine: (index: number) => void;
    clearLine: (index: number) => void;
    addLine: () => void;
    handleClearLines: () => void;
    openProductSearch: (index: number) => void;
    openWarehouseSearch: (index: number) => void;
    openLocationSearch: (index: number) => void;
    readOnly?: boolean;
    masterUnits?: UOMListItem[];
}

export const PRFormLines: React.FC<PRFormLinesProps> = React.memo(({
    lines,
    updateLine,
    removeLine,
    clearLine,
    addLine,
    handleClearLines,
    openProductSearch,
    openWarehouseSearch,
    openLocationSearch,
    readOnly = false,
    masterUnits = []
}) => {
    const { register, watch: watchForm, control, setValue } = useFormContext<PRFormData>();
    const watchedLines = watchForm('lines');
    const headerVendorId = watchForm('preferred_vendor_id');

    const tableInputClass = 'w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 !rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 dark:text-white shadow-sm transition-all';
    const lockedInputClass = 'w-full h-8 px-3 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 !rounded-xl text-gray-600 dark:text-gray-400 cursor-not-allowed shadow-sm';
    const masterDataTooltip = 'กรุณาใช้ปุ่มค้นหาเพื่อเลือกจาก Master Data';
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
                            <th className="p-2 w-40 text-center border-r border-blue-500">รหัสสินค้า</th>
                            <th className="p-2 min-w-[180px] text-center border-r border-blue-500">ชื่อสินค้า</th>
                            <th className="p-2 w-16 text-center border-r border-blue-500">คลัง</th>
                            <th className="p-2 w-16 text-center border-r border-blue-500">ที่เก็บ</th>
                            <th className="p-2 w-28 text-center border-r border-blue-500">หน่วยนับ</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">จำนวน</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">ราคา/หน่วย</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด</th>
                            <th className="p-2 w-20 text-center border-r border-blue-500">ส่วนลด (บาท)</th>
                            <th className="p-2 w-24 text-center border-r border-blue-500">จำนวนเงิน</th>
                            {!readOnly && (
                            <th className="p-2 w-24 text-center">
                                <button 
                                    type="button" 
                                    onClick={handleClearLines} 
                                    className="text-white hover:text-red-200 transition-colors"
                                    title="ล้างค่าทั้งหมด"
                                    aria-label="ล้างข้อมูลทุกรายการ"
                                >
                                    <Eraser size={14} aria-hidden="true" />
                                </button>
                            </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((field, index) => {
                            const line = watchedLines[index] || {};
                            const gross = (line.qty || 0) * (line.est_unit_price || 0);
                            const lineDiscount = parseDiscountAmount(line.line_discount_raw, gross);
                            const lineTotal = gross - lineDiscount;
                            
                            // 🛑 Detect Duplicate Line item_id
                            const isDuplicateItem = watchedLines.some((l, idx) => 
                                idx !== index && 
                                l.item_id && 
                                line.item_id && 
                                Number(l.item_id) === Number(line.item_id)
                            );

                            return (
                                <tr key={field.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="p-1 text-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border-r border-gray-300 dark:border-gray-600 sticky left-0 z-10">{index + 1}</td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className="flex items-center gap-1">
                                            {/* Duplicate Warning */}
                                            {isDuplicateItem && (
                                                <span 
                                                    className="flex-shrink-0 text-red-500" 
                                                    title="รายการสินค้านี้ซ้ำ"
                                                >
                                                    <AlertTriangle size={14} />
                                                </span>
                                            )}

                                            {/* Vendor-Item Mismatch Warning */}
                                            {line.item_id && headerVendorId && line._item_vendor_id && line._item_vendor_id !== headerVendorId && (
                                                <span 
                                                    className="flex-shrink-0 text-amber-500" 
                                                    title="สินค้านี้ปกติจัดซื้อจากผู้ขายรายอื่น"
                                                >
                                                    <AlertTriangle size={14} />
                                                </span>
                                            )}
                                            <input 
                                                {...register(`lines.${index}.item_code`)} 
                                                readOnly={!!line.item_id || readOnly}
                                                className={`${line.item_id ? lockedInputClass : tableInputClass} ${isDuplicateItem ? '!border-red-500 ring-1 ring-red-500 bg-red-50/50 dark:bg-red-900/10' : ''} text-center flex-1`} 
                                                title={line.item_id ? (isDuplicateItem ? 'รายการสินค้านี้ซ้ำ' : masterDataTooltip) : ''}
                                            />
                                        </div>
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <input 
                                            {...register(`lines.${index}.item_name`)} 
                                            readOnly={!!line.item_id || readOnly}
                                            className={line.item_id ? lockedInputClass : tableInputClass} 
                                            title={line.item_id ? masterDataTooltip : ''}
                                        />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <button 
                                            type="button"
                                            onClick={() => !readOnly && openWarehouseSearch(index)}
                                            className={`${tableInputClass} w-full text-center flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                            disabled={readOnly}
                                            title="คลิกเพื่อเลือกคลัง"
                                        >
                                            <span className="truncate">{line.warehouse_code || line.warehouse_id || '-'}</span>
                                        </button>
                                        <input type="hidden" {...register(`lines.${index}.warehouse_id`)} />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <button 
                                            type="button"
                                            onClick={() => !readOnly && openLocationSearch(index)}
                                            className={`${tableInputClass} w-full text-center flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                            disabled={readOnly}
                                            title="คลิกเพื่อเลือกที่เก็บ"
                                        >
                                            <span className="truncate">{line.location_name || line.location || '-'}</span>
                                        </button>
                                        <input type="hidden" {...register(`lines.${index}.location`)} />
                                        <input type="hidden" {...register(`lines.${index}.location_name`)} />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <Controller
                                            name={`lines.${index}.uom_id`}
                                            control={control}
                                            render={({ field }) => {
                                                // Dropdown must show ALL system units unconditionally for flexible select
                                                const options = masterUnits.map((u: UOMListItem) => ({ 
                                                    id: Number(u.uom_id || u.uom_id), 
                                                    name: u.uom_name || u.uom_name 
                                                }));

                                                // Fallback edit mode guard (Trap 1 style safety)
                                                if (options.length === 0 && line.uom && line.uom_id) {
                                                    options.push({ id: Number(line.uom_id), name: line.uom });
                                                }

                                                return (
                                                    <select
                                                        {...field}
                                                        value={field.value || ''}
                                                        disabled={readOnly}
                                                        className={`${tableInputClass} text-center px-1`}
                                                        onChange={(e) => {
                                                            const selectedId = e.target.value ? Number(e.target.value) : undefined;
                                                            field.onChange(selectedId);
                                                            const selectedName = options.find((o) => Number(o.id) === selectedId)?.name || '';
                                                            setValue(`lines.${index}.uom`, selectedName);
                                                        }}
                                                    >
                                                        <option value="">- หน่วย -</option>
                                                        {options.map((opt) => (
                                                            <option key={`${opt.id}-${index}`} value={opt.id}>{opt.name}</option>
                                                        ))}
                                                    </select>
                                                );
                                            }}
                                        />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <input 
                                            type="number" 
                                            {...register(`lines.${index}.qty`, { 
                                                onChange: (e) => updateLine(index, 'qty', e.target.value)
                                            })} 
                                            disabled={readOnly}
                                            className={`${tableInputClass} text-center`} 
                                        />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <input 
                                            type="number" 
                                            {...register(`lines.${index}.est_unit_price`, { 
                                                onChange: (e) => updateLine(index, 'est_unit_price', e.target.value)
                                            })} 
                                            disabled={readOnly}
                                            className={`${tableInputClass} text-center`} 
                                        />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <input 
                                            type="text" 
                                            {...register(`lines.${index}.line_discount_raw`, { 
                                                onChange: (e) => updateLine(index, 'line_discount_raw', e.target.value)
                                            })} 
                                            disabled={readOnly}
                                            className={`${tableInputClass} text-center`} 
                                        />
                                    </td>
                                    
                                    <td className={tdBaseClass}>
                                        <div className="px-2 text-right text-gray-700 dark:text-gray-300">
                                            {lineDiscount ? lineDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </div>
                                    </td>
                                    
                                    <td className={`${tdBaseClass} text-right font-bold pr-2 text-gray-700 dark:text-gray-300`}>
                                        {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    
                                    {/* Action Buttons: Search, Eraser, Trash */}
                                    {!readOnly && (
                                    <td className="p-1">
                                        <div className="flex justify-center items-center space-x-2 h-8">
                                            <button type="button" className="text-blue-600 hover:text-blue-800 transition-colors" title="ค้นหาสินค้า" aria-label={`ค้นหาสินค้า แถวที่ ${index + 1}`} onClick={() => openProductSearch(index)}><Search size={16} aria-hidden="true" /></button>
                                            <button type="button" className="text-orange-500 hover:text-orange-700 transition-colors" onClick={() => clearLine(index)} title="ล้างค่าข้อมูลแถวนี้" aria-label={`ล้างค่าข้อมูลแถวที่ ${index + 1}`}><Eraser size={16} aria-hidden="true" /></button>
                                            <button type="button" className="text-red-500 hover:text-red-700 transition-colors" onClick={() => removeLine(index)} title="ลบรายการนี้" aria-label={`ลบรายการ แถวที่ ${index + 1}`}><Trash2 size={16} aria-hidden="true" /></button>
                                        </div>
                                    </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer: Add Button */}
            {!readOnly && (
            <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={addLine} className="flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-xs font-bold shadow-sm transition-colors">
                    <Plus size={14} className="mr-1" /> เพิ่มรายการ
                </button>
            </div>
            )}
        </div>
    );
});

PRFormLines.displayName = 'PRFormLines';
