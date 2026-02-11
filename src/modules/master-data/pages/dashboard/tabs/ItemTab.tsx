import React from 'react';
import { Package, Hash, MapPin, Tag, ChevronDown, ChevronUp, Database, Edit2, Trash2, DollarSign, Layers } from 'lucide-react';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';

interface ItemTabProps {
    data: ItemListItem[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    handleEdit: (id: string) => void;
    handleDelete: (id: string) => void;
    dbRelation: { dbTable: string; relations: string[]; fk: string };
}

export const ItemTab: React.FC<ItemTabProps> = ({
    data,
    expandedId,
    toggleExpand,
    handleEdit,
    handleDelete,
    dbRelation
}) => {
    if (data.length === 0) {
        return <div className="text-center py-12 text-gray-500">ไม่พบข้อมูล {dbRelation.dbTable}</div>;
    }

    return (
        <div className="space-y-4">
            {data.map((item) => {
                const isExpanded = expandedId === item.item_id;
                return (
                    <div key={item.item_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(item.item_id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <Package size={24} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={item.item_name}>
                                                {item.item_name}
                                            </span>
                                            {item.is_active !== undefined && (
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                                    item.is_active
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                            <span className="whitespace-nowrap font-medium text-blue-600">{item.item_code}</span>
                                            <span className="hidden sm:inline text-gray-300">|</span>
                                            <span className="whitespace-nowrap">{item.item_name_en || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Column 1: Classification */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Classification</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Layers size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Category:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.category_name || '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-20">Type:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.item_type_code || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Column 2: Inventory & Cost */}
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Inventory Info</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Hash size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-24">Unit:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.unit_name || '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400 w-24">Std Cost:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.standard_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                                                </span>
                                            </div>
                                            {(item.warehouse || item.location) && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24">Location:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {[item.warehouse, item.location].filter(Boolean).join(' / ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 flex gap-2 pt-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(item.item_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.item_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>

                                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Database size={16} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Relations</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Table:</p>
                                            <p className="text-blue-600 font-mono">{dbRelation.dbTable}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                            <p className="text-blue-600 font-mono text-xs">
                                                {dbRelation.relations.join(', ')}
                                            </p>
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
