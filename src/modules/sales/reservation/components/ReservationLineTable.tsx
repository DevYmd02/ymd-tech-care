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
    onSearchLot?: (index: number) => void;
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
    onSearchLot,
    uoms = [],
    warehouses = [],
    locations = [],
    readOnly = false
}: ReservationLineTableProps) {
    const isLocked = readOnly;
    const compactInputClass = "h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const headerThClass = "px-3 py-3 font-bold uppercase text-xs tracking-tighter border-b border-gray-200 dark:border-gray-700 whitespace-nowrap";
    
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

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-[#110e1b]">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900/50 scrollbar-track-transparent bg-white dark:bg-[#110e1b]">
                <table className="table-fixed text-sm text-left border-separate border-spacing-0 w-full min-w-[2130px]">
                    <colgroup>
                        <col className="w-[60px]" />
                        <col className="w-[200px]" />
                        <col className="w-[300px]" />
                        <col className="w-[160px]" />
                        <col className="w-[160px]" />
                        <col className="w-[120px]" />
                        <col className="w-[120px]" />
                        <col className="w-[220px]" />
                        <col className="w-[140px]" />
                        <col className="w-[130px]" />
                        <col className="w-[160px]" />
                        <col className="w-[300px]" />
                        <col className="w-[60px]" />
                    </colgroup>
                    <thead className="bg-[#fbfaff] dark:bg-[#1a1625] sticky top-0 z-40">
                        <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                             <th className={`${headerThClass} text-center text-purple-600 dark:text-purple-400 sticky left-0 bg-[#fbfaff] dark:bg-[#181424] z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-200 dark:after:bg-gray-700`}>ลำดับ</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300 sticky left-[60px] bg-[#fbfaff] dark:bg-[#181424] z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-200 dark:after:bg-gray-700`}>รหัสสินค้า</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300 sticky left-[260px] bg-[#fbfaff] dark:bg-[#181424] z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-purple-100 dark:after:bg-purple-800/40`}>ชื่อสินค้า</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>คลัง</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>ที่เก็บ</th>
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>จอง (QTY)</th>
                             <th className={`${headerThClass} text-center text-purple-700 dark:text-purple-300/60`}>หน่วย</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>ล็อต</th>
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>ราคา/หน่วย</th>
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>ส่วนลด</th>
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>ยอดรวม</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>หมายเหตุ</th>
                             {!isLocked && <th className={`${headerThClass} text-center sticky right-[-1px] bg-[#fbfaff] dark:bg-[#110e1b] z-[60] border-l border-gray-200 dark:border-gray-700 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.7)] pr-[13px]`}></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#110e1b]">
                        {lines.length > 0 && lines.map((line, index) => {
                            const filteredLocations = locations.filter(loc => 
                                !line.warehouse_id || String(loc.warehouse_id) === String(line.warehouse_id)
                            );

                            return (
                                <tr key={index} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group">
                                    <td className="px-2 py-2 text-center text-purple-400 dark:text-purple-500 font-bold sticky left-0 bg-white dark:bg-[#110e1b] group-hover:bg-[#fcfaff] dark:group-hover:bg-[#1d1929] z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-100 dark:after:bg-gray-800">
                                        {index + 1}
                                    </td>
                                    
                                    <td className="px-2 py-2 sticky left-[60px] bg-white dark:bg-[#110e1b] group-hover:bg-[#fcfaff] dark:group-hover:bg-[#1d1929] z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-100 dark:after:bg-gray-800">
                                        <div className="flex gap-1 items-center">
                                            <input 
                                                value={line.item_code || ''}
                                                readOnly
                                                className={`${compactInputClass} bg-gray-50/50 dark:bg-gray-800/50 italic cursor-not-allowed text-purple-700 dark:text-white`}
                                                placeholder="รหัส"
                                            />
                                            {!isLocked && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => onSearchProduct?.(index)}
                                                    className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center font-bold"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-2 py-2 sticky left-[260px] bg-white dark:bg-[#110e1b] group-hover:bg-[#fcfaff] dark:group-hover:bg-[#1d1929] z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-purple-50 dark:after:bg-purple-900/30">
                                        <input 
                                            value={line.item_name || ''}
                                            readOnly
                                            className={`${compactInputClass} bg-gray-50/50 dark:bg-gray-800/30 cursor-not-allowed truncate text-gray-600 dark:text-white`}
                                            placeholder="ชื่อสินค้า"
                                        />
                                    </td>
                                    
                                    <td className="px-2 py-2">
                                        <select 
                                            value={line.warehouse_id || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const newWarehouseId = e.target.value;
                                                onLineChange(index, 'warehouse_id', newWarehouseId);
                                                if (newWarehouseId) {
                                                    const firstLoc = locations.find(loc => String(loc.warehouse_id) === newWarehouseId);
                                                    onLineChange(index, 'location_id', firstLoc ? String(firstLoc.location_id) : '');
                                                } else {
                                                    onLineChange(index, 'location_id', ''); 
                                                }
                                            }}
                                            className={`${compactInputClass} dark:bg-[#110e1b] dark:text-white`}
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option value="">-- คลัง --</option>
                                            {warehouses.map((w) => (
                                                <option key={String(w.warehouse_id)} value={String(w.warehouse_id)}>
                                                    {w.warehouse_name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="px-2 py-2">
                                        <select 
                                            value={line.location_id || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'location_id', e.target.value)}
                                            className={`${compactInputClass} dark:bg-[#110e1b] dark:text-white`}
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option value="">-- ที่เก็บ --</option>
                                            {filteredLocations.map((l) => (
                                                <option key={String(l.location_id)} value={String(l.location_id)}>
                                                    {l.name_th || l.code}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    
                                    <td className="px-2 py-2">
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
                                            className={`${compactInputClass} text-right font-bold text-purple-600 dark:text-white bg-purple-50/20 dark:bg-purple-400/5 border-purple-100 dark:border-purple-800/30`}
                                        />
                                    </td>

                                    <td className="px-2 py-2">
                                        <select 
                                            value={line.uom_id || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                            className={`${compactInputClass} text-center dark:bg-[#110e1b] dark:text-white`}
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
                                    
                                    <td className="px-2 py-2">
                                        <div className="relative group/lot">
                                            {line.reserve_policy === 'MANUAL' ? (
                                                <>
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
                                                        className={`${compactInputClass} pl-7 cursor-pointer font-bold text-orange-600 dark:text-orange-400 bg-orange-50/20 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30 focus:ring-orange-500`}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div 
                                                        onClick={!isLocked ? () => onSearchLot?.(index) : undefined}
                                                        className={`absolute left-0 top-0 bottom-0 flex items-center pl-2 ${!isLocked ? 'cursor-pointer group-hover/lot:text-blue-500 text-gray-400' : 'text-gray-300'}`}
                                                    >
                                                        <Search size={14} />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value="เลือก Lot No" 
                                                        readOnly
                                                        disabled={isLocked}
                                                        onClick={!isLocked ? () => onSearchLot?.(index) : undefined}
                                                        className={`${compactInputClass} pl-7 cursor-pointer font-bold text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 hover:border-blue-400 focus:ring-blue-500 transition-colors`}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </td>

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
                                            className={`${compactInputClass} text-right font-medium dark:bg-gray-800/40 text-gray-900 dark:text-gray-200`}
                                        />
                                    </td>

                                    <td className="px-2 py-2">
                                        <input 
                                            type="text" 
                                            value={line.line_discount_input ?? ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'line_discount_input', e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className={`${compactInputClass} text-right dark:bg-gray-800/40 text-gray-900 dark:text-gray-200`}
                                        />
                                    </td>
                                    
                                    <td className="px-2 py-2">
                                        <div className="h-8 flex items-center justify-end px-3 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded border border-emerald-200 dark:border-emerald-800/40 shadow-inner">
                                            {(line.line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </td>

                                    <td className="px-2 py-2">
                                        <input 
                                            type="text" 
                                            value={line.note || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'note', e.target.value)}
                                            placeholder="หมายเหตุ..."
                                            className={`${compactInputClass} italic text-gray-400 dark:text-gray-500 placeholder-gray-300 dark:placeholder-gray-700 dark:bg-gray-800/30`}
                                        />
                                    </td>
                                    
                                    {!isLocked && (
                                        <td className="px-2 py-2 text-center sticky right-[-1px] pr-[9px] bg-white dark:bg-[#110e1b] group-hover:bg-[#fcfaff] dark:group-hover:bg-[#1d1929] z-[30] transition-colors border-l border-gray-100 dark:border-gray-800 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.8)] isolate">
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
                    <div className="sticky left-0 w-full flex flex-col items-center justify-center py-24 gap-3 text-gray-400 dark:text-gray-600 bg-gray-50/20 dark:bg-[#110e1b]/10 min-h-[300px] border-t border-gray-100 dark:border-gray-800">
                        <Package size={48} className="opacity-10" />
                        <span className="text-sm font-medium">ยังไม่มีรายการจองสินค้า</span>
                        <button 
                            type="button" 
                            onClick={onAddLine} 
                            className="mt-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold underline transition-colors"
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
