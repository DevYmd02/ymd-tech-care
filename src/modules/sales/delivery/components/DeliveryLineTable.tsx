/**
 * @file DeliveryLineTable.tsx
 * @description ตารางรายการสินค้าในใบจัดส่ง (delivery_line D12)
 */

import { Package, Plus, Trash2, Search } from 'lucide-react';
import type { DeliveryLineValues } from '../schemas/delivery.schemas';
import type { UnitListItem } from '@master-data/types/master-data-types';

interface DeliveryLineTableProps {
    lines: DeliveryLineValues[];
    uoms: UnitListItem[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof DeliveryLineValues, value: string | number | undefined) => void;
    onSearchProduct: (index: number) => void;
    onSearchWarehouse: (index: number) => void;
    onSearchLocation: (index: number) => void;
    onSearchLot: (index: number) => void;
    isViewOnly?: boolean;
}

const cellInputClass =
    'w-full h-8 px-2 bg-transparent border-0 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none text-sm text-slate-700 dark:text-slate-200 transition-colors placeholder-slate-300 dark:placeholder-slate-600';

const cellNumberClass =
    'w-full h-8 px-2 bg-transparent border-0 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none text-sm text-right text-slate-700 dark:text-slate-200 transition-colors';

const thClass =
    'px-3 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap';

const thCenterClass =
    'px-3 py-3 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap';

const tdClass = 'px-2 py-1.5 align-top';

