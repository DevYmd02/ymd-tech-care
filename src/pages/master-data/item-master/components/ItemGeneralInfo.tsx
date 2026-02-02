import React from 'react';
import { Search } from 'lucide-react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';

/**
 * @interface ItemGeneralInfoProps
 * @description Strictly typed props for ItemGeneralInfo
 */
interface ItemGeneralInfoProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
    onFind: () => void;
    editMode: boolean;
    errors: Partial<Record<keyof ItemFormData, string>>;
}

export const ItemGeneralInfo: React.FC<ItemGeneralInfoProps> = ({
    formData,
    onChange,
    onFind,
    editMode,
    errors
}) => {
    return (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Item Code */}
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">
                        รหัสสินค้า *
                    </label>
                    <div className="relative flex items-center">
                        <input 
                            type="text" 
                            value={formData.item_code} 
                            onChange={(e) => onChange('item_code', e.target.value)} 
                            readOnly={editMode}
                            className={`w-full h-8 bg-white dark:bg-gray-900 border ${
                                errors.item_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                                editMode ? 'pr-9 cursor-not-allowed opacity-90' : ''
                            }`}
                            placeholder="ITEM-001"
                        />
                        {editMode && (
                            <button 
                                type="button"
                                onClick={onFind} 
                                className="absolute right-0 top-0 bottom-0 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-r border border-blue-600 transition-colors flex items-center justify-center"
                                title="Find Item"
                            >
                                <Search size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Item Name TH */}
                <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">
                        ชื่อสินค้า (ไทย) *
                    </label>
                    <input 
                        type="text" 
                        value={formData.item_name} 
                        onChange={(e) => onChange('item_name', e.target.value)} 
                        className={`w-full h-8 bg-white dark:bg-gray-900 border ${
                            errors.item_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                        placeholder="ระบุชื่อสินค้าภาษาไทย"
                    />
                </div>

                {/* Item Name EN */}
                <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อสินค้า (Eng)</label>
                    <input 
                        type="text"
                        value={formData.item_name_en} 
                        onChange={(e) => onChange('item_name_en', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter Item Name in English"
                    />
                </div>

                {/* Row 2: Marketing Name & Billing Name */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อทางการตลาด (Marketing Name)</label>
                        <input 
                            type="text" 
                            value={formData.marketing_name} 
                            onChange={(e) => onChange('marketing_name', e.target.value)} 
                            className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Marketing Name"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-0.5">ชื่อในการออกบิล (Billing Name)</label>
                        <input 
                            type="text" 
                            value={formData.billing_name} 
                            onChange={(e) => onChange('billing_name', e.target.value)} 
                            className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Billing Name"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
