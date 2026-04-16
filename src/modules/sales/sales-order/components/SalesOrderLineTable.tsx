/**
 * @file SalesOrderLineTable.tsx
 * @description ตารางรายการสินค้าในคำสั่งขาย (sale_order_line D10)
 */

import { Plus, Trash2, ShoppingBag, Search } from 'lucide-react';
import type { SalesOrderLineData } from '../types/sales-order.types';
import type { UnitListItem, WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import type { Location } from '@/modules/master-data/inventory/types/inventory-master.types';

interface SalesOrderLineTableProps {
    lines: SalesOrderLineData[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof SalesOrderLineData, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
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
    uoms = [],
    warehouses = [],
    locations = [],
    readOnly = false,
}: SalesOrderLineTableProps) {
    const isLocked = readOnly;
    const compactInputClass =
        'h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm';
    const headerThClass =
        'px-3 py-3 text-[10px] font-bold uppercase tracking-tighter bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap';

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <ShoppingBag size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้าคำสั่งขาย (Order Lines)</h3>
                </div>
                {!isLocked && (
                    <button
                        type="button"
                        onClick={onAddLine}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        เพิ่มรายการ
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className={`${headerThClass} w-10 text-center`}>#</th>
                            <th className={`${headerThClass} w-[130px]`}>รหัสสินค้า</th>
                            <th className={`${headerThClass} min-w-[200px]`}>ชื่อสินค้า</th>
                            <th className={`${headerThClass} w-[75px] text-right`}>จำนวน (qty)</th>
                            <th className={`${headerThClass} w-[90px]`}>หน่วย (uom)</th>
                            <th className={`${headerThClass} w-[120px]`}>คลัง (warehouse)</th>
                            <th className={`${headerThClass} w-[120px]`}>ที่เก็บ (location)</th>
                            <th className={`${headerThClass} w-[110px]`}>ล็อต (lot_no)</th>
                            <th className={`${headerThClass} w-[110px] text-right`}>ราคา/หน่วย</th>
                            <th className={`${headerThClass} w-[80px] text-right`}>ส่วนลด</th>
                            <th className={`${headerThClass} w-[120px] text-right`}>ยอดบรรทัด</th>
                            <th className={`${headerThClass} w-[150px]`}>หมายเหตุ</th>
                            {!isLocked && <th className={`${headerThClass} w-12 text-center`}></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {lines.map((line, index) => {
                            const filteredLocations = locations.filter(
                                (loc) =>
                                    !line.warehouse_id ||
                                    String(loc.warehouse_id) === String(line.warehouse_id)
                            );

                            return (
                                <tr
                                    key={index}
                                    className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-colors group"
                                >
                                    <td className="px-2 py-1.5 text-center text-gray-400 font-mono text-[10px]">
                                        {index + 1}
                                    </td>

                                    {/* รหัสสินค้า + Search */}
                                    <td className="px-2 py-1.5">
                                        <div className="flex gap-1">
                                            <input
                                                value={line.item_code || ''}
                                                readOnly
                                                className={`${compactInputClass} flex-1 bg-gray-50/50 italic cursor-not-allowed`}
                                                placeholder="รหัส"
                                            />
                                            {!isLocked && (
                                                <button
                                                    type="button"
                                                    onClick={() => onSearchProduct?.(index)}
                                                    className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* ชื่อสินค้า */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            value={line.item_name || ''}
                                            readOnly
                                            className={`${compactInputClass} bg-gray-50/50 cursor-not-allowed truncate`}
                                            placeholder="ชื่อสินค้า"
                                        />
                                    </td>

                                    {/* จำนวน qty_ordered */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={line.qty_ordered || ''}
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    onLineChange(
                                                        index,
                                                        'qty_ordered',
                                                        val === '' ? 0 : parseFloat(val)
                                                    );
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className={`${compactInputClass} text-right font-bold text-emerald-600`}
                                        />
                                    </td>

                                    {/* หน่วย uom_id */}
                                    <td className="px-2 py-1.5">
                                        <select
                                            value={line.uom_id || ''}
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                            className={compactInputClass}
                                        >
                                            <option value="">-- หน่วย --</option>
                                            {uoms.map((u) => (
                                                <option
                                                    key={String(u.id || u.unit_id)}
                                                    value={String(u.id || u.unit_id)}
                                                >
                                                    {u.unit_name || u.uom_name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* คลัง warehouse_id */}
                                    <td className="px-2 py-1.5">
                                        <select
                                            value={line.warehouse_id || ''}
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                onLineChange(index, 'warehouse_id', e.target.value);
                                                onLineChange(index, 'location_id', '');
                                            }}
                                            className={compactInputClass}
                                        >
                                            <option value="">-- คลัง --</option>
                                            {warehouses.map((w) => (
                                                <option
                                                    key={String(w.warehouse_id)}
                                                    value={String(w.warehouse_id)}
                                                >
                                                    {w.warehouse_name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* ที่เก็บ location_id */}
                                    <td className="px-2 py-1.5">
                                        <select
                                            value={line.location_id || ''}
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'location_id', e.target.value)}
                                            className={compactInputClass}
                                        >
                                            <option value="">-- ที่เก็บ --</option>
                                            {filteredLocations.map((l) => (
                                                <option
                                                    key={String(l.location_id)}
                                                    value={String(l.location_id)}
                                                >
                                                    {l.name_th || l.code}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Lot No (lot_id NEW field) */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={line.lot_no || ''}
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'lot_no', e.target.value)}
                                            placeholder="ล็อตที่..."
                                            className={compactInputClass}
                                        />
                                    </td>

                                    {/* ราคา/หน่วย unit_price */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={line.unit_price || ''}
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    onLineChange(
                                                        index,
                                                        'unit_price',
                                                        val === '' ? 0 : parseFloat(val)
                                                    );
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0.00"
                                            className={`${compactInputClass} text-right font-medium`}
                                        />
                                    </td>

                                    {/* ส่วนลด line_discount_input */}
                                    <td className="px-2 py-1.5">
                                        <input
                                            type="text"
                                            value={line.line_discount_input ?? ''}
                                            disabled={isLocked}
                                            onChange={(e) =>
                                                onLineChange(index, 'line_discount_input', e.target.value)
                                            }
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className={`${compactInputClass} text-right`}
                                        />
                                    </td>

                                    {/* ยอดบรรทัด line_total */}
                                    <td className="px-2 py-1.5 text-right font-bold text-slate-800 dark:text-slate-200">
                                        {(line.line_total || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>

                                    {/* หมายเหตุ note */}
                                    <td className="px-2 py-1.5 text-left">
                                        <input
                                            type="text"
                                            value={line.note || ''}
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'note', e.target.value)}
                                            placeholder="..."
                                            className={`${compactInputClass} italic text-gray-400 placeholder-gray-300`}
                                        />
                                    </td>

                                    {/* Delete button */}
                                    {!isLocked && (
                                        <td className="px-2 py-1.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onRemoveLine(index)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}

                        {lines.length === 0 && (
                            <tr>
                                <td
                                    colSpan={13}
                                    className="px-4 py-16 text-center text-gray-400 bg-gray-50/20 dark:bg-gray-800/10"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <ShoppingBag size={40} className="opacity-10" />
                                        <span className="text-sm font-medium">
                                            ยังไม่มีรายการสินค้า
                                        </span>
                                        <button
                                            type="button"
                                            onClick={onAddLine}
                                            className="mt-2 text-emerald-600 hover:text-emerald-700 font-bold underline"
                                        >
                                            เพิ่มรายการแรกที่นี่
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
