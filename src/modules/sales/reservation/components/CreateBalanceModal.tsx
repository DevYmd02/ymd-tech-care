import React, { useState } from 'react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { PackagePlus, Save, AlertCircle, RotateCcw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ItemLotService } from '@inventory/services/item-lot.service';
import { MasterDataService } from '@master-data/services/master-data.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { ReservationInventoryService } from '../services/reservation-inventory.service';

import type { ItemLot } from '@inventory/types/item-lot-types';

interface CreateBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: number;
    defaultLotId?: number;
    onCreated?: () => void;
}

export const CreateBalanceModal: React.FC<CreateBalanceModalProps> = ({
    isOpen,
    onClose,
    itemId,
    defaultLotId,
    onCreated
}) => {
    const queryClient = useQueryClient();
    
    // Form state
    const [lotId, setLotId] = useState<number | ''>(defaultLotId || '');
    const [warehouseId, setWarehouseId] = useState<number | ''>('');
    const [locationId, setLocationId] = useState<number | ''>('');
    const [qty, setQty] = useState<number | ''>('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch master data
    const { data: lotsResponse, isLoading: isLoadingLots } = useQuery({
        queryKey: ['item-lots', itemId],
        queryFn: () => ItemLotService.getList(itemId),
        enabled: isOpen && !!itemId
    });
    const lots: ItemLot[] = Array.isArray(lotsResponse) ? lotsResponse : [];

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses-lookup'],
        queryFn: () => MasterDataService.getWarehouses(),
        enabled: isOpen
    });

    const { data: locationsResponse } = useQuery({
        queryKey: ['locations-lookup'],
        queryFn: () => LocationService.getAll({ limit: 5000 }),
        enabled: isOpen
    });
    const locations = locationsResponse?.items || [];

    // Filter locations by selected warehouse
    const filteredLocations = warehouseId 
        ? locations.filter(loc => String(loc.warehouse_id) === String(warehouseId))
        : locations;

    const handleSubmit = async () => {
        if (!lotId || !warehouseId || !locationId || qty === '') {
            setError('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        if (Number(qty) <= 0) {
            setError('จำนวนสต็อกต้องมากกว่า 0');
            return;
        }

        setError(null);
        setIsSaving(true);
        try {
            await ReservationInventoryService.createBalance({
                lot_id: Number(lotId),
                item_id: itemId,
                warehouse_id: Number(warehouseId),
                location_id: Number(locationId),
                qty_on_hand: Number(qty)
            });

            // Refresh the balances in the main search modal
            await queryClient.invalidateQueries({ queryKey: ['lot-lookup-reservation'] });
            onCreated?.();
            onClose();
        } catch (err) {
            const errorObj = err as Error & { response?: { data?: { message?: string } } };
            setError(errorObj.response?.data?.message || errorObj.message || 'เกิดข้อผิดพลาดในการสร้างสต็อก');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="นำเข้าสต็อก (Add Balance)"
            titleIcon={
                <div className="bg-amber-500 p-1.5 rounded-lg shadow-sm">
                    <PackagePlus size={20} className="text-white" />
                </div>
            }
            width="max-w-md"
            headerColor="bg-amber-500"
        >
            <div className="p-6 space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Select Lot */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลือกล็อตสินค้า (Lot)</label>
                        <select
                            value={lotId}
                            onChange={(e) => setLotId(Number(e.target.value) || '')}
                            className="w-full h-11 px-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
                            disabled={isLoadingLots}
                        >
                            <option value="">-- เลือกล็อต --</option>
                            {lots.map((lot: ItemLot) => {
                                const r = (lot as unknown) as Record<string, unknown>;
                                const lotNo = lot.lot_no || r['code'] as string || r['lot_no_code'] as string || '';
                                return (
                                    <option key={lot.lot_id} value={lot.lot_id}>
                                        {lotNo}
                                    </option>
                                );
                            })}
                        </select>
                        {lots.length === 0 && !isLoadingLots && (
                            <p className="text-xs text-amber-600 mt-1">ยังไม่มีล็อตในระบบ กรุณาสร้าง Lot ใหม่ก่อน</p>
                        )}
                    </div>

                    {/* Select Warehouse */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลือกคลังสินค้า</label>
                        <select
                            value={warehouseId}
                            onChange={(e) => {
                                setWarehouseId(Number(e.target.value) || '');
                                setLocationId(''); // Reset location when warehouse changes
                            }}
                            className="w-full h-11 px-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
                        >
                            <option value="">-- เลือกคลังสินค้า --</option>
                            {warehouses.map(wh => (
                                <option key={wh.warehouse_id} value={wh.warehouse_id}>
                                    {wh.warehouse_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Select Location */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลือกที่เก็บ</label>
                        <select
                            value={locationId}
                            onChange={(e) => setLocationId(Number(e.target.value) || '')}
                            className="w-full h-11 px-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
                            disabled={!warehouseId}
                        >
                            <option value="">-- เลือกที่เก็บ --</option>
                            {filteredLocations.map(loc => (
                                <option key={loc.location_id} value={loc.location_id}>
                                    {loc.name_th}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Input Qty */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">จำนวนที่นำเข้า</label>
                        <input
                            type="number"
                            value={qty}
                            onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            placeholder="ระบุจำนวน..."
                            className="w-full h-11 px-3 text-lg font-bold text-amber-600 dark:text-amber-400 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 whitespace-nowrap"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap"
                >
                    {isSaving ? (
                        <>
                            <RotateCcw className="animate-spin" size={18} />
                            <span>กำลังบันทึก...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>บันทึกนำเข้าสต็อก</span>
                        </>
                    )}
                </button>
            </div>
        </DialogFormLayout>
    );
};
