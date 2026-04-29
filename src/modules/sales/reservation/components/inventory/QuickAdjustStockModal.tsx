import React, { useState, useEffect } from 'react';
import { RotateCcw, Save, AlertCircle, TrendingUp, TrendingDown, Package, Warehouse, MapPin } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { ItemLotService } from '@inventory/services/item-lot.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MasterDataService } from '@master-data/services/master-data.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { WarehouseSearchModal } from '../search-modals/WarehouseSearchModal';
import { LocationSearchModal } from '../search-modals/LocationSearchModal';
import type { WarehouseListItem } from '@master-data/types/master-data-types';
import type { Location } from '@inventory/types/inventory-master.types';
import axios from 'axios';

interface QuickAdjustStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    lotId: number;
    lotNo: string;
    itemName: string;
    warehouseName?: string;
    locationName?: string;
    currentQty: number;
    reservedQty: number;
    itemId: number;
    lotNoId: number;
    warehouseId?: number;
    locationId?: number;
    originalRecord?: Record<string, unknown>;
}

export const QuickAdjustStockModal: React.FC<QuickAdjustStockModalProps> = ({
    isOpen,
    onClose,
    lotId,
    lotNo,
    itemName,
    warehouseName,
    locationName,
    currentQty,
    reservedQty,
    itemId,
    lotNoId,
    warehouseId: initialWarehouseId,
    locationId: initialLocationId,
    originalRecord
}) => {
    const queryClient = useQueryClient();
    const [newQty, setNewQty] = useState<number>(currentQty);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Location State
    const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: number; name: string } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ id: number; name: string } | null>(null);

    // Sub-modal state
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);

    // Fetch Data
    const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({
        queryKey: ['warehouses-lookup'],
        queryFn: () => MasterDataService.getWarehouses(),
        enabled: isOpen
    });

    const { data: locationsResponse, isLoading: isLoadingLocations } = useQuery({
        queryKey: ['locations-lookup'],
        queryFn: () => LocationService.getAll({ limit: 5000 }),
        enabled: isOpen
    });
    const locations = locationsResponse?.items || [];

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setNewQty(currentQty);
            setError(null);
            
            // Set Initial Warehouse
            if (initialWarehouseId || warehouseName) {
                setSelectedWarehouse({ 
                    id: Number(initialWarehouseId || 0), 
                    name: warehouseName || '' 
                });
            } else {
                setSelectedWarehouse(null);
            }

            // Set Initial Location
            if (initialLocationId || locationName) {
                setSelectedLocation({ 
                    id: Number(initialLocationId || 0), 
                    name: locationName || '' 
                });
            } else {
                setSelectedLocation(null);
            }
        }
    }, [isOpen, currentQty, initialWarehouseId, initialLocationId, warehouseName, locationName]);

    const diff = newQty - currentQty;
    const isLocationChanged = selectedWarehouse?.id !== initialWarehouseId || selectedLocation?.id !== initialLocationId;
    const hasChanges = diff !== 0 || isLocationChanged;

    const handleSubmit = async () => {
        if (newQty < 0) {
            setError('จำนวนสต็อกห้ามติดลบ');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await ItemLotService.quickAdjust(lotId, {
                ...(originalRecord || {}),
                qty_on_hand: newQty,
                qty_reserved: reservedQty,
                warehouse_id: selectedWarehouse?.id,
                location_id: selectedLocation?.id,
                item_id: itemId,
                lot_id: lotNoId,
            });

            // Refresh data
            await queryClient.invalidateQueries({ queryKey: ['lot-lookup-reservation'] });
            await queryClient.invalidateQueries({ queryKey: ['item-lots', itemId] });

            onClose();
        } catch (err: unknown) {
            let apiMessage = '';
            if (axios.isAxiosError(err)) {
                apiMessage = err.response?.data?.message || err.response?.data?.error;
            }
            setError(apiMessage || (err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการปรับสต็อก'));
        } finally {
            setIsSaving(false);
        }
    };

    const labelClass = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";
    const infoCardClass = "bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl p-3";

    return (
        <>
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="ปรับปรุงจำนวนสต็อก (Quick Adjust)"
            titleIcon={
                <div className="bg-amber-500 p-1.5 rounded-lg shadow-sm">
                    <Package size={20} className="text-white" />
                </div>
            }
            width="max-w-[480px]"
            headerColor="bg-amber-500"
        >
            <div className="space-y-5 p-1">
                {/* Header Info Banner */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full -mr-4 -mt-4 blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Lot Number</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{lotNo}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{itemName}</div>
                    </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button"
                        onClick={() => setIsWarehouseSearchOpen(true)}
                        className={`${infoCardClass} text-left transition-all hover:bg-gray-100 dark:hover:bg-gray-800 border-dashed border-gray-300 dark:border-gray-600`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Warehouse size={14} className="text-amber-500" />
                            <span className={labelClass.replace('mb-1.5', 'mb-0')}>คลังสินค้า (คลิกเพื่อเปลี่ยน)</span>
                        </div>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                            {selectedWarehouse?.name || 'ระบุคลังสินค้า'}
                        </div>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsLocationSearchOpen(true)}
                        disabled={!selectedWarehouse}
                        className={`${infoCardClass} text-left transition-all ${
                            selectedWarehouse 
                                ? 'hover:bg-gray-100 dark:hover:bg-gray-800 border-dashed border-gray-300 dark:border-gray-600' 
                                : 'opacity-50 cursor-not-allowed grayscale'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin size={14} className="text-amber-500" />
                            <span className={labelClass.replace('mb-1.5', 'mb-0')}>ที่เก็บ (คลิกเพื่อเปลี่ยน)</span>
                        </div>
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                            {selectedLocation?.name || 'ระบุที่เก็บ'}
                        </div>
                    </button>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* Adjustment Area */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-8 mb-6">
                        <div className="text-center flex-1">
                            <div className={labelClass}>จำนวนเดิม</div>
                            <div className="text-2xl font-bold text-gray-400">{currentQty.toLocaleString()}</div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                            <Save size={16} className="text-gray-300" />
                        </div>

                        <div className="text-center flex-1">
                            <div className={labelClass}>จำนวนใหม่</div>
                            <input
                                type="number"
                                value={newQty === 0 ? '' : newQty}
                                onChange={(e) => setNewQty(e.target.value === '' ? 0 : Number(e.target.value))}
                                onFocus={(e) => e.target.select()}
                                className="w-full text-center text-3xl font-black text-amber-600 bg-transparent border-none focus:ring-0 p-0"
                                autoFocus
                            />
                            <div className="h-0.5 w-full bg-amber-500/20 rounded-full mt-1"></div>
                        </div>
                    </div>

                    {/* Visual Diff */}
                    <div className="flex justify-center">
                        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-black shadow-sm ${
                            diff > 0 ? 'bg-emerald-100 text-emerald-700' : 
                            diff < 0 ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-500'
                        }`}>
                            {diff > 0 ? <TrendingUp size={14} /> : diff < 0 ? <TrendingDown size={14} /> : null}
                            {diff === 0 ? 'ไม่มีการเปลี่ยนแปลง' : `ส่วนต่าง: ${diff > 0 ? '+' : ''}${diff.toLocaleString()}`}
                        </div>
                    </div>
                </div>



                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSaving || !hasChanges}
                        className="flex-[2] h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale whitespace-nowrap"
                    >
                        {isSaving ? (
                            <RotateCcw size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        <span>บันทึกการปรับสต็อก</span>
                    </button>
                </div>
            </div>
        </DialogFormLayout>

        <WarehouseSearchModal
            isOpen={isWarehouseSearchOpen}
            onClose={() => setIsWarehouseSearchOpen(false)}
            onSelect={(wh: WarehouseListItem) => {
                setSelectedWarehouse({ id: Number(wh.warehouse_id), name: wh.warehouse_name });
                setSelectedLocation(null); // Reset location when warehouse changes
                setIsWarehouseSearchOpen(false);
            }}
            warehouses={warehouses}
            isLoading={isLoadingWarehouses}
        />

        <LocationSearchModal
            isOpen={isLocationSearchOpen}
            onClose={() => setIsLocationSearchOpen(false)}
            warehouseId={selectedWarehouse?.id ?? null}
            onSelect={(loc: Location) => {
                setSelectedLocation({ id: Number(loc.location_id), name: loc.name_th });
                setIsLocationSearchOpen(false);
            }}
            locations={locations}
            isLoading={isLoadingLocations}
        />
        </>
    );
};
