import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';
import { 
    ITEM_TYPES, 
    ITEM_CATEGORIES, 
    ITEM_GROUPS, 
    ITEM_BRANDS, 
    ITEM_PATTERNS, 
    ITEM_DESIGNS, 
    ITEM_GRADES, 
    ITEM_MODELS, 
    ITEM_SIZES, 
    ITEM_COLORS,
    getItemName 
} from '@/modules/inventory/constants/itemConstants';

/**
 * @interface ItemAttributesProps
 * @description Strictly typed props for ItemAttributes
 */
interface ItemAttributesProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
}

export const ItemAttributes: React.FC<ItemAttributesProps> = ({
    formData,
    onChange
}) => {
    return (
        <div className="lg:col-span-4 space-y-2">
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                Attributes (คุณสมบัติ)
            </h3>
            
            <div className="space-y-2">
                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ประเภทสินค้า (Item Type)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.item_type_code} 
                            onChange={(e) => onChange('item_type_code', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_TYPES.map(t => (
                                <option key={t.id} value={t.code}>{t.code}</option>
                            ))}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.item_type_code, ITEM_TYPES, 'code', 'name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">หมวดสินค้า</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.category_id} 
                            onChange={(e) => onChange('category_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.code}</option>
                            ))}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.category_id, ITEM_CATEGORIES)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">กลุ่มสินค้า (Good Group)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_class_id} 
                            onChange={(e) => onChange('good_class_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_GROUPS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_class_id, ITEM_GROUPS)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ยี่ห้อสินค้า (Brand)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_brand_id} 
                            onChange={(e) => onChange('good_brand_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_BRANDS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_brand_id, ITEM_BRANDS)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รูปแบบ (Pattern)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_pattern_id} 
                            onChange={(e) => onChange('good_pattern_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_PATTERNS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_pattern_id, ITEM_PATTERNS)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">การออกแบบ (Design)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_design_id} 
                            onChange={(e) => onChange('good_design_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_DESIGNS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_design_id, ITEM_DESIGNS)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">เกรด (Grade)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_grade_id || ''} 
                            onChange={(e) => onChange('good_grade_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_GRADES.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_grade_id || '', ITEM_GRADES)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รุ่น (Model)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_model_id || ''} 
                            onChange={(e) => onChange('good_model_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_MODELS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_model_id || '', ITEM_MODELS)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ขนาด (Size)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_size_id} 
                            onChange={(e) => onChange('good_size_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_SIZES.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_size_id, ITEM_SIZES)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">สี (Color)</label>
                    <div className="flex gap-2">
                        <select 
                            value={formData.good_color_id || ''} 
                            onChange={(e) => onChange('good_color_id', e.target.value)} 
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {ITEM_COLORS.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
                        </select>
                        <input 
                            type="text" 
                            readOnly 
                            value={getItemName(formData.good_color_id || '', ITEM_COLORS)}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
