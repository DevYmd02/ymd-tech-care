import React from 'react';
import { Building2, ChevronDown, ChevronUp, Database, Edit2, Trash2 } from 'lucide-react';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';

interface BranchTabProps {
    data: BranchListItem[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    handleEdit: (id: string) => void;
    handleDelete: (id: string) => void;
    dbRelation: { dbTable: string; relations: string[]; fk: string };
}

export const BranchTab: React.FC<BranchTabProps> = ({
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
            {data.map((branch) => {
                const isExpanded = expandedId === branch.branch_id;
                return (
                    <div key={branch.branch_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(branch.branch_id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <Building2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={branch.branch_name}>
                                                {branch.branch_name}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                                branch.is_active 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {branch.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            Code: {branch.branch_code}
                                        </p>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <div className="flex gap-2 mb-4">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(branch.branch_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(branch.branch_id); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        <Trash2 size={16} /> Delete
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
