import { Plus, Trash2, Package, Search } from 'lucide-react';
import type { ReservationLineData } from '../types/reservation.types';
import type { UnitListItem, WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import type { Location } from '@/modules/master-data/inventory/types/inventory-master.types';

interface ReservationLineTableProps {
    lines: ReservationLineData[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof ReservationLineData, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    uoms?: UnitListItem[];
    warehouses?: WarehouseListItem[];
    locations?: Location[];
    readOnly?: boolean;
}

export function ReservationLineTable({ 
    lines, 
    onAddLine, 
    onRemoveLine, 
    onLineChange, 
    onSearchProduct, 
    uoms = [],
    warehouses = [],
    locations = [],
    readOnly = false
}: ReservationLineTableProps) {
    const isLocked = readOnly;
    const compactInputClass = "h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const headerThClass = "px-3 py-3 text-[10px] font-bold uppercase tracking-tighter bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap";
    
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Package size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้าจอง (Reservation Lines)</h3>
                </div>
                {!isLocked && (
                    <button 
                        type="button" 
                        onClick={onAddLine}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
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
                             <th className={`${headerThClass} min-w-[150px]`}>สินค้า (item_id)</th>
                             <th className={`${headerThClass} w-20 text-right`}>จอง (qty)</th>
                             <th className={`${headerThClass} w-24`}>หน่วย (uom)</th>
                             <th className={`${headerThClass} w-32`}>คลัง (warehouse)</th>
                             <th className={`${headerThClass} w-32`}>ที่เก็บ (location)</th>
                             <th className={`${headerThClass} w-24 text-right`}>ราคา/หน่วย</th>
                             <th className={`${headerThClass} w-28`}>นโยบาย (policy)</th>
                             <th className={`${headerThClass} w-20 text-right`}>ส่วนลด</th>
                             <th className={`${headerThClass} w-28 text-right`}>ยอดบรรทัด</th>
                             <th className={`${headerThClass} w-28`}>หมายเหตุ</th>
                             {!isLocked && <th className={`${headerThClass} w-12 text-center`}></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {lines.map((line, index) => {
                            // Filter locations based on selected warehouse
                            const filteredLocations = locations.filter(loc => 
                                !line.warehouse_id || String(loc.warehouse_id) === String(line.warehouse_id)
                            );

                            return (
                                <tr key={index} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/5 transition-colors group">
                                    <td className="px-2 py-1.5 text-center text-gray-400 font-mono text-[10px]">
                                        {index + 1}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <div className="flex gap-1">
                                            <div className="flex-1 min-w-0">
                                                <input 
                                                    value={line.item_code || ''}
                                                    readOnly
                                                    className={`${compactInputClass} bg-gray-50/50 italic cursor-not-allowed`}
                                                    placeholder="รหัส"
                                                />
                                                <div className="mt-0.5 text-[10px] text-gray-500 truncate px-1 font-medium">
                                                    {line.item_name || 'ชื่อสินค้า'}
                                                </div>
                                            </div>
                                            {!isLocked && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => onSearchProduct?.(index)}
                                                    className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center mt-0"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input 
                                            type="text" 
                                            value={line.qty_reserved || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    onLineChange(index, 'qty_reserved', val === '' ? 0 : parseFloat(val));
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className={`${compactInputClass} text-right font-bold text-purple-600`}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <select 
                                            value={line.uom_id || ''} 
                                            disabled={isLocked}
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
                                        <select 
                                            value={line.warehouse_id || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                onLineChange(index, 'warehouse_id', e.target.value);
                                                onLineChange(index, 'location_id', ''); // Reset location when warehouse changes
                                            }}
                                            className={compactInputClass}
                                        >
                                            <option value="">-- คลัง --</option>
                                            {warehouses.map((w) => (
                                                <option key={String(w.warehouse_id)} value={String(w.warehouse_id)}>
                                                    {w.warehouse_name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <select 
                                            value={line.location_id || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'location_id', e.target.value)}
                                            className={compactInputClass}
                                        >
                                            <option value="">-- ที่เก็บ --</option>
                                            {filteredLocations.map((l) => (
                                                <option key={String(l.location_id)} value={String(l.location_id)}>
                                                    {l.name_th || l.code}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5">
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
                                            className={`${compactInputClass} text-right font-medium`}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <select 
                                            value={line.reserve_policy || 'AUTO'} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'reserve_policy', e.target.value as ReservationLineData['reserve_policy'])}
                                            className={`${compactInputClass} ${line.reserve_policy === 'MANUAL' ? 'text-orange-500 font-bold' : 'text-blue-500 font-bold'}`}
                                        >
                                            <option value="AUTO">AUTO (อัตโนมัติ)</option>
                                            <option value="MANUAL">MANUAL (เลือกเอง)</option>
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <input 
                                            type="text" 
                                            value={line.line_discount_input ?? ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'line_discount_input', e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className={`${compactInputClass} text-right`}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-bold text-slate-800 dark:text-slate-200">
                                        {(line.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-2 py-1.5 text-right">
                                        <input 
                                            type="text" 
                                            value={line.note || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'note', e.target.value)}
                                            placeholder="..."
                                            className={`${compactInputClass} italic text-gray-400 placeholder-gray-300`}
                                        />
                                    </td>
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
                                 <td colSpan={12} className="px-4 py-16 text-center text-gray-400 bg-gray-50/20 dark:bg-gray-800/10">
                                    <div className="flex flex-col items-center gap-2">
                                        <Package size={40} className="opacity-10" />
                                        <span className="text-sm font-medium">ยังไม่มีรายการจองสินค้า</span>
                                        <button 
                                            type="button" 
                                            onClick={onAddLine} 
                                            className="mt-2 text-purple-600 hover:text-purple-700 font-bold underline"
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
