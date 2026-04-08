import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Tag, Calendar, Package } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { LotNoService } from '@/modules/master-data/inventory/services/inventory-master.service';
import type { LotNo } from '@/modules/master-data/inventory/types/inventory-master.types';
import { Plus } from 'lucide-react';
import { LotCreateModal } from './LotCreateModal';

interface LotSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lot: LotNo) => void;
    itemId?: string | number;
    vendorId?: string | number;
}

export function LotSearchModal({ isOpen, onClose, onSelect, itemId, vendorId }: LotSearchModalProps) {
    const [lotList, setLotList] = useState<LotNo[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // -- Fetch All Active Lots --
    const fetchLots = useCallback(() => {
        setIsLoading(true);
        // Include item_id filter if provided
        LotNoService.getAll({ 
            limit: 1000, 
            ...(itemId ? { item_id: itemId } : {}) 
        })
            .then(res => {
                const activeLots = res.items.filter(item => item.is_active);
                setLotList(activeLots);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [itemId]);

    useEffect(() => {
        if (isOpen) {
            fetchLots();
        } else {
            setSearchTerm('');
        }
    }, [isOpen, fetchLots]);

    // -- Filter Logic --
    const filteredList = useMemo(() => {
        if (!searchTerm) return lotList;
        const term = searchTerm.toLowerCase();
        return lotList.filter(lot => 
            lot.code.toLowerCase().includes(term) || 
            lot.name_th.toLowerCase().includes(term)
        );
    }, [lotList, searchTerm]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือก Lot No สินค้า (Select Lot Master)"
            titleIcon={<Tag size={20} />}
            width="max-w-4xl"
            headerColor="bg-violet-600 bg-gradient-to-r from-violet-700 to-violet-500"
        >
            <div className="p-6 flex flex-col max-h-[70vh] overflow-hidden bg-white dark:bg-[#1a1c23]">
                {/* Search Header */}
                <div className="mb-6 flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text"
                            placeholder="ค้นหาด้วยรหัส Lot หรือชื่อ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl transition-all outline-none text-gray-900 dark:text-white"
                            autoFocus
                        />
                        {isLoading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 shadow-md transition-all font-bold flex items-center gap-2 active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        สร้างล๊อตใหม่
                    </button>
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-gray-100 dark:border-gray-800 shadow-inner custom-scrollbar bg-white dark:bg-[#111318]">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">รหัส Lot (Lot Code)</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">ชื่อล๊อต (Name)</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 text-center">วันหมดอายุ (Expiry)</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredList.length > 0 ? (
                                filteredList.map(lot => (
                                    <tr 
                                        key={lot.id} 
                                        className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer"
                                        onClick={() => onSelect(lot)}
                                    >
                                        <td className="px-6 py-4 font-bold text-violet-600 dark:text-violet-400">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-violet-50 dark:bg-violet-900/30 rounded-md">
                                                    <Tag size={12} />
                                                </div>
                                                {lot.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                            {lot.name_th}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {lot.expiry_date ? (
                                                <div className="flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400">
                                                    <Calendar size={14} className="opacity-50" />
                                                    <span className="font-medium italic">{lot.expiry_date.split('T')[0]}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600 italic">- ไม่ระบุ -</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm active:scale-95 transition-all text-xs font-bold"
                                            >
                                                เลือก
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-32 text-center text-gray-400 bg-gray-50/30 dark:bg-gray-900/50">
                                        <Package size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">ไม่พบข้อมูล Lot ที่คุณค้นหา</p>
                                        {searchTerm && (
                                            <button 
                                                onClick={() => setSearchTerm('')}
                                                className="mt-4 text-violet-600 hover:underline text-sm font-bold"
                                            >
                                                ล้างการค้นหา
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/50 dark:bg-[#1a1c23] rounded-b-2xl">
                <button 
                    onClick={onClose} 
                    className="px-8 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 font-bold transition-all shadow-sm"
                >
                    ปิดหน้าต่าง
                </button>
            </div>
            {/* Quick Create Lot Modal */}
            {itemId && (
                <LotCreateModal 
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    itemId={itemId}
                    vendorId={vendorId}
                    onSuccess={(newLot) => {
                        // Select the newly created lot immediately
                        onSelect(newLot);
                    }}
                />
            )}
        </DialogFormLayout>
    );
}
