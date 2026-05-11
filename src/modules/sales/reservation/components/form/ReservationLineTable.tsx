import { useRef } from 'react';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { Plus, Trash2, Package, Search, AlertCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { ReservationLineValues, ReservationFormValues } from '../../schemas/reservation-schemas';
import type { ReservationLineData } from '../../types/reservation.types';
import type { UnitListItem, WarehouseListItem } from '@master-data/types/master-data-types';
import type { Location } from '@inventory/types/inventory-master.types';
import { formatNumber } from '@/shared/utils';

interface ReservationLineTableProps {
    lines: ReservationLineData[];
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof ReservationLineData, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    onSearchLot?: (index: number) => void;
    onSearchWarehouse?: (index: number) => void;
    onSearchLocation?: (index: number) => void;
    uoms?: UnitListItem[];
    warehouses?: WarehouseListItem[];
    locations?: Location[];
    priceLevelNames?: import('@sales-master/pages/price-level-name/types/price-level-name.types').PriceLevelName[];
    readOnly?: boolean;
    currencySymbol?: string;
}

export function ReservationLineTable({ 
    lines, 
    onAddLine, 
    onRemoveLine, 
    onLineChange, 
    onSearchProduct, 
    onSearchLot,
    // onSearchWarehouse,
    // onSearchLocation,
    uoms = [],
    // warehouses = [],
    // locations = [],
    priceLevelNames = [],
    readOnly = false,
    currencySymbol = 'บาท'
}: ReservationLineTableProps) {
    const { formState: { errors } } = useFormContext<ReservationFormValues>();
    const { toast } = useToast();
    const isLocked = readOnly;

    // Dedup ref: prevents multiple rows firing the same toast simultaneously
    const toastThrottleRef = useRef(false);
    const showNoItemToast = () => {
        if (toastThrottleRef.current) return;
        toastThrottleRef.current = true;
        toast('กรุณาเลือกสินค้าก่อนเลือกล็อต', 'warning');
        setTimeout(() => { toastThrottleRef.current = false; }, 1500);
    };


    const getLineError = (index: number) => {
        if (!errors.lines || !Array.isArray(errors.lines)) return undefined;
        return errors.lines[index];
    };

    const hasLineFieldError = (index: number, fieldName: keyof ReservationLineValues) => {
        const lineError = getLineError(index);
        return !!(lineError as Record<string, unknown> | undefined)?.[fieldName];
    };

    const getFieldErrorClass = (index: number, fieldName: keyof ReservationLineValues) => {
        return hasLineFieldError(index, fieldName) ? '!border-red-500 !ring-1 !ring-red-500/50' : '';
    };

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

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-500/20 scrollbar-track-transparent bg-white dark:bg-gray-900">
                <table className="table-fixed text-sm text-left border-separate border-spacing-0 w-full min-w-[1590px]">
                    <colgroup>
                        <col className="w-[60px]" />
                        <col className="w-[200px]" />
                        <col className="w-[300px]" />
                        {/* <col className="w-[160px]" />
                        <col className="w-[160px]" /> */}
                        <col className="w-[120px]" />
                        <col className="w-[120px]" />
                        {/* <col className="w-[220px]" /> */}
                        <col className="w-[140px]" />
                        <col className="w-[130px]" />
                        <col className="w-[160px]" />
                        <col className="w-[300px]" />
                        {!isLocked && <col className="w-[60px]" />}
                    </colgroup>
                    <thead className="bg-[#fbfaff] dark:bg-gray-800 sticky top-0 z-40">
                        <tr className="bg-purple-50/50 dark:bg-purple-900/10">
                             <th className={`${headerThClass} text-center text-purple-600 dark:text-purple-400 sticky left-0 bg-[#fbfaff] dark:bg-gray-800 z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-200 dark:after:bg-gray-700`}>ลำดับ</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300 sticky left-[60px] bg-[#fbfaff] dark:bg-gray-800 z-50 border-r-0 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-purple-100 dark:after:bg-purple-800/40`}>รหัสสินค้า</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300`}>ชื่อสินค้า</th>
                             {/* <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>คลัง</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>ที่เก็บ</th> */}
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>จอง (QTY)</th>
                             <th className={`${headerThClass} text-center text-purple-700 dark:text-purple-300/60`}>หน่วย</th>
                             {/* <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>ล็อต</th> */}
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>ราคา/หน่วย</th>
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>ส่วนลด</th>
                             <th className={`${headerThClass} text-right text-purple-700 dark:text-purple-300/60`}>ยอดรวม</th>
                             <th className={`${headerThClass} text-purple-700 dark:text-purple-300/60`}>หมายเหตุ</th>
                             {!isLocked && <th className={`${headerThClass} text-center sticky right-[-1px] bg-[#fbfaff] dark:bg-gray-800 z-[60] border-l border-gray-200 dark:border-gray-700 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.15)] dark:shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.4)] pr-[13px]`}></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {lines.length > 0 && lines.map((line, index) => {
                            return (
                                <tr key={index} className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group">
                                    <td className="px-2 py-2 text-center text-purple-400 dark:text-purple-500/70 font-bold sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[1px] after:bg-gray-100 dark:after:bg-gray-800/40">
                                        {index + 1}
                                    </td>
                                    
                                    <td className="px-2 py-2 sticky left-[60px] bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 z-10 transition-colors after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-[2px] after:bg-purple-50 dark:after:bg-purple-800/20">
                                        <div className="flex gap-1 items-center">
                                            <input 
                                                value={line.item_code || ''}
                                                readOnly
                                                className={`${compactInputClass} bg-gray-50/50 dark:bg-gray-800 italic cursor-not-allowed text-purple-700 dark:text-white/70 border-gray-200 dark:border-gray-700 ${getFieldErrorClass(index, 'item_id')}`}
                                                placeholder="รหัส"
                                            />
                                            {!isLocked && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => onSearchProduct?.(index)}
                                                    className={`p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center font-bold ${hasLineFieldError(index, 'item_id') ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
                                                >
                                                    <Search size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-2 py-2">
                                        <input 
                                            value={line.item_name || ''}
                                            readOnly
                                            className={`${compactInputClass} bg-gray-50/50 dark:bg-gray-800 cursor-not-allowed truncate text-gray-600 dark:text-white/80 border-gray-200 dark:border-gray-700`}
                                            placeholder="ชื่อสินค้า"
                                        />
                                    </td>
                                    
                                     {/* <td className="px-2 py-2">
                                         <div className="flex gap-1 items-center">
                                             <input 
                                                 value={warehouses.find(w => String(w.warehouse_id) === String(line.warehouse_id))?.warehouse_name || ''}
                                                 readOnly
                                                 onClick={!isLocked ? () => onSearchWarehouse?.(index) : undefined}
                                                 className={`${compactInputClass} ${!isLocked ? 'cursor-pointer hover:border-purple-400 focus:border-purple-500' : 'cursor-not-allowed bg-gray-50/50'} text-gray-700 dark:text-white/80 border-gray-200 dark:border-gray-700 transition-colors ${getFieldErrorClass(index, 'warehouse_id')}`}
                                                 placeholder="เลือกคลัง..."
                                             />
                                         </div>
                                     </td>

                                     <td className="px-2 py-2">
                                         <div className="flex gap-1 items-center">
                                             <input 
                                                 value={locations.find(l => String(l.location_id) === String(line.location_id))?.name_th || locations.find(l => String(l.location_id) === String(line.location_id))?.code || ''}
                                                 readOnly
                                                 onClick={!isLocked ? () => onSearchLocation?.(index) : undefined}
                                                 className={`${compactInputClass} ${!isLocked ? 'cursor-pointer hover:border-orange-400 focus:border-orange-500' : 'cursor-not-allowed bg-gray-50/50'} text-gray-700 dark:text-white/80 border-gray-200 dark:border-gray-700 transition-colors ${getFieldErrorClass(index, 'location_id')}`}
                                                 placeholder="เลือกที่เก็บ..."
                                             />
                                         </div>
                                     </td> */}
                                    
                                    <td className="px-2 py-2">
                                        <input 
                                            type="text" 
                                            value={line.qty_reserved || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // 🎯 Allow up to 3 decimal places for QTY
                                                if (val === '' || /^\d*\.?\d{0,3}$/.test(val)) {
                                                    onLineChange(index, 'qty_reserved', val);
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== '' && !isNaN(Number(val))) {
                                                    onLineChange(index, 'qty_reserved', Number(val).toFixed(3));
                                                }
                                            }}
                                            placeholder="0"
                                            maxLength={12}
                                            className={`${compactInputClass} text-right font-bold text-purple-600 dark:text-white bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700 ${getFieldErrorClass(index, 'qty_reserved')}`}
                                        />
                                    </td>

                                    <td className="px-2 py-2">
                                        <select 
                                            value={line.uom_id || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => onLineChange(index, 'uom_id', e.target.value)}
                                            className={`${compactInputClass} text-center bg-white dark:bg-gray-800 dark:text-white/80 border-gray-200 dark:border-gray-700 ${getFieldErrorClass(index, 'uom_id')}`}
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
                                    
                                    {/* <td className="px-2 py-2">
                                        <div className="relative group/lot">
                                            <div 
                                                onClick={!isLocked ? () => {
                                                    if (line.item_id) {
                                                        onSearchLot?.(index);
                                                    } else {
                                                        showNoItemToast();
                                                    }
                                                } : undefined}
                                                className={`absolute left-0 top-0 bottom-0 flex items-center pl-2 ${!isLocked ? 'cursor-pointer group-hover/lot:text-purple-500 text-gray-400' : 'text-gray-300'}`}
                                            >
                                                <Search size={14} />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={line.lot_no || ''} 
                                                readOnly
                                                disabled={isLocked}
                                                onClick={!isLocked ? () => {
                                                    if (line.item_id) {
                                                        onSearchLot?.(index);
                                                    } else {
                                                        showNoItemToast();
                                                    }
                                                } : undefined}
                                                placeholder="เลือกล็อตสินค้า..."
                                                className={`${compactInputClass} ${getFieldErrorClass(index, 'lot_no')} pl-7 cursor-pointer font-bold text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 border-purple-100 dark:border-gray-700 hover:border-purple-400 focus:ring-purple-500 transition-colors`}
                                            />
                                        </div>
                                    </td> */}

                                    <td className="px-2 py-2">
                                        <input 
                                            type="text" 
                                            value={line.unit_price || ''} 
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // 🎯 Allow up to 2 decimal places for Price
                                                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                                    onLineChange(index, 'unit_price', val);
                                                }
                                            }}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== '' && !isNaN(Number(val))) {
                                                    onLineChange(index, 'unit_price', Number(val).toFixed(2));
                                                }
                                            }}
                                            placeholder="0.00"
                                            maxLength={12}
                                            className={`${compactInputClass} text-right font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700`}
                                        />
                                        
                                        {/* 🏷️ Price Source Badge */}
                                        {(() => {
                                            const source = String(line.price_source_name || '').toUpperCase();
                                            if (!source) return null;

                                            const config: Record<string, { label: string; class: string }> = {
                                                'MANUAL': { label: 'Manual', class: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' },
                                                'PRICE_LEVEL': { label: 'Price Level', class: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
                                                'PRICE_LIST': { label: 'Price List', class: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
                                            };

                                            const item = { ...(config[source] || { label: source, class: 'bg-gray-50 text-gray-600 border-gray-200' }) };

                                            // 🏆 Enhancement: If it's Price Level, show the Level No & Name
                                            if (source === 'PRICE_LEVEL' && line.price_level_priority) {
                                                const levelName = priceLevelNames.find(l => (Number(l.level_no) || Number(l.levelNo)) === Number(line.price_level_priority))?.name;
                                                item.label = `Price Level ${line.price_level_priority}${levelName ? ` - ${levelName}` : ''}`;
                                            }

                                            return (
                                                <div className={`mt-1 flex items-center justify-end gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight whitespace-nowrap ${item.class}`}>
                                                    {item.label}
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    <td className="px-2 py-2">
                                        <div className="flex flex-col items-end gap-1">
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
                                            {String(line.line_discount_input || '').includes('%') && (line.line_discount ?? 0) > 0 && (
                                                <div className="text-[10px] font-bold text-red-500 whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-200">
                                                    -{formatNumber(line.line_discount)} {currencySymbol}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    
                                     <td className="px-2 py-2">
                                         <div className={`h-8 flex flex-col items-end justify-center px-3 font-bold bg-white dark:bg-gray-900 rounded border shadow-inner overflow-hidden w-full ${line.line_total < 0 ? 'text-red-500 border-red-200 dark:border-red-800' : 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'}`}>
                                            <span className="truncate w-full text-right overflow-hidden">{formatNumber(line.line_total || 0)}</span>
                                            {hasLineFieldError(index, 'line_total') && (
                                                <div className="flex items-center gap-0.5 text-[8px] font-medium text-red-500 mt-[-2px]">
                                                    <AlertCircle size={8} />
                                                    <span>ส่วนลดเกิน</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

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
                                    
                                    {!isLocked && (
                                        <td className="px-2 py-2 text-center sticky right-[-1px] pr-[9px] bg-white dark:bg-gray-900 group-hover:bg-[#fcfaff] dark:group-hover:bg-gray-800 z-[30] transition-colors border-l border-gray-100 dark:border-gray-700 shadow-[-12px_0_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.8)] isolate">
                                            <div className="flex items-center justify-center gap-1">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        if (line.item_id) {
                                                            onSearchLot?.(index);
                                                        } else {
                                                            showNoItemToast();
                                                        }
                                                    }}
                                                    className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
                                                    title="จัดการล็อตและคลังสินค้า (ถ้าจำเป็น)"
                                                >
                                                    <Package size={18} />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => onRemoveLine(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {lines.length === 0 && (
                    <div className="sticky left-0 w-full flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-gray-800/20">
                        <Package className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-700 opacity-40" />
                        <p className="text-base font-medium">ยังไม่มีรายการจองสินค้า</p>
                        <button 
                            type="button"
                            onClick={onAddLine}
                            className="mt-3 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold underline transition-colors"
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

