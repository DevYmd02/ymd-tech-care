import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectProduct: (product: ItemListItem) => void;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  selectProduct,
}) => {
  const { watch } = useFormContext();
  const preferredVendorId = watch('vendor_id'); // Corrected field name based on usePOForm.ts

  // ── Local State ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllItems, setShowAllItems] = useState(false);

  // 1. 🚩 Reset State on Close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setShowAllItems(false);
    }
  }, [isOpen]);

  // 2. 🚩 Debounced Search
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 3. 🚩 Real API Integration
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['master-items', debouncedSearch, showAllItems ? undefined : preferredVendorId],
    queryFn: () => MasterDataService.getItems(debouncedSearch, showAllItems ? undefined : preferredVendorId),
    enabled: isOpen,
  });

  // 4. 🚩 Strict onSelect Payload
  const handleSelect = (item: ItemListItem) => {
    selectProduct({
      ...item,
      item_id: Number(item.item_id),
      uom_id: Number(item.uom_id || item.unit_id),
      standard_cost: Number(item.standard_cost || 0),
    });
  };

  return (
    <DialogFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="ค้นหาสินค้า"
      titleIcon={<span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">🔍</span>}
      width="max-w-4xl"
    >
        <div className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสสินค้าหรือชื่อสินค้า</label>
              <div className="relative">
                <input 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="รหัสสินค้าหรือชื่อสินค้า" 
                  className="w-full h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 pr-10" 
                  autoFocus 
                />
                {isLoading && (
                  <div className="absolute right-3 top-2.5">
                    <span className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin block"></span>
                  </div>
                )}
              </div>
            </div>
            
            {preferredVendorId && (
              <div className="flex items-center gap-2 h-10 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full transition-all hover:bg-white dark:hover:bg-gray-700">
                <input
                  id="show-all-toggle"
                  type="checkbox"
                  checked={showAllItems}
                  onChange={(e) => setShowAllItems(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="show-all-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  แสดงสินค้าทั้งหมด
                </label>
              </div>
            )}
          </div>
          
          {preferredVendorId && (
            <div className={`mt-2 px-3 py-1 text-xs rounded-md inline-block transition-colors ${showAllItems ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'}`}>
              {showAllItems ? (
                <span>⚠️ กำลังแสดงสินค้าทั้งหมด (ไม่กรองตาม Vendor)</span>
              ) : (
                <span>💡 กำลังแสดงสินค้าเฉพาะของ Vendor นี้</span>
              )}
            </div>
          )}

          <div className="mt-6 max-h-[450px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
               <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-gray-600 dark:text-gray-300">
                      <th className="px-3 py-3 text-center font-medium w-20 whitespace-nowrap">เลือก</th>
                      <th className="px-3 py-3 text-left font-medium whitespace-nowrap">รหัสสินค้า</th>
                      <th className="px-3 py-3 text-left font-medium whitespace-nowrap">ชื่อสินค้า</th>
                      <th className="px-3 py-3 text-left font-medium whitespace-nowrap">รายละเอียด</th>
                      <th className="px-3 py-3 text-center font-medium whitespace-nowrap">คลัง</th>
                      <th className="px-3 py-3 text-center font-medium whitespace-nowrap">ที่เก็บ</th>
                      <th className="px-3 py-3 text-center font-medium whitespace-nowrap">หน่วยนับ</th>
                      <th className="px-3 py-3 text-right font-medium whitespace-nowrap">จำนวนคงเหลือ</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                  {isLoading ? (
                      <tr>
                          <td colSpan={8} className="px-3 py-12 text-center text-gray-500 dark:text-gray-400">
                               <div className="flex flex-col items-center gap-2">
                                   <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                                   <span>กำลังดึงข้อมูลสินค้า...</span>
                               </div>
                          </td>
                      </tr>
                  ) : products.length > 0 ? (
                      products.map((p) => (
                          <tr key={p.item_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors">
                          <td className="px-3 py-3 text-center">
                              <button onClick={() => handleSelect(p)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition-colors shadow-sm font-medium">เลือก</button>
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900 dark:text-cyan-100">{p.item_code}</td>
                          <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{p.item_name}</td>
                          <td className="px-3 py-3 text-gray-500 dark:text-gray-400 text-xs">{p.description || '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.warehouse_code || p.warehouse || '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.location || '-'}</td>
                          <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.uom_name || p.unit_name || '-'}</td>
                          <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                              {p.stock_qty?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}
                          </td>
                          </tr>
                      ))
                  ) : (
                      <tr>
                          <td colSpan={8} className="px-3 py-12 text-center text-gray-500 dark:text-gray-400">
                              <div className="flex flex-col items-center gap-1">
                                  <span className="text-lg">📦</span>
                                  <span>ไม่พบสินค้าที่ค้นหา</span>
                                  {preferredVendorId && !showAllItems && (
                                      <span className="text-[10px] text-gray-400">(กำลังกรองตาม Vendor ID: {preferredVendorId})</span>
                                  )}
                              </div>
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
