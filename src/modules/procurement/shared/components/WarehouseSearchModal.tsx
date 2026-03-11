import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DialogFormLayout } from '@ui';
import { Search } from 'lucide-react';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import type { WarehouseListItem } from '@/modules/master-data/inventory/types/warehouse-types';

interface WarehouseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: WarehouseListItem) => void;
}

export const WarehouseSearchModal: React.FC<WarehouseSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => WarehouseService.getAll(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // Caching Master Data for 5 mins
  });

  const filteredItems = useMemo(() => {
    const items = data?.items || [];
    if (!searchTerm) return items;
    
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(wh => 
      wh.warehouse_name.toLowerCase().includes(lowerSearch) || 
      wh.warehouse_code.toLowerCase().includes(lowerSearch) ||
      String(wh.warehouse_id).includes(searchTerm)
    );
  }, [data, searchTerm]);

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="เลือกคลัง (Select Warehouse)"
      titleIcon={<span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">🏢</span>}
      width="max-w-3xl"
    >
      <div className="p-1">
        <div className="mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ค้นหาคลัง</label>
          <div className="relative">
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="ค้นหาระบุชื่อ หรือรหัสคลัง..." 
              className="w-full h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 pr-10" 
              autoFocus 
            />
            <div className="absolute right-3 top-2.5 text-gray-400">
               <Search size={20} />
            </div>
          </div>
        </div>

        <div className="mt-4 max-h-[450px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-gray-600 dark:text-gray-300">
                <th className="px-3 py-3 text-center font-medium w-20 whitespace-nowrap">เลือก</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">รหัสคลัง</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">ชื่อคลัง</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 py-3 text-center"><div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto" /></td>
                    <td className="px-3 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                    <td className="px-3 py-3"><div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                  </tr>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.warehouse_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <button 
                        type="button"
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }} 
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition-colors shadow-sm"
                      >
                        เลือก
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-cyan-100">{item.warehouse_code}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.warehouse_name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบข้อมูลคลัง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DialogFormLayout>
  );
};
