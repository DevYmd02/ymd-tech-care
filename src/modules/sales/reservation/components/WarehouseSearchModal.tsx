import React, { useState, useMemo } from 'react';
import { DialogFormLayout } from '@ui';
import { Search, Warehouse } from 'lucide-react';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';

interface WarehouseSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: WarehouseListItem) => void;
    warehouses: WarehouseListItem[];
    isLoading?: boolean;
}

export const WarehouseSearchModal: React.FC<WarehouseSearchModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    warehouses,
    isLoading = false 
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return warehouses;
        
        const lowerSearch = searchTerm.toLowerCase();
        return warehouses.filter(wh => 
            (wh.warehouse_name || '').toLowerCase().includes(lowerSearch) || 
            (wh.warehouse_code || '').toLowerCase().includes(lowerSearch) ||
            String(wh.warehouse_id).includes(searchTerm)
        );
    }, [warehouses, searchTerm]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกคลัง (Select Warehouse)"
            titleIcon={
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Warehouse size={24} />
                </div>
            }
            width="max-w-3xl"
            headerColor="bg-purple-600"
        >
            <div className="p-1">
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">ค้นหาคลัง</label>
                    <div className="relative group">
                        <input 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="ระบุชื่อ หรือรหัสคลัง..." 
                            className="w-full h-11 px-4 pl-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm" 
                            autoFocus 
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
                                <th className="px-4 py-4">รหัสคลัง</th>
                                <th className="px-4 py-4">ชื่อคลัง</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-4 py-4 text-center"><div className="h-7 w-14 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded shadow-sm" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded shadow-sm" /></td>
                                    </tr>
                                ))
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr 
                                        key={item.warehouse_id} 
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
                                        <td className="px-4 py-4 font-mono font-bold text-purple-700 dark:text-purple-400">{item.warehouse_code}</td>
                                        <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-medium">{item.warehouse_name}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-4 py-16 text-center text-gray-400 dark:text-gray-500 italic bg-gray-50/30 dark:bg-gray-800/10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <span>ไม่พบข้อมูลคลังที่คุณค้นหา</span>
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
