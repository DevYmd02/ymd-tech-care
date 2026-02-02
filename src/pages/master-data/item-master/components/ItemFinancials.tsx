import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';
import { ITEM_TAX_CODES } from '@/constants';

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
                        value={formData.std_amount ?? 0} 
                        onChange={(e) => onChange('std_amount', Number(e.target.value))} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
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

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">Barcode (หลัก)</label>
                    <input 
                        type="text" 
                        value={formData.barcode || ''} 
                        onChange={(e) => onChange('barcode', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none"
                        placeholder="EAN/UPC"
                    />
                </div>
            </div>
        </div>
    );
};

