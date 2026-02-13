import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchingProducts: boolean;
  products: ItemListItem[];
  selectProduct: (product: ItemListItem) => void;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  isSearchingProducts,
  products,
  selectProduct,
}) => {
  const { watch } = useFormContext();
  const preferredVendorId = watch('preferred_vendor_id');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ค้นหาสินค้า</h2>
              <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1">กรอกข้อมูลเพื่อค้นหาสินค้าในระบบ</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">×</button>
          </div>

          <div className="mt-4 flex gap-4 items-end">
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
                {isSearchingProducts && (
                  <div className="absolute right-3 top-2.5">
                    <span className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin block"></span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {preferredVendorId && (
            <div className="mt-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md inline-block">
              💡 กำลังแสดงสินค้าเฉพาะของ Vendor นี้
            </div>
          )}

        </div>
        
        <div className="max-h-[450px] overflow-auto">
             <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-gray-600 dark:text-gray-300">
                    <th className="px-3 py-3 text-center font-medium w-20">เลือก</th>
                    <th className="px-3 py-3 text-left font-medium">รหัสสินค้า</th>
                    <th className="px-3 py-3 text-left font-medium">ชื่อสินค้า</th>
                    <th className="px-3 py-3 text-left font-medium">รายละเอียด</th>
                    <th className="px-3 py-3 text-center font-medium">คลัง</th>
                    <th className="px-3 py-3 text-center font-medium">ที่เก็บ</th>
                    <th className="px-3 py-3 text-center font-medium">หน่วยนับ</th>
                    <th className="px-3 py-3 text-right font-medium">ราคา/หน่วย</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                {isSearchingProducts ? (
                    <tr>
                        <td colSpan={8} className="px-3 py-12 text-center text-gray-500 dark:text-gray-400">
                            กำลังค้นหา...
                        </td>
                    </tr>
                ) : products.length > 0 ? (
                    products.map((p) => (
                        <tr key={p.item_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors">
                        <td className="px-3 py-3 text-center">
                            <button onClick={() => selectProduct(p)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition-colors shadow-sm">เลือก</button>
                        </td>
                        <td className="px-3 py-3 font-medium text-gray-900 dark:text-cyan-100">{p.item_code}</td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{p.item_name}</td>
                        <td className="px-3 py-3 text-gray-500 dark:text-gray-400 text-xs">{p.description}</td>
                        <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.warehouse}</td>
                        <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.location}</td>
                        <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.unit_name}</td>
                        <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{p.standard_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                            ไม่พบสินค้า {preferredVendorId ? 'สำหรับ Vendor นี้' : ''}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
