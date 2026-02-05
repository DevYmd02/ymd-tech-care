import React from 'react';
import { DollarSign, ChevronDown, ChevronUp, Database } from 'lucide-react';
import type { CostCenter } from '@/modules/master-data/types/master-data-types';

interface CostCenterTabProps {
    data: CostCenter[];
    expandedId: string | null;
    toggleExpand: (id: string) => void;
    dbRelation: { dbTable: string; relations: string[]; fk: string };
}

export const CostCenterTab: React.FC<CostCenterTabProps> = ({
    data,
    expandedId,
    toggleExpand,
    dbRelation
}) => {
    if (data.length === 0) {
        return <div className="text-center py-12 text-gray-500">ไม่พบข้อมูล {dbRelation.dbTable}</div>;
    }

    return (
        <div className="space-y-4">
            {data.map((cc) => {
                const isExpanded = expandedId === cc.cost_center_id;
                return (
                    <div key={cc.cost_center_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(cc.cost_center_id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <DollarSign size={24} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                            <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={cc.cost_center_name}>
                                                {cc.cost_center_name}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                                cc.is_active 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {cc.is_active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                            <span className="whitespace-nowrap">Code: {cc.cost_center_code}</span>
                                            <span className="hidden sm:inline text-gray-300">|</span>
                                            <span className="truncate">Manager: {cc.manager_name}</span>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Description</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{cc.description}</p>
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Budget Amount</p>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {cc.budget_amount.toLocaleString('en-US', { style: 'currency', currency: 'THB' })}
                                    </p>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
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
