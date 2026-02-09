import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';
import { ITEM_TAX_CODES } from '@/modules/master-data/inventory/constants/itemConstants';

/**
 * @interface ItemFinancialsProps
 * @description Strictly typed props for ItemFinancials
 */
interface ItemFinancialsProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
}

export const ItemFinancials: React.FC<ItemFinancialsProps> = ({
    formData,
    onChange
}) => {
    return (
        <div className="lg:col-span-4 space-y-2">
            <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                Financial Details
            </h3>
            
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ประเภทภาษี (Tax Type)</label>
                        <select 
                            value={formData.default_tax_code} 
                            onChange={(e) => onChange('default_tax_code', e.target.value)} 
                            className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none"
                        >
                            {ITEM_TAX_CODES.map(t => (
                                <option key={t.id} value={t.code}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">อัตราภาษี (%)</label>
                        <input 
                            type="number" 
                            value={formData.tax_rate ?? 7} 
                            onChange={(e) => onChange('tax_rate', Number(e.target.value))} 
                            className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">กำหนดจำนวน (Amount)</label>
                    <input 
                        type="number" 
                        value={formData.std_amount || ''} 
                        onChange={(e) => onChange('std_amount', e.target.value === '' ? 0 : parseFloat(e.target.value))} 
                        onFocus={(e) => e.target.select()}
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ส่วนลดสินค้า (Discount)</label>
                    <input 
                        type="text" 
                        value={formData.discount_amount || ''} 
                        onChange={(e) => onChange('discount_amount', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right"
                    />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input 
                        type="checkbox" 
                        id="has_barcode"
                        checked={formData.has_barcode || false} 
                        onChange={(e) => onChange('has_barcode', e.target.checked)} 
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    />
                    <label htmlFor="has_barcode" className="text-xs font-medium text-gray-900 dark:text-gray-300 select-none cursor-pointer">
                        ใช้งานระบบบาร์โค้ด (Enable Barcode System)
                    </label>
                </div>
            </div>
        </div>
    );
};

