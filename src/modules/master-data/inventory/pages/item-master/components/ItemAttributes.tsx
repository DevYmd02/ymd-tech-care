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
                             value={formData.item_type_id || ''}
    onChange={(e) => {
        const id = Number(e.target.value);                                
        const selected = itemTypes.find(t => t.item_type_id === id);

        onChange('item_type_id' as any, selected ? selected.item_type_id : 0);
        onChange('item_type_name' as any, selected ? selected.item_type_name : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemTypes.map(t => (
                                <option key={t.item_type_id} value={t.item_type_id}>{t.item_type_code}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_type_id || 0, itemTypes, 'item_type_id', 'item_type_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">หมวดสินค้า</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_category_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = categories.find(c => c.category_id === id);
                                onChange('item_category_id' as any, id);
                                onChange('item_category_code' as any, selected ? selected.category_code : '');
                            }}
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
                            value={getItemName(formData.item_category_id || 0, categories, 'category_id', 'category_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">กลุ่มสินค้า (Good Group)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_group_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemGroups.find(g => g.item_group_id === id);
                                onChange('item_group_id' as any, id);
                                onChange('item_group_code' as any, selected ? selected.item_group_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemGroups.map(o => (<option key={o.item_group_id} value={o.item_group_id}>{o.item_group_code}</option>))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_group_id || 0, itemGroups, 'item_group_id', 'item_group_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ยี่ห้อสินค้า (Brand)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_brand_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemBrands.find(b => b.item_brand_id === id);
                                onChange('item_brand_id' as any, id);
                                onChange('item_brand_code' as any, selected ? selected.item_brand_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemBrands.map(o => (<option key={o.item_brand_id} value={o.item_brand_id}>{o.item_brand_code}</option>))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_brand_id || 0, itemBrands, 'item_brand_id', 'item_brand_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รูปแบบ (Pattern)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_pattern_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemPatterns.find(p => p.item_pattern_id === id);
                                onChange('item_pattern_id' as any, id);
                                onChange('item_pattern_code' as any, selected ? selected.item_pattern_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemPatterns.map(o => <option key={o.item_pattern_id} value={o.item_pattern_id}>{o.item_pattern_code}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_pattern_id || 0, itemPatterns, 'item_pattern_id', 'item_pattern_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">การออกแบบ (Design)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_design_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemDesigns.find(d => d.item_design_id === id);
                                onChange('item_design_id' as any, id);
                                onChange('item_design_code' as any, selected ? selected.item_design_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemDesigns.map(o => (<option key={o.item_design_id} value={o.item_design_id}>{o.item_design_code}</option>))}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_design_id || 0, itemDesigns, 'item_design_id', 'item_design_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">เกรด (Grade)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_grade_id || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemGrades.find(g => g.item_grade_id === id);
                                onChange('item_grade_id' as any, id);
                                onChange('item_grade_code' as any, selected ? selected.item_grade_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemGrades.map(o => <option key={o.item_grade_id} value={o.item_grade_id}>{o.item_grade_code}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_grade_id || 0, itemGrades || [], 'item_grade_id', 'item_grade_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">รุ่น (Model)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_class_id || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemClasses.find(c => c.item_class_id === id);
                                onChange('item_class_id' as any, id);
                                onChange('item_class_code' as any, selected ? selected.item_class_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemClasses.map(o => <option key={o.item_class_id} value={o.item_class_id}>{o.item_class_code}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_class_id || 0, itemClasses || [], 'item_class_id', 'item_class_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">ขนาด (Size)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_size_id}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemSizes.find(s => s.item_size_id === id);
                                onChange('item_size_id' as any, id);
                                onChange('item_size_code' as any, selected ? selected.item_size_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemSizes.map(o => <option key={o.item_size_id} value={o.item_size_id}>{o.item_size_code}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_size_id || 0, itemSizes || [], 'item_size_id', 'item_size_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-400 mb-0.5">สี (Color)</label>
                    <div className="flex gap-2">
                        <select
                            value={formData.item_color_id || ''}
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                const selected = itemColors.find(c => c.item_color_id === id);
                                onChange('item_color_id' as any, id);
                                onChange('item_color_code' as any, selected ? selected.item_color_code : '');
                            }}
                            className="w-[35%] h-8 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- เลือก --</option>
                            {itemColors.map(o => <option key={o.item_color_id} value={o.item_color_id}>{o.item_color_code}</option>)}
                        </select>
                        <input
                            type="text"
                            readOnly
                            value={getItemName(formData.item_color_id || 0, itemColors || [], 'item_color_id', 'item_color_name')}
                            className="w-[65%] h-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
