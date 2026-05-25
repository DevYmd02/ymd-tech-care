import { useState, useMemo } from 'react';
import { Package, Plus, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { DeliveryLineValues } from '../schemas/delivery.schemas';
import type { UOMListItem, WarehouseListItem } from '@master-data/types/master-data-types';
import type { Location } from '@master-data/inventory/types/inventory-master.types';
import { UOMPickerModal, type UOMPickerItem } from '@/shared/components/ui/feedback/UOMPickerModal';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import { ItemBarcodeService } from '@inventory/services/item-barcode.service';

interface DeliveryLineTableProps {
    lines: DeliveryLineValues[];
    uoms: UOMListItem[];
    warehouses?: WarehouseListItem[];
    locations?: Location[];
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
    'w-full h-9 px-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-100 dark:disabled:border-slate-800/50 disabled:cursor-not-allowed';

const cellNumberClass =
    'w-full h-9 px-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded text-sm text-right text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-100 dark:disabled:border-slate-800/50 disabled:cursor-not-allowed';

const thClass =
    'px-3 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap';

const tdClass = 'px-1 py-2 align-middle';

export function DeliveryLineTable({
    lines,
    uoms,
    warehouses = [],
    locations = [],
    onAddLine,
    onRemoveLine,
    onLineChange,
    onSearchProduct,
    onSearchWarehouse,
    onSearchLocation,
    onSearchLot,
    isViewOnly = false,
}: DeliveryLineTableProps) {
    // --- UOM Picker States ---
    const [activeUomRowIndex, setActiveUomRowIndex] = useState<number | null>(null);
    const activeLine = activeUomRowIndex !== null ? lines[activeUomRowIndex] : null;
    const activeItemId = activeLine ? Number(activeLine.item_id || 0) : 0;

    // Fetch conversions for selected item
    const { data: conversionData, isLoading: isLoadingConversions } = useQuery({
        queryKey: ['delivery-uom-conversions', activeItemId],
        queryFn: () => UOMConversionService.getByItemId(activeItemId),
        enabled: !!activeItemId && activeItemId > 0,
        staleTime: 2 * 60 * 1000,
    });

    // Fetch barcodes for selected item
    const { data: barcodeData } = useQuery({
        queryKey: ['delivery-item-barcodes', activeItemId],
        queryFn: () => ItemBarcodeService.getAll({ item_id: activeItemId }),
        enabled: !!activeItemId && activeItemId > 0,
        staleTime: 2 * 60 * 1000,
    });

    // Map UOM conversions to UOMPickerItem[]
    const uomPickerItems = useMemo((): UOMPickerItem[] => {
        const conversions = conversionData?.items || [];
        const barcodes = barcodeData?.items || [];
        return conversions.map(conv => {
            const uomInfo = uoms.find(u => Number(u.uom_id || u.id) === Number(conv.from_unit_id));
            const matchedBarcode = barcodes.find(b => Number(b.uom_id) === Number(conv.conversion_id));
            return {
                conversion_id: conv.conversion_id,
                from_unit_id: conv.from_unit_id,
                from_unit_name: conv.from_unit_name || uomInfo?.uom_name || String(conv.from_unit_id),
                from_unit_name_en: uomInfo?.uom_name_en || uomInfo?.uom_nameeng || uomInfo?.uom_code || undefined,
                conversion_factor: conv.conversion_factor,
                barcode: matchedBarcode?.barcode || undefined,
            };
        });
    }, [conversionData, uoms, barcodeData]);

    const handleSelectUom = (item: UOMPickerItem) => {
        if (activeUomRowIndex !== null) {
            onLineChange(activeUomRowIndex, 'uom_id', String(item.from_unit_id));
        }
        setActiveUomRowIndex(null);
    };

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Package size={18} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">รายการสินค้าที่จัดส่ง</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {lines.length > 0 ? `${lines.length} รายการ` : 'ยังไม่มีรายการ'}
                        </p>
                    </div>
                </div>
                {!isViewOnly && (
                    <button
                        type="button"
                        onClick={onAddLine}
                        className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                    >
                        <Plus size={14} />
                        เพิ่มรายการ
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-200 dark:scrollbar-thumb-blue-900/30">
                <table className="w-full min-w-[2000px] border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="sticky left-0 z-20 w-12 px-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-[#1a1f2e] border-b border-r border-slate-200 dark:border-slate-800 py-3">ลำดับ</th>
                            <th className={`${thClass} sticky left-12 z-20 bg-slate-50 dark:bg-[#1a1f2e] border-b border-r border-slate-200 dark:border-slate-800`} style={{ width: 220 }}>รหัสสินค้า</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ minWidth: 400 }}>ชื่อสินค้า</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 140 }}>จำนวนสั่ง</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 140 }}>ค้างจัดส่ง</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 140 }}>จำนวนจัดส่ง</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 140 }}>หน่วย</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 200 }}>คลังสินค้า</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 200 }}>ที่เก็บ</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 200 }}>LOT NUMBER</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 200 }}>SERIAL NO.</th>
                            <th className={`${thClass} border-b border-slate-200 dark:border-slate-800`} style={{ width: 250 }}>หมายเหตุ</th>
                            {!isViewOnly && (
                                <th className="sticky right-0 z-20 w-12 bg-slate-50 dark:bg-[#1a1f2e] border-b border-l border-slate-200 dark:border-slate-800 shadow-[-4px_0_8px_rgba(0,0,0,0.05)]"></th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-[#0f172a]">
                        {lines.map((line, index) => (
                            <tr key={index} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all">
                                {/* ลำดับ */}
                                <td className="sticky left-0 z-10 px-3 text-center align-middle bg-white dark:bg-[#0f172a] group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 border-b border-r border-slate-100 dark:border-slate-800">
                                    <span className="text-xs text-slate-500 font-medium font-mono">
                                        {index + 1}
                                    </span>
                                </td>

                                {/* รหัสสินค้า */}
                                <td className={`${tdClass} sticky left-12 z-10 bg-white dark:bg-[#0f172a] group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 border-b border-r border-slate-100 dark:border-slate-800`}>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={line.item_code || ''}
                                            readOnly
                                            onClick={() => !isViewOnly && onSearchProduct(index)}
                                            className={`${cellInputClass} cursor-pointer hover:border-slate-300 dark:hover:border-slate-600`}
                                            placeholder="รหัสสินค้า"
                                        />
                                        {!isViewOnly && (
                                            <button
                                                type="button"
                                                onClick={() => onSearchProduct(index)}
                                                className="shrink-0 h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors shadow-sm"
                                            >
                                                <Search size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>

                                {/* ชื่อสินค้า */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <input
                                        type="text"
                                        value={line.item_name || ''}
                                        readOnly
                                        className={`${cellInputClass} bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800/50`}
                                        placeholder="ชื่อสินค้าอัตโนมัติ"
                                    />
                                </td>

                                {/* จำนวนสั่ง */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <input
                                        type="number"
                                        value={line.qty_ordered || ''}
                                        readOnly
                                        className={`${cellNumberClass} bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400`}
                                        placeholder="0"
                                    />
                                </td>

                                {/* ค้างจัดส่ง */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <input
                                        type="number"
                                        value={Math.max(0, (Number(line.remaining_qty) || 0) - (Number(line.qty_shipped) || 0))}
                                        readOnly
                                        className={`${cellNumberClass} bg-amber-50/30 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 font-bold`}
                                        placeholder="0"
                                    />
                                </td>

                                {/* จำนวนจัดส่ง */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <input
                                        type="number"
                                        value={line.qty_shipped || ''}
                                        onChange={(e) => onLineChange(index, 'qty_shipped', parseFloat(e.target.value) || 0)}
                                        className={cellNumberClass}
                                        min={0}
                                        step={0.001}
                                        placeholder="0"
                                        disabled={isViewOnly}
                                    />
                                </td>

                                {/* หน่วย */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            disabled={isViewOnly || !line.item_id}
                                            onClick={() => setActiveUomRowIndex(index)}
                                            className={`${cellInputClass} text-left flex items-center justify-between font-medium disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:opacity-60 disabled:cursor-not-allowed`}
                                        >
                                            <span className="truncate">
                                                {uoms.find(u => String(u.id || u.uom_id) === String(line.uom_id))?.uom_name || 
                                                 (line.uom_id ? `[ID: ${line.uom_id}]` : '-- หน่วย --')}
                                            </span>
                                            {!isViewOnly && !!line.item_id && <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1 shrink-0">▼</span>}
                                        </button>
                                    </div>
                                </td>

                                {/* คลังสินค้า */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <div
                                        className={`${
                                            isViewOnly
                                                ? 'w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed flex items-center truncate'
                                                : `${cellInputClass} flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-600`
                                        }`}
                                        onClick={() => !isViewOnly && onSearchWarehouse(index)}
                                    >
                                        <span
                                            className={
                                                line.warehouse_id
                                                    ? isViewOnly ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'
                                                    : 'text-slate-400 dark:text-slate-500 italic'
                                            }
                                        >
                                            {(() => {
                                                if (line.warehouse_name) return line.warehouse_name;
                                                if (!line.warehouse_id) return 'คลังสินค้า';
                                                const wh = warehouses.find(
                                                    (w: WarehouseListItem) => String(w.warehouse_id || w.id) === String(line.warehouse_id)
                                                );
                                                return wh ? (wh.warehouse_name || wh.warehouse_code || String(line.warehouse_id)) : String(line.warehouse_id);
                                            })()}
                                        </span>
                                        {!isViewOnly && <Search size={12} className="text-slate-400 dark:text-slate-500" />}
                                    </div>
                                </td>

                                {/* ที่เก็บ */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <div
                                        className={`${
                                            isViewOnly
                                                ? 'w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed flex items-center truncate'
                                                : `${cellInputClass} flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-600`
                                        }`}
                                        onClick={() => !isViewOnly && onSearchLocation(index)}
                                    >
                                        <span
                                            className={
                                                line.location_id
                                                    ? isViewOnly ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'
                                                    : 'text-slate-400 dark:text-slate-500 italic'
                                            }
                                        >
                                            {(() => {
                                                if (line.location_name) return line.location_name;
                                                if (!line.location_id) return 'ที่เก็บ';
                                                const loc = locations.find(
                                                    (l: Location) => String(l.location_id || l.id) === String(line.location_id)
                                                );
                                                return loc ? (loc.name_th || loc.code || String(line.location_id)) : String(line.location_id);
                                            })()}
                                        </span>
                                        {!isViewOnly && <Search size={12} className="text-slate-400 dark:text-slate-500" />}
                                    </div>
                                </td>

                                {/* LOT NUMBER */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <div 
                                        className={`${
                                            isViewOnly
                                                ? 'w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed flex items-center truncate'
                                                : `${cellInputClass} flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-600`
                                        }`}
                                        onClick={() => !isViewOnly && onSearchLot(index)}
                                    >
                                        <span className={line.lot_no ? (isViewOnly ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200') : 'text-slate-400 dark:text-slate-500 italic'}>
                                            {line.lot_no || 'Lot No.'}
                                        </span>
                                        {!isViewOnly && <Search size={12} className="text-slate-400 dark:text-slate-500" />}
                                    </div>
                                </td>

                                {/* SERIAL NO. */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <input
                                        type="text"
                                        value={line.serial_no || ''}
                                        onChange={(e) => onLineChange(index, 'serial_no', e.target.value)}
                                        className={cellInputClass}
                                        placeholder="Serial No."
                                        disabled={isViewOnly}
                                    />
                                </td>

                                {/* หมายเหตุ */}
                                <td className={`${tdClass} border-b border-slate-100 dark:border-slate-800`}>
                                    <input
                                        type="text"
                                        value={line.remarks || ''}
                                        onChange={(e) => onLineChange(index, 'remarks', e.target.value)}
                                        className={`${cellInputClass} text-slate-700 dark:text-slate-300`}
                                        placeholder="หมายเหตุ..."
                                        disabled={isViewOnly}
                                    />
                                </td>

                                {/* Delete Button */}
                                {!isViewOnly && (
                                    <td className="sticky right-0 z-10 px-1 text-center align-middle bg-white dark:bg-[#0f172a] group-hover:bg-slate-50 dark:group-hover:bg-slate-800 border-b border-l border-slate-200 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => onRemoveLine(index)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mx-auto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {lines.length === 0 && (
                    <div className="sticky left-0 w-full flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/20">
                        <Package className="w-16 h-16 mb-4 text-slate-200 dark:text-slate-700 opacity-40" />
                        <p className="text-base font-medium">ยังไม่มีรายการสินค้าจัดส่ง</p>
                        {!isViewOnly && (
                            <button 
                                type="button"
                                onClick={onAddLine}
                                className="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold underline transition-colors"
                            >
                                เพิ่มรายการแรกที่นี่
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            {lines.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-[#1a1f2e]/50 rounded-xl border border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                        รวมรายการจัดส่งทั้งหมด
                    </span>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">จำนวนรวม</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                                {lines.reduce((sum, l) => sum + (l.qty_shipped || 0), 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* UOM Picker Modal Component */}
            <UOMPickerModal
                isOpen={activeUomRowIndex !== null}
                onClose={() => setActiveUomRowIndex(null)}
                onSelect={handleSelectUom}
                items={uomPickerItems}
                isLoading={isLoadingConversions}
                selectedFromUnitId={activeLine ? Number(activeLine.uom_id || 0) : undefined}
                title={`เลือกหน่วยนับสำหรับ ${activeLine?.item_name || 'สินค้า'}`}
            />
        </div>
    );
}
