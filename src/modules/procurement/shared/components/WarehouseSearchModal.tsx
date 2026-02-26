import React, { useState } from 'react';
import { DialogFormLayout } from '@ui';
import { Search } from 'lucide-react';

interface WarehouseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: { warehouse_id: string; warehouse_name: string }) => void;
}

import { MOCK_WAREHOUSES } from '@/modules/procurement/mocks/data/warehouseData';

export const WarehouseSearchModal: React.FC<WarehouseSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = MOCK_WAREHOUSES.filter(wh => 
    wh.warehouse_name.includes(searchTerm) || 
    wh.warehouse_id.includes(searchTerm)
  );

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
              {filteredItems.length > 0 ? (
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
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-cyan-100">{item.warehouse_id}</td>
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