export function DeliveryLineTable({
    lines,
    uoms,
    onAddLine,
    onRemoveLine,
    onLineChange,
    onSearchProduct,
    onSearchWarehouse,
    onSearchLocation,
    onSearchLot,
    isViewOnly = false,
}: DeliveryLineTableProps) {
    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                        <Package size={18} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100">รายการสินค้าที่จัดส่ง</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {lines.length > 0 ? `${lines.length} รายการ` : 'ยังไม่มีรายการ'}
                        </p>
                    </div>
                </div>
                {!isViewOnly && (
                    <button
                        type="button"
                        onClick={onAddLine}
                        className="h-8 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={14} />
                        เพิ่มรายการ
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-slate-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className={thCenterClass} style={{ width: 40 }}>#</th>
                            <th className={thClass} style={{ minWidth: 200 }}>สินค้า</th>
                            <th className={thCenterClass} style={{ width: 100 }}>จำนวนส่ง</th>
                            <th className={thClass} style={{ width: 100 }}>หน่วย</th>
                            <th className={thClass} style={{ width: 130 }}>คลัง</th>
                            <th className={thClass} style={{ width: 130 }}>ที่เก็บ</th>
                            <th className={thClass} style={{ width: 120 }}>Lot</th>
                            <th className={thClass} style={{ minWidth: 120 }}>Serial No.</th>
                            <th className={thClass} style={{ minWidth: 120 }}>หมายเหตุ</th>
                            {!isViewOnly && <th className={thCenterClass} style={{ width: 50 }}></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {lines.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={isViewOnly ? 9 : 10}
                                    className="text-center py-10 text-slate-400 dark:text-slate-600"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Package size={32} strokeWidth={1.2} className="text-slate-300 dark:text-slate-700" />
                                        <span className="text-sm">ยังไม่มีรายการสินค้า</span>
                                        {!isViewOnly && (
                                            <button
                                                type="button"
                                                onClick={onAddLine}
                                                className="mt-1 text-teal-500 hover:text-teal-600 font-semibold text-xs flex items-center gap-1"
                                            >
                                                <Plus size={12} /> เพิ่มรายการแรก
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            lines.map((line, index) => (
                                <tr
                                    key={index}
                                    className="bg-white dark:bg-gray-900 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors group"
                                >
                                    {/* # */}
                                    <td className={tdClass + ' text-center'}>
                                        <span className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                                            {index + 1}
                                        </span>
                                    </td>

                                    {/* Product */}
                                    <td className={tdClass}>
                                        <div className="relative flex items-center gap-1">
                                            <div className="flex-1 min-w-0">
                                                {isViewOnly ? (
                                                    <div className="text-sm text-slate-700 dark:text-slate-200 truncate">
                                                        {line.item_name || line.item_code || '-'}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 truncate min-h-[2rem] flex items-center gap-1.5 border-b border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                                                        onClick={() => onSearchProduct(index)}
                                                        title="คลิกเพื่อเลือกสินค้า"
                                                    >
                                                        {line.item_name || line.item_code ? (
                                                            <>
                                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                                                                    [{line.item_code || ''}]
                                                                </span>
                                                                <span className="truncate">{line.item_name || ''}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400 dark:text-slate-600 italic flex items-center gap-1.5">
                                                                <Search size={12} />
                                                                เลือกสินค้า
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {!isViewOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => onSearchProduct(index)}
                                                    className="shrink-0 h-6 w-6 flex items-center justify-center text-slate-300 hover:text-teal-500 dark:hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="ค้นหาสินค้า"
                                                >
                                                    <Search size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Qty */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {line.qty_shipped}
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                value={line.qty_shipped || ''}
                                                onChange={(e) => onLineChange(index, 'qty_shipped', parseFloat(e.target.value) || 0)}
                                                className={cellNumberClass}
                                                min={0}
                                                step={0.001}
                                                placeholder="0"
                                            />
                                        )}
                                    </td>

                                    {/* UOM */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                                {uoms.find(u => String(u.id || u.unit_id) === String(line.uom_id))?.unit_name ||
                                                    uoms.find(u => String(u.id || u.unit_id) === String(line.uom_id))?.uom_name ||
                                                    line.uom_name || line.uom_id || '-'}
                                            </div>
                                        ) : (
                                            <select
                                                value={line.uom_id || ''}
                                                onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                                className={cellInputClass}
                                            >
                                                <option value="">หน่วย</option>
                                                {uoms.map((u) => (
                                                    <option key={String(u.id || u.unit_id)} value={String(u.id || u.unit_id)}>
                                                        {u.unit_name || u.uom_name || ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </td>

                                    {/* Warehouse */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                                {line.warehouse_id || '-'}
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                                onClick={() => onSearchWarehouse(index)}
                                            >
                                                <span className="text-sm truncate text-slate-600 dark:text-slate-300">
                                                    {line.warehouse_id || (
                                                        <span className="text-slate-300 dark:text-slate-600 italic text-xs flex items-center gap-1">
                                                            <Search size={10} /> คลัง
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Location */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                                {line.location_id || '-'}
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                                onClick={() => onSearchLocation(index)}
                                            >
                                                <span className="text-sm truncate text-slate-600 dark:text-slate-300">
                                                    {line.location_id || (
                                                        <span className="text-slate-300 dark:text-slate-600 italic text-xs flex items-center gap-1">
                                                            <Search size={10} /> ที่เก็บ
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Lot */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                                {line.lot_no || '-'}
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center gap-1 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                                onClick={() => onSearchLot(index)}
                                            >
                                                <span className="text-sm truncate text-slate-600 dark:text-slate-300">
                                                    {line.lot_no || (
                                                        <span className="text-slate-300 dark:text-slate-600 italic text-xs flex items-center gap-1">
                                                            <Search size={10} /> Lot
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Serial No */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                                {line.serial_no || '-'}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={line.serial_no || ''}
                                                onChange={(e) => onLineChange(index, 'serial_no', e.target.value)}
                                                className={cellInputClass}
                                                placeholder="Serial No."
                                            />
                                        )}
                                    </td>

                                    {/* Remarks */}
                                    <td className={tdClass}>
                                        {isViewOnly ? (
                                            <div className="text-sm text-slate-700 dark:text-slate-200">
                                                {line.remarks || '-'}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={line.remarks || ''}
                                                onChange={(e) => onLineChange(index, 'remarks', e.target.value)}
                                                className={cellInputClass}
                                                placeholder="หมายเหตุ"
                                            />
                                        )}
                                    </td>

                                    {/* Delete */}
                                    {!isViewOnly && (
                                        <td className={tdClass + ' text-center'}>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveLine(index)}
                                                className="h-7 w-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                                title="ลบรายการ"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>

                    {lines.length > 0 && (
                        <tfoot className="bg-slate-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-700">
                            <tr>
                                <td colSpan={2} className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                                    รวมทั้งหมด {lines.length} รายการ
                                </td>
                                <td className="px-2 py-2 text-right text-sm font-bold text-teal-600 dark:text-teal-400">
                                    {lines.reduce((sum, l) => sum + (l.qty_shipped || 0), 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                </td>
                                <td colSpan={isViewOnly ? 6 : 7} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
