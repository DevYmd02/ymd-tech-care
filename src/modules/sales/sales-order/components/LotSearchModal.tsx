import React, { useState, useCallback, useMemo } from 'react';
import { Search, Tag, Check, X, AlertCircle, MapPin } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { ReservationInventoryService } from '@sales/reservation/services/reservation-inventory.service';
import type { LotNo } from '@inventory/types/inventory-master.types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { formatThaiDate as formatDate } from '@utils/dateUtils';
import { MasterDataService } from '@master-data/services/master-data.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { ItemLotService } from '@inventory/services/item-lot.service';
import type { ItemLot } from '@inventory/types/item-lot-types';
import { formatNumber } from '@/shared/utils';

export interface LotSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lot: LotNo) => void;
    itemId?: string | number;
    warehouseId?: string | number | null;
    locationId?: string | number | null;
    title?: string;
}

export const LotSearchModal: React.FC<LotSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    itemId,
    warehouseId,
    locationId,
    title = 'ค้นหาล็อตสินค้า - Search Lot Numbers'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [ignoreFilters, setIgnoreFilters] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 400);

    // --- Auxiliary Data (for display names) ---
    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses-lookup'],
        queryFn: () => MasterDataService.getWarehouses(),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const { data: locationsResponse } = useQuery({
        queryKey: ['locations-lookup'],
        queryFn: () => LocationService.getAll({ limit: 5000 }),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });
    const locations = useMemo(() => locationsResponse?.items || [], [locationsResponse]);

    const currentWarehouseName = useMemo(() => {
        if (!warehouseId) return '';
        const wh = warehouses.find(w => Number(w.warehouse_id) === Number(warehouseId));
        return wh?.warehouse_name || String(warehouseId);
    }, [warehouseId, warehouses]);

    const currentLocationName = useMemo(() => {
        if (!locationId) return '';
        const loc = locations.find(l => Number(l.location_id) === Number(locationId));
        return loc?.name_th || String(locationId);
    }, [locationId, locations]);

    // --- Lot Data ---
    const { data: response, isLoading: isLoadingBalances } = useQuery({
        queryKey: ['lot-lookup-so', debouncedSearch, itemId, warehouseId, locationId],
        queryFn: () => ReservationInventoryService.getAvailableLots({
            q: debouncedSearch,
            item_id: itemId,
            warehouse_id: warehouseId ?? undefined,
            location_id: locationId ?? undefined,
            limit: 100
        }),
        enabled: isOpen,
        staleTime: 0,
    });

    const { data: itemLotsResponse, isLoading: isLoadingMaster } = useQuery({
        queryKey: ['item-lots-so', itemId],
        queryFn: () => ItemLotService.getList(Number(itemId)),
        enabled: isOpen && !!itemId && Number(itemId) > 0
    });

    const isLoading = isLoadingBalances || isLoadingMaster;

    // Filter: If ignoreFilters = false, strict filter by warehouseId/locationId
    const lots = useMemo(() => {
        const rawItems = response?.items || [];
        const masterRecords = (itemLotsResponse || []) as ItemLot[];
        
        // Enrich with name lookups and master lot data
        const enriched = rawItems.map(balance => {
            const masterId = balance.lot_id || balance.lot_no_id;
            const masterLot = masterRecords.find(l => Number(l.lot_id) === masterId);
            
            const wh = warehouses.find(w => Number(w.warehouse_id) === Number(balance.warehouse_id));
            const loc = locations.find(l => Number(l.location_id) === Number(balance.location_id));
            
            return {
                ...balance,
                code: balance.code || masterLot?.lot_no || '',
                name_th: balance.name_th || masterLot?.supplier_name || '',
                mfg_date: balance.mfg_date || masterLot?.mfg_date || undefined,
                expiry_date: balance.expiry_date || masterLot?.expiry_date || undefined,
                warehouse_name: balance.warehouse_name || wh?.warehouse_name || '',
                location_name: balance.location_name || loc?.name_th || '',
            } as LotNo;
        });

        if (ignoreFilters) return enriched;

        return enriched.filter(balance => {
            if (warehouseId && Number(balance.warehouse_id) !== Number(warehouseId)) return false;
            if (locationId && Number(balance.location_id) !== Number(locationId)) return false;
            return true;
        });
    }, [response, itemLotsResponse, warehouses, locations, warehouseId, locationId, ignoreFilters]);

    const handleSelect = useCallback((lot: LotNo) => {
        onSelect(lot);
        onClose();
    }, [onSelect, onClose]);

    const hasActiveFilter = !!(warehouseId || locationId);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={
                <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                    <Tag size={20} className="text-white" />
                </div>
            }
            width="max-w-[1200px]"
            headerColor="bg-indigo-600"
        >
            <div className="flex flex-col h-[75vh]">
                {/* Header Controls */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">

                    {/* Filter Status Badge */}
                    {hasActiveFilter && (
                        <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
                            ignoreFilters
                                ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700'
                                : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                        }`}>
                            <div className={`p-1.5 rounded-lg ${ignoreFilters ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'}`}>
                                <MapPin size={14} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-[11px] font-bold uppercase tracking-wider ${ignoreFilters ? 'text-gray-400' : 'text-blue-500'}`}>
                                    {ignoreFilters ? 'กำลังแสดงสต็อกทั้งหมด' : 'ตัวกรองตำแหน่งทำงานอยู่'}
                                </p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {ignoreFilters
                                        ? 'รวมสต็อกสินค้าจากทุกคลังและที่เก็บ'
                                        : `แสดงเฉพาะสต็อกใน: ${currentWarehouseName || 'คลัง'} / ${currentLocationName || 'ที่เก็บ'}`
                                    }
                                </p>
                            </div>
                            <button
                                onClick={() => setIgnoreFilters(!ignoreFilters)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                    ignoreFilters
                                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
                                        : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50'
                                }`}
                            >
                                {ignoreFilters ? 'กลับไปที่ตัวกรอง' : 'แสดงสต็อกทั้งหมด'}
                            </button>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขล็อต (Lot No)..."
                            className="w-full pl-12 pr-10 h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 dark:text-white shadow-sm transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {!itemId && (
                        <div className="flex items-center text-amber-600 dark:text-amber-500 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-800/30">
                            <AlertCircle size={16} className="mr-2 shrink-0" />
                            กรุณาเลือกสินค้าก่อนทำการค้นหาล็อต เพื่อให้ระบบกรองข้อมูลได้อย่างถูกต้อง
                        </div>
                    )}
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
                            <p className="text-gray-500 font-medium animate-pulse">กำลังโหลดข้อมูลล็อต...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขล็อต (Lot No.)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">จำนวนคงเหลือ<br/>(ON HAND)</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right text-orange-600 dark:text-orange-400">ยอดจอง<br/>(RESERVED)</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right text-emerald-600 dark:text-emerald-400">พร้อมใช้งาน<br/>(AVAILABLE)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">คลัง/ที่เก็บ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">วันผลิต/หมดอายุ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {lots.length > 0 ? (
                                    lots.slice(0, 100).map((lot) => {
                                        const isFromDifferentWarehouse = ignoreFilters && warehouseId && Number(lot.warehouse_id) !== Number(warehouseId);
                                        return (
                                            <tr
                                                key={`${lot.lot_no_id || lot.id}-${lot.warehouse_id || 'nw'}-${lot.location_id || 'nl'}`}
                                                className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group cursor-pointer"
                                                onClick={() => handleSelect(lot)}
                                            >
                                                {/* Lot No */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform inline-block w-fit">
                                                            {lot.code}
                                                        </span>
                                                        {lot.name_th && <span className="text-[10px] text-gray-500 mt-0.5">{lot.name_th}</span>}
                                                    </div>
                                                </td>

                                                {/* ON HAND */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {formatNumber(lot.qty_on_hand ?? lot.balance_qty ?? 0)}
                                                    </span>
                                                </td>

                                                {/* RESERVED */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">
                                                        {formatNumber(lot.qty_reserved ?? 0)}
                                                    </span>
                                                </td>

                                                {/* AVAILABLE */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {formatNumber(lot.qty_available ?? lot.sale_stock ?? 0)}
                                                    </span>
                                                </td>

                                                {/* Warehouse / Location */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-xs">
                                                        <span className={`font-medium ${isFromDifferentWarehouse ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {(lot as LotNo & { warehouse_name?: string }).warehouse_name || currentWarehouseName || '-'}
                                                        </span>
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            {(lot as LotNo & { location_name?: string }).location_name || currentLocationName || '-'}
                                                        </span>
                                                        {isFromDifferentWarehouse && (
                                                            <span className="mt-0.5 text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full w-fit">
                                                                คนละคลัง
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* MFG / EXP */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-[11px]">
                                                        <span className="text-gray-500">MFG: {lot.mfg_date ? formatDate(lot.mfg_date) : '-'}</span>
                                                        <span className="text-gray-500">EXP: {lot.expiry_date ? formatDate(lot.expiry_date) : '-'}</span>
                                                    </div>
                                                </td>

                                                {/* Action */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSelect(lot); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                    >
                                                        เลือก <Check size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Tag size={48} className="mb-3 opacity-20" />
                                                <p className="font-bold">ไม่พบข้อมูลล็อต</p>
                                                <p className="text-sm mt-1">
                                                    {itemId
                                                        ? hasActiveFilter && !ignoreFilters
                                                            ? 'ไม่มีสต็อกในคลังนี้ ลองกด "แสดงสต็อกทั้งหมด" เพื่อดูจากคลังอื่น'
                                                            : 'ไม่มีล็อตสินค้าสำหรับรายการนี้'
                                                        : 'กรุณาเลือกสินค้าก่อนทำการค้นหาล็อต'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                    <div className="flex gap-6 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">
                            พบทั้งหมด <span className="font-bold text-indigo-600">{lots.length}</span> รายการ
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                            รวมพร้อมใช้: <span className="font-bold text-emerald-600">
                                {formatNumber(lots.reduce((acc, l) => acc + (l.qty_available ?? l.sale_stock ?? 0), 0))}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
