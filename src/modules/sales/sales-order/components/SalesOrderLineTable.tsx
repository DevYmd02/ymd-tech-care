/**
 * @file SalesOrderLineTable.tsx
 * @description ตารางรายการสินค้าในใบสั่งขาย (sale_order_line D10) - รุ่นอัปเกรด High-Density & Sticky
 */

import { Plus, Trash2, ShoppingBag, Search, AlertCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { SalesOrderLineValues, SalesOrderFormValues } from '../schemas/sales-order.schemas';
import type { SalesOrderLineData } from '../types/sales-order.types';
import type { UnitListItem, WarehouseListItem } from '@master-data/types/master-data-types';
import type { Location } from '@inventory/types/inventory-master.types';

interface SalesOrderLineTableProps {
    lines: SalesOrderLineData[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof SalesOrderLineData, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    onSearchWarehouse?: (index: number) => void;
    onSearchLocation?: (index: number) => void;
    onSearchLot?: (index: number) => void;
    uoms?: UnitListItem[];
    warehouses?: WarehouseListItem[];
    locations?: Location[];
    readOnly?: boolean;
}

export function SalesOrderLineTable({
    lines,
    onAddLine,
    onRemoveLine,
    onLineChange,
    onSearchProduct,
    onSearchWarehouse,
    onSearchLocation,
    onSearchLot,
    uoms = [],
    warehouses = [],
    locations = [],
    readOnly = false,
}: SalesOrderLineTableProps) {
    const { formState: { errors } } = useFormContext<SalesOrderFormValues>();
    const isLocked = readOnly;

    const getLineError = (index: number) => {
        if (!errors.lines || !Array.isArray(errors.lines)) return undefined;
        return errors.lines[index];
    };

    const hasLineFieldError = (index: number, fieldName: keyof SalesOrderLineValues) => {
        const lineError = getLineError(index);
        return !!(lineError as Record<string, unknown> | undefined)?.[fieldName];
    };
    
    // Aesthetic classes matching Reservation but themed Indigo
    const compactInputClass =
        "h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm rounded";
    
    const headerThClass = 
        "px-3 py-3 font-bold uppercase text-xs tracking-tighter border-b border-gray-200 dark:border-gray-700 whitespace-nowrap";

    return (
        <section className="space-y-6">
            {/* Header section with icon and Add button */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <ShoppingBag size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้าใบสั่งขาย (Order Lines)</h3>
                </div>
                {!isLocked && (
                    <button
                        type="button"
                        onClick={onAddLine}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        เพิ่มรายการ
                    </button>
                )}
            </div>

            {/* Table Container with Premium Styling */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-200 dark:scrollbar-thumb-indigo-500/20 scrollbar-track-transparent bg-white dark:bg-gray-900">
                    <table className="table-fixed text-sm text-left border-separate border-spacing-0 w-full min-w-[2130px]">
                        <colgroup>
                            <col className="w-[60px]" />  {/* ลำดับ */}
                            <col className="w-[200px]" /> {/* รหัสสินค้า */}
                            <col className="w-[300px]" /> {/* ชื่อสินค้า */}
                            <col className="w-[160px]" /> {/* คลัง */}
                            <col className="w-[160px]" /> {/* ที่เก็บ */}
                            <col className="w-[120px]" /> {/* จำนวน */}
                            <col className="w-[120px]" /> {/* หน่วย */}
                            <col className="w-[220px]" /> {/* ล็อต */}
                            <col className="w-[140px]" /> {/* ราคา */}
                            <col className="w-[130px]" /> {/* ส่วนลด */}
                            <col className="w-[160px]" /> {/* ยอดรวม */}
                            <col className="w-[300px]" /> {/* หมายเหตุ */}
                            {!isLocked && <col className="w-[60px]" />}  {/* จัดการ */}
                        </colgroup>
                        
                        <thead className="bg-[#fbfaff] dark:bg-gray-800 sticky top-0 z-40">
                            <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                                <th className={`${headerThClass} text-center text-indigo-600 dark:text-indigo-400 sticky left-0 bg-[#fbfaff] dark:bg-gray-800 z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-200 dark:after:bg-gray-700`}>ลำดับ</th>
                                <th className={`${headerThClass} text-indigo-700 dark:text-indigo-300 sticky left-[60px] bg-[#fbfaff] dark:bg-gray-800 z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-indigo-100 dark:after:bg-indigo-800/40`}>รหัสสินค้า</th>
                                <th className={`${headerThClass} text-indigo-700 dark:text-indigo-300`}>ชื่อสินค้า</th>
                                <th className={`${headerThClass} text-indigo-700 dark:text-indigo-300/60`}>คลัง (WAREHOUSE)</th>
                                <th className={`${headerThClass} text-indigo-700 dark:text-indigo-300/60`}>ที่เก็บ (LOCATION)</th>
                                <th className={`${headerThClass} text-right text-indigo-700 dark:text-indigo-300/60`}>จำนวน (QTY)</th>
                                <th className={`${headerThClass} text-center text-indigo-700 dark:text-indigo-300/60`}>หน่วย (UOM)</th>
                                <th className={`${headerThClass} text-indigo-700 dark:text-indigo-300/60`}>ล็อต (LOT_NO)</th>
                                <th className={`${headerThClass} text-right text-indigo-700 dark:text-indigo-300/60`}>ราคา/หน่วย</th>
                                <th className={`${headerThClass} text-right text-indigo-700 dark:text-indigo-300/60`}>ส่วนลด</th>
                                <th className={`${headerThClass} text-right text-indigo-700 dark:text-indigo-300/60`}>ยอดรวม</th>
                                <th className={`${headerThClass} text-indigo-700 dark:text-indigo-300/60`}>หมายเหตุ</th>
                                {!isLocked && <th className={`${headerThClass} text-center sticky right-[-1px] bg-[#fbfaff] dark:bg-gray-800 z-[60] border-l border-gray-200 dark:border-gray-700 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.4)] pr-[13px]`}></th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {lines.map((line, index) => {
                                return (
                                    <tr key={index} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                                        {/* Sticky Left: Index */}
                                        <td className="px-2 py-2 text-center text-indigo-400 dark:text-indigo-500/70 font-bold sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-[#fcfaff] dark:group-hover:bg-gray-800 z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-100 dark:after:bg-gray-800/40">
                                            {index + 1}
                                        </td>

                                        {/* Sticky Left: Item Code */}
                                        <td className="px-2 py-2 sticky left-[60px] bg-white dark:bg-gray-900 group-hover:bg-[#fcfaff] dark:group-hover:bg-gray-800 z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-indigo-50 dark:after:bg-indigo-800/20">
                                            <div className="flex gap-1 items-center">
                                                <input
                                                    value={line.item_code || ''}
                                                    readOnly
                                                    className={`${compactInputClass} bg-gray-50/50 dark:bg-gray-800 italic cursor-not-allowed text-indigo-700 dark:text-white/70 border-gray-200 dark:border-gray-700`}
                                                    placeholder="รหัส"
                                                />
                                                {!isLocked && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSearchProduct?.(index)}
                                                        className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center font-bold"
                                                    >
                                                        <Search size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Item Name (Now scrollable) */}
                                        <td className="px-2 py-2">
                                            <input
                                                value={line.item_name || ''}
                                                readOnly
                                                className={`${compactInputClass} bg-gray-50/50 dark:bg-gray-800 cursor-not-allowed truncate text-gray-600 dark:text-white/80 border-gray-200 dark:border-gray-700`}
                                                placeholder="ชื่อสินค้า"
                                            />
                                        </td>

                                        {/* Warehouse */}
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1 items-center">
                                                <input 
                                                    value={warehouses.find(w => String(w.warehouse_id) === String(line.warehouse_id))?.warehouse_name || ''}
                                                    readOnly
                                                    onClick={!isLocked ? () => onSearchWarehouse?.(index) : undefined}
                                                    className={`${compactInputClass} ${!isLocked ? 'cursor-pointer hover:border-indigo-400 focus:border-indigo-500' : 'cursor-not-allowed bg-gray-50/50'} text-gray-700 dark:text-white/80 border-gray-200 dark:border-gray-700 transition-colors`}
                                                    placeholder="เลือกคลัง..."
                                                />
                                            </div>
                                        </td>

                                        {/* Location */}
                                        <td className="px-2 py-2">
                                            <div className="flex gap-1 items-center">
                                                <input 
                                                    value={locations.find(l => String(l.location_id) === String(line.location_id))?.name_th || locations.find(l => String(l.location_id) === String(line.location_id))?.code || ''}
                                                    readOnly
                                                    onClick={!isLocked ? () => onSearchLocation?.(index) : undefined}
                                                    className={`${compactInputClass} ${!isLocked ? 'cursor-pointer hover:border-indigo-400 focus:border-indigo-500' : 'cursor-not-allowed bg-gray-50/50'} text-gray-700 dark:text-white/80 border-gray-200 dark:border-gray-700 transition-colors`}
                                                    placeholder="เลือกที่เก็บ..."
                                                />
                                            </div>
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={line.qty_ordered || ''}
                                                disabled={isLocked}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                        onLineChange(index, 'qty_ordered', val === '' ? 0 : parseFloat(val));
                                                    }
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="0"
                                                maxLength={12}
                                                className={`${compactInputClass} text-right font-bold text-indigo-600 dark:text-white bg-white dark:bg-gray-800 border-indigo-100 dark:border-gray-700`}
                                            />
                                        </td>

                                        {/* UOM */}
                                        <td className="px-2 py-2">
                                            <select
                                                value={line.uom_id || ''}
                                                disabled={isLocked}
                                                onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                                className={`${compactInputClass} text-center bg-white dark:bg-gray-800 dark:text-white/80 border-gray-200 dark:border-gray-700`}
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                <option value="">-- หน่วย --</option>
                                                {uoms.map((u) => (
                                                    <option key={String(u.id || u.unit_id)} value={String(u.id || u.unit_id)}>
                                                        {u.unit_name || u.uom_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* Lot No */}
                                        <td className="px-2 py-2">
                                            <div className="relative group/lot">
                                                <div 
                                                    onClick={!isLocked ? () => onSearchLot?.(index) : undefined}
                                                    className={`absolute left-0 top-0 bottom-0 flex items-center pl-2 ${!isLocked ? 'cursor-pointer group-hover/lot:text-orange-500 text-gray-400' : 'text-gray-300'}`}
                                                >
                                                    <Search size={14} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={line.lot_no || ''} 
                                                    readOnly
                                                    disabled={isLocked}
                                                    onClick={!isLocked ? () => onSearchLot?.(index) : undefined}
                                                    placeholder="เลือกล็อต..."
                                                    className={`${compactInputClass} pl-7 cursor-pointer font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 border-orange-100 dark:border-gray-700 focus:ring-orange-500`}
                                                />
                                            </div>
                                        </td>

                                        {/* Unit Price */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={line.unit_price || ''}
                                                disabled={isLocked}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                        onLineChange(index, 'unit_price', val === '' ? 0 : parseFloat(val));
                                                    }
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="0.00"
                                                maxLength={12}
                                                className={`${compactInputClass} text-right font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700`}
                                            />
                                        </td>

                                        {/* Line Discount */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={line.line_discount_input ?? ''}
                                                disabled={isLocked}
                                                onChange={(e) => onLineChange(index, 'line_discount_input', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                placeholder="0"
                                                maxLength={20}
                                                className={`${compactInputClass} text-right bg-white dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700`}
                                            />
                                        </td>

                                        {/* Line Total */}
                                        <td className="px-2 py-2">
                                            <div className={`h-8 flex flex-col items-end justify-center px-3 font-bold bg-white dark:bg-gray-900 rounded border shadow-inner overflow-hidden max-w-[150px] ${line.line_total < 0 ? 'text-red-500 border-red-200 dark:border-red-800' : 'text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700'}`}>
                                                <span className="truncate w-full text-right overflow-hidden">{(line.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                {hasLineFieldError(index, 'line_total') && (
                                                    <div className="flex items-center gap-0.5 text-[8px] font-medium text-red-500 mt-[-2px]">
                                                        <AlertCircle size={8} />
                                                        <span>ส่วนลดเกิน</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Note */}
                                        <td className="px-2 py-2">
                                            <input
                                                type="text"
                                                value={line.note || ''}
                                                disabled={isLocked}
                                                onChange={(e) => onLineChange(index, 'note', e.target.value)}
                                                placeholder="หมายเหตุ..."
                                                className={`${compactInputClass} italic text-gray-400 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-700 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700`}
                                            />
                                        </td>

                                        {/* Sticky Right: Actions */}
                                        {!isLocked && (
                                            <td className="px-2 py-2 text-center sticky right-[-1px] pr-[9px] bg-white dark:bg-gray-900 group-hover:bg-[#fcfaff] dark:group-hover:bg-gray-800 z-[30] transition-colors border-l border-gray-100 dark:border-gray-700 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.8)] isolate">
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveLine(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {lines.length === 0 && (
                        <div className="sticky left-0 w-full flex flex-col items-center justify-center py-16 text-gray-400 dark:text-indigo-300/40 bg-gray-50/50 dark:bg-gray-900/50">
                            <ShoppingBag className="w-16 h-16 mb-4 text-indigo-200 dark:text-indigo-500/30 opacity-40" />
                            <p className="text-base font-medium">ยังไม่มีรายการสินค้า</p>
                            <button
                                type="button"
                                onClick={onAddLine}
                                className="mt-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline transition-colors"
                            >
                                เพิ่มรายการแรกที่นี่
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
