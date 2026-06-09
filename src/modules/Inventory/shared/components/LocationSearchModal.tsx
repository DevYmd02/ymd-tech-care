import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { LocationService } from '@master-data/inventory/services/inventory-master.service';
import type { Location } from '@master-data/inventory/types/inventory-master.types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';

/**
 * @file LocationSearchModal.tsx
 * @description Localized Search Modal for selecting Locations in Inventory module.
 * @pattern ตามสไตล์ของ Sales Module ระดับ Premium
 */

export interface LocationSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: Location) => void;
    warehouseId?: number | string;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    warehouseId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Reset showAll when modal opens or warehouseId changes
    useEffect(() => {
        if (isOpen) {
            setShowAll(false);
        }
    }, [isOpen, warehouseId]);

    // ดึงข้อมูลที่เก็บสินค้าผ่าน LocationService
    const { data: response, isLoading } = useQuery({
        queryKey: ['inventory-locations-lookup', debouncedSearch, warehouseId, showAll],
        queryFn: () => {
            const whId = warehouseId && warehouseId !== '' && !isNaN(Number(warehouseId)) 
                ? Number(warehouseId) 
                : undefined;
            return LocationService.getAll({ 
                q: debouncedSearch, 
                warehouse_id: showAll ? undefined : whId,
                limit: 50 
            });
        },
        enabled: isOpen,
        staleTime: 1000 * 60 * 10,
    });

    const locations = useMemo(() => {
        const items = response?.items || [];
        if (warehouseId && !showAll) {
            return items.filter(loc => Number(loc.warehouse_id) === Number(warehouseId));
        }
        return items;
    }, [response, warehouseId, showAll]);

    const handleSelect = (location: Location) => {
        onSelect(location);
        onClose();
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกที่เก็บสินค้า - Select Location"
            headerColor="bg-blue-600"
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded-lg shadow-sm">
                    <MapPin size={20} className="text-white" />
                </div>
            }
            width="max-w-[1000px]"
        >
            <div className="flex flex-col h-[60vh]">
                {/* 🔍 Search Bar & Filter */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหารหัสที่เก็บ, ชื่อที่เก็บ..."
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium"
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

                    {/* Toggle switch for showing all locations */}
                    {warehouseId && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={showAll}
                                    onChange={(e) => setShowAll(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                <span className="ms-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 select-none">
                                    แสดงที่เก็บทั้งหมด
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* 📊 Content Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                            <p className="text-gray-500 font-medium font-outfit">กำลังโหลดข้อมูลที่เก็บสินค้า...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">รหัสที่เก็บ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">ชื่อที่เก็บสินค้า</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {locations.length > 0 ? (
                                    locations.map((location) => (
                                        <tr 
                                            key={location.location_id} 
                                            className="transition-colors group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                            onClick={() => handleSelect(location)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform inline-block uppercase">
                                                    {location.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {location.name_th}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(location);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                >
                                                    เลือก
                                                    <Check size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <MapPin size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold font-outfit">ไม่พบข้อมูลที่เก็บสินค้า</p>
                                                <p className="text-sm opacity-80 font-outfit">
                                                    {warehouseId ? 'ลองเปลี่ยนคำค้นหาอีกครั้ง' : 'กรุณาเลือกคลังสินค้าก่อนค้นหา'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* 📝 Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium font-outfit">
                        แสดงข้อมูลที่เก็บสินค้า <span className="font-bold text-blue-600">{locations.length}</span> รายการ
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95 font-outfit"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
