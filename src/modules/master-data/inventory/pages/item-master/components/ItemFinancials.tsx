import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';

import type { TaxCodeListItem } from '@/modules/master-data/types/master-data-types';

/**
 * @interface ItemFinancialsProps
 * @description Strictly typed props for ItemFinancials
 */
interface ItemFinancialsProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
    taxCodes?: TaxCodeListItem[];
}

export const ItemFinancials: React.FC<ItemFinancialsProps> = ({
    formData,
    onChange,
    taxCodes = [],
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
                            value={formData.tax_code_id || ''} 
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                onChange('tax_code_id', id);
                                const selectedTax = taxCodes.find(t => t.tax_code_id === id);
                                if (selectedTax) {
                                    onChange('tax_rate', selectedTax.tax_rate);
                                }
                            }} 
                            className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {taxCodes.map(t => (
                                <option key={t.tax_code_id} value={t.tax_code_id}>{t.tax_code} - {t.tax_name}</option>
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
                        value={formData.standard_cost || ''} 
                        onChange={(e) => onChange('standard_cost', e.target.value === '' ? 0 : parseFloat(e.target.value))} 
                        onFocus={(e) => e.target.select()}
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">บาร์โค้ด (Barcode)</label>
                    <input 
                        type="text" 
                        value={formData.barcode_default || ''} 
                        onChange={(e) => onChange('barcode_default', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-purple-500 outline-none text-right"
                    />
                </div>
            </div>
        </div>
    );
};
