import React from 'react';
import { Tag, ChevronDown, ChevronUp, Database, Edit2, Trash2 } from 'lucide-react';
import type { ProductCategoryListItem } from '@/modules/master-data/types/master-data-types';

interface CategoryTabProps {
    data: ProductCategoryListItem[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    handleEdit: (id: string) => void;
    handleStatusToggle: (data: ProductCategoryListItem) => void;
    dbRelation: { dbTable: string; relations: string[]; fk: string };
}

export const CategoryTab: React.FC<CategoryTabProps> = ({
    data,
    expandedId,
    toggleExpand,
    handleEdit,
    handleStatusToggle,
    dbRelation
}) => {
    if (data.length === 0) {
        return <div className="text-center py-12 text-gray-500">ไม่พบข้อมูล {dbRelation.dbTable}</div>;
    }

    return (
        <div className="space-y-4">
            {data.map((category) => {
                const isExpanded = expandedId === category.category_id;
                return (
                    <div key={category.category_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(category.category_id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <Tag size={24} className="text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={category.category_name}>
                                                {category.category_name}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                                category.is_active 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {category.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                            <span className="whitespace-nowrap">Code: {category.category_code}</span>
                                            {category.category_name_en && (
                                                <>
                                                    <span className="hidden sm:inline text-gray-300">|</span>
                                                    <span className="truncate">{category.category_name_en}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex gap-2 mb-4">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(category.category_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all font-medium text-sm"
                                    >
                                        <Edit2 size={16} /> แก้ไข (Edit)
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleStatusToggle(category); }}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm border ${
                                            category.is_active 
                                                ? 'bg-white dark:bg-gray-700 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                                : 'bg-white dark:bg-gray-700 border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        }`}
                                    >
                                        <Trash2 size={16} /> {category.is_active ? 'ระงับการใช้งาน (Disable)' : 'เปิดใช้งาน (Enable)'}
                                    </button>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Database size={16} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Relations</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Table:</p>
                                            <p className="text-blue-600 font-mono">{dbRelation.dbTable}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                            <p className="text-blue-600 font-mono text-xs">{dbRelation.relations.join(', ')}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">FK:</p>
                                            <p className="text-blue-600 font-mono">{dbRelation.fk}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
