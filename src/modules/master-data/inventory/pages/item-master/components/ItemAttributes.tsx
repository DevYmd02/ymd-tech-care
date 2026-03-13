import React from 'react';
import type { ItemFormData, ItemFormChangeHandler } from '../hooks/useItemForm';
import {
    getItemName
} from '@/modules/master-data/inventory/constants/itemConstants';

import type { ProductCategoryListItem } from '@/modules/master-data/types/master-data-types';
import type {
    ItemTypeListItem,
    ItemGroupListItem,
    ItemBrandListItem,
    ItemPatternListItem,
    ItemDesignListItem,
    ItemGradeListItem,
    ItemClassListItem,
    ItemSizeListItem,
    ItemColorListItem,
} from '@/modules/master-data/inventory/types/product-types';

/**
 * @interface ItemAttributesProps
 * @description Strictly typed props for ItemAttributes
 */
interface ItemAttributesProps {
    formData: ItemFormData;
    onChange: ItemFormChangeHandler;
    itemTypes?: ItemTypeListItem[];
    categories?: ProductCategoryListItem[];
    itemGroups?: ItemGroupListItem[];
    itemBrands?: ItemBrandListItem[];
    itemPatterns?: ItemPatternListItem[];
    itemDesigns?: ItemDesignListItem[];
    itemGrades?: ItemGradeListItem[];
    itemClasses?: ItemClassListItem[];
    itemSizes?: ItemSizeListItem[];
    itemColors?: ItemColorListItem[];
}

export const ItemAttributes: React.FC<ItemAttributesProps> = ({
    formData,
    onChange,
    categories = [],
    itemTypes = [],
    itemGroups = [],
    itemBrands = [],
    itemPatterns = [],
    itemDesigns = [],
    itemGrades = [],
    itemClasses = [],
    itemSizes = [],
    itemColors = []
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
                            onChange={(e) => {
                                const code = e.target.value;
                                const selected = itemTypes.find(t => t.item_type_code === code);
                                onChange('item_type_code', code);
                                onChange('item_type_id' as any, selected ? selected.item_type_id ?? 0 : 0);
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemTypes.map(t => (
                                <option key={t.item_type_id} value={t.item_type_code}>{t.item_type_code}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_type_code, itemTypes, 'item_type_code', 'item_type_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">หมวดสินค้า</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.category_id}
                            onChange={(e) => onChange('category_id', Number(e.target.value))}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {categories.map(c => (
                                <option key={c.category_id} value={c.category_id}>{c.category_code}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.category_id, categories, 'category_id', 'category_name')}
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
                            {itemGroups.map(o => (<option key={o.item_group_id} value={o.item_group_id}>{o.item_group_code}</option>))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_class_id, itemGroups, 'item_group_id', 'item_group_name')}
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
                            {itemBrands.map(o => (<option key={o.item_brand_id} value={o.item_brand_id}>{o.item_brand_name}</option>))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_brand_id, itemBrands, 'item_brand_id', 'item_brand_name')}
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
                            {itemPatterns.map(o => <option key={o.item_pattern_id} value={o.item_pattern_id}>{o.item_pattern_name}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_pattern_id, itemPatterns, 'item_pattern_id', 'item_pattern_name')}
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
                            {itemDesigns.map(o => (<option key={o.item_design_id} value={o.item_design_id}>{o.item_design_name}</option>))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_design_id, itemDesigns, 'item_design_id', 'item_design_name')}
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
                            {itemGrades.map(o => <option key={o.item_grade_id} value={o.item_grade_id}>{o.item_grade_name}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_grade_id, itemGrades || [], 'item_grade_id', 'item_grade_name')}
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
                            {itemClasses.map(o => <option key={o.item_class_id} value={o.item_class_id}>{o.item_class_name}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_model_id || '', itemClasses || [], 'item_class_id', 'item_class_name')}
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
                            {itemSizes.map(o => <option key={o.item_size_id} value={o.item_size_id}>{o.item_size_name}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_size_id, itemSizes || [], 'item_size_id', 'item_size_name')}
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
                            {itemColors.map(o => <option key={o.item_color_id} value={o.item_color_id}>{o.item_color_name}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.good_color_id || '', itemColors || [], 'item_color_id', 'item_color_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
