import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';
import { 
    ITEM_UOMS, 
    ITEM_PRODUCT_SUBTYPES, 
    ITEM_NATURES, 
    ITEM_COSTING_METHODS, 
    ITEM_COMMISSIONS 
} from '@/modules/inventory/constants/itemConstants';

/**
 * @interface ItemStockDetailsProps
 * @description Strictly typed props for ItemStockDetails
 */
interface ItemStockDetailsProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
    errors: Partial<Record<keyof ItemFormData, string>>;
}

export const ItemStockDetails: React.FC<ItemStockDetailsProps> = ({
    formData,
    onChange,
    errors
}) => {
    return (
        <div className="lg:col-span-4 space-y-2">
            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                Stock & Costing
            </h3>
            
            <div className="space-y-2">
                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">
                        หน่วยนับหลัก (Main UOM) *
                    </label>
                    <select 
                        value={formData.base_uom_id} 
                        onChange={(e) => onChange('base_uom_id', e.target.value)} 
                        className={`w-full h-8 bg-white dark:bg-gray-700 border ${
                            errors.base_uom_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none`}
                    >
                        <option value="">-- เลือก --</option>
                        {ITEM_UOMS.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รายการกลุ่มสินค้า (Product Subtype)</label>
                    <select 
                        value={formData.product_subtype_id || ''} 
                        onChange={(e) => onChange('product_subtype_id', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">-- เลือก --</option>
                        {ITEM_PRODUCT_SUBTYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ลักษณะสินค้า (Nature)</label>
                    <select 
                        value={formData.nature_id || ''} 
                        onChange={(e) => onChange('nature_id', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">-- เลือก --</option>
                        {ITEM_NATURES.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">วิธีการคำนวณต้นทุน (Costing Method)</label>
                    <select 
                        value={formData.costing_method || ''} 
                        onChange={(e) => onChange('costing_method', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">-- เลือก --</option>
                        {ITEM_COSTING_METHODS.map(m => (
                            <option key={m.id} value={m.id}>{m.id}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ค่าคอมมิชชั่น (Commission)</label>
                    <select 
                        value={formData.commission_type || ''} 
                        onChange={(e) => onChange('commission_type', e.target.value)} 
                        className="w-full h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                        <option value="">-- เลือก --</option>
                        {ITEM_COMMISSIONS.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
