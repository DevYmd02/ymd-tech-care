import React, { useState, useMemo, useEffect } from 'react';
import { DialogFormLayout } from '@ui';
import { Search, MapPin } from 'lucide-react';
import type { Location } from '@inventory/types/inventory-master.types';
import { ReservationInventoryService } from '../../services/reservation-inventory.service';

interface LocationStockItem extends Location {
    qty_on_hand?: string | number;
    qty_reserved?: string | number;
    qty_available?: string | number;
    location_name?: string;
    location_code?: string;
}

interface LocationSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    warehouseId: string | number | null;
    onSelect: (data: Location) => void;
    locations: Location[];
    isLoading?: boolean;
    itemId?: string | number | null;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({ 
    isOpen, 
    onClose, 
    warehouseId, 
    onSelect,
    locations: initialLocations,
    isLoading: initialLoading = false,
    itemId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [localLocations, setLocalLocations] = useState<LocationStockItem[]>([]);
    const [isLoading, setIsLoading] = useState(initialLoading);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            return;
        }

        const fetchStock = async () => {
            if (itemId && warehouseId) {
                setIsLoading(true);
                try {
                    const stockData = await ReservationInventoryService.getLocationStock(itemId, warehouseId);
                    if (stockData && stockData.length > 0) {
                        setLocalLocations(stockData as unknown as LocationStockItem[]);
                    } else {
                        setLocalLocations(initialLocations);
                    }
                } catch {
                    setLocalLocations(initialLocations);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setLocalLocations(initialLocations);
                setIsLoading(initialLoading);
            }
        };

        fetchStock();
    }, [isOpen, itemId, warehouseId, initialLocations, initialLoading]);

    const filteredItems = useMemo(() => {
        // First filter by warehouseId
        let items = localLocations;
        if (warehouseId) {
            items = localLocations.filter(loc => {
                // If warehouse_id is missing (from stock API), we assume it's correct for this context
                if (loc.warehouse_id === undefined || loc.warehouse_id === null) return true;
                return String(loc.warehouse_id) === String(warehouseId);
            });
        }

        if (!searchTerm) return items;
        
        const lowerSearch = searchTerm.toLowerCase();
        return items.filter(loc => 
            (loc.name_th || loc.location_name || '').toLowerCase().includes(lowerSearch) || 
            (loc.code || loc.location_code || '').toLowerCase().includes(lowerSearch) ||
            String(loc.location_id).includes(searchTerm)
        );
    }, [localLocations, warehouseId, searchTerm]);

    const formatNum = (val: string | number | null | undefined) => {
        const num = Number(val);
        return isNaN(num) ? '0.00' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกที่เก็บ (Select Location)"
            titleIcon={
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <MapPin size={24} />
                </div>
            }
            width="max-w-5xl"
            headerColor="bg-purple-600"
        >
            <div className="p-1">
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">ค้นหาที่เก็บ</label>
                        {warehouseId && (
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">
                                กรองเฉพาะคลัง: {warehouseId}
                            </span>
                        )}
                    </div>
                    <div className="relative group">
                        <input 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="ระบุชื่อ หรือรหัสที่เก็บ..." 
                            className="w-full h-11 px-4 pl-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm" 
                            autoFocus={isOpen}
                        />
                        <div className="absolute left-4 top-3 text-gray-400 group-focus-within:text-purple-500 transition-colors">
                             <Search size={20} />
                        </div>
                    </div>
                </div>

                <div className="mt-2 max-h-[450px] overflow-auto border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                            <tr className="text-gray-500 dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider">
                                <th className="px-4 py-4 text-center w-20">เลือก</th>
                                <th className="px-4 py-4">ชื่อที่เก็บ</th>
                                {itemId && (
                                    <>
                                        <th className="px-4 py-4 text-right">คงเหลือ</th>
                                        <th className="px-4 py-4 text-right">จอง</th>
                                        <th className="px-4 py-4 text-right">พร้อมใช้</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-4 py-4 text-center"><div className="h-7 w-14 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded shadow-sm" /></td>
                                        {itemId && (
                                            <>
                                                <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded shadow-sm ml-auto" /></td>
                                                <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded shadow-sm ml-auto" /></td>
                                                <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 dark:bg-gray-800 rounded shadow-sm ml-auto" /></td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr 
                                        key={item.location_id} 
                                        className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer group"
                                        onClick={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                type="button"
                                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-purple-500/20 active:scale-95"
                                            >
                                                เลือก
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-medium">{item.name_th || item.location_name}</td>
                                        {itemId && (
                                            <>
                                                <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">{formatNum(item.qty_on_hand)}</td>
                                                <td className="px-4 py-4 text-right text-orange-600 dark:text-orange-400">{formatNum(item.qty_reserved)}</td>
                                                <td className="px-4 py-4 text-right font-bold text-green-600 dark:text-green-400">{formatNum(item.qty_available)}</td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={itemId ? 5 : 2} className="px-4 py-16 text-center text-gray-400 dark:text-gray-500 italic bg-gray-50/30 dark:bg-gray-800/10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <span>{warehouseId ? 'ไม่พบข้อมูลที่เก็บในคลังที่เลือก' : 'ไม่พบข้อมูลที่เก็บที่คุณค้นหา'}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-end">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
};
