import React, { useState } from 'react';
import { DialogFormLayout } from '@ui';
import { Search } from 'lucide-react';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number | null;
  onSelect: (data: { location_id: number; location_name: string }) => void;
}

import { useQuery } from '@tanstack/react-query';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({ isOpen, onClose, warehouseId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch actual data using React Query with dependency
  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['warehouse-locations', warehouseId],
    queryFn: () => LocationService.getAll(warehouseId ? { warehouse_id: warehouseId } : undefined),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000
  });

  const items = locationsData?.items || [];

  // Case-Insensitive Filter (Rule 2 fix)
  const filteredItems = items.filter(loc => {
    // 🚩 Client-side filter safeguard if backend does not filter by warehouse_id
    if (warehouseId && Number(loc.warehouse_id) !== Number(warehouseId)) {
      return false;
    }

    const search = searchTerm.toLowerCase();
    const name = (loc.name_th || '').toLowerCase();
    const code = (loc.code || '').toLowerCase();
    const idStr = String(loc.location_id);

    return name.includes(search) || code.includes(search) || idStr.includes(search);
  });

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="เลือกที่เก็บ (Select Location)"
      titleIcon={<span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">🏢</span>}
      width="max-w-3xl"
    >
      <div className="p-1">
        <div className="mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ค้นหาที่เก็บ (แสดงเฉพาะที่อยู่ในคลัง {warehouseId || 'ทั้งหมด'})</label>
          <div className="relative">
            <input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="ค้นหาระบุชื่อ หรือรหัสที่เก็บ..." 
              className="w-full h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 pr-10" 
              autoFocus={isOpen}
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
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">รหัสที่เก็บ</th>
                <th className="px-3 py-3 text-left font-medium whitespace-nowrap">ชื่อที่เก็บ</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    กำลังโหลดข้อมูลสถานที่...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.location_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <button 
                         type="button"
                        onClick={() => {
                          onSelect({ location_id: item.location_id, location_name: item.code || String(item.location_id) });
                          onClose();
                        }} 
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition-colors shadow-sm"
                      >
                        เลือก
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-cyan-100">{item.code || '-'}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{item.name_th}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    {warehouseId 
                        ? 'ไม่พบข้อมูลที่เก็บในคลังนี้' 
                        : 'ไม่พบข้อมูลที่เก็บในระบบ'}
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
