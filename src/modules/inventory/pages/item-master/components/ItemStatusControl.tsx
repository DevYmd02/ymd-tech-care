import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';

/**
 * @interface ItemStatusControlProps
 * @description Strictly typed props for ItemStatusControl
 */
interface ItemStatusControlProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
}

export const ItemStatusControl: React.FC<ItemStatusControlProps> = ({
    formData,
    onChange
}) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-2">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Status & Control
            </h4>
            <div className="flex flex-col gap-2 h-full">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={formData.is_buddy || false} 
                        onChange={(e) => onChange('is_buddy', e.target.checked)} 
                        className="w-4 h-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-colors" 
                    />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-200 group-hover:dark:text-white transition-colors">
                            Buddy (คู่ค้า)
                        </span>
                    </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={formData.is_on_hold || false} 
                        onChange={(e) => onChange('is_on_hold', e.target.checked)} 
                        className="w-4 h-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-colors" 
                    />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-200 group-hover:dark:text-white transition-colors">
                            On Hold (ระงับชั่วคราว)
                        </span>
                    </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={!formData.is_active} 
                        onChange={(e) => onChange('is_active', !e.target.checked)} 
                        className="w-4 h-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-colors" 
                    />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-200 group-hover:dark:text-white transition-colors">
                            Inactive (เลิกใช้งาน)
                        </span>
                    </div>
                </label>
            </div>
        </div>
    );
};
