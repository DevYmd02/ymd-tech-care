import React from 'react';
import { FolderKanban, ChevronDown, Database } from 'lucide-react';
import type { Project } from '@/modules/master-data/types/master-data-types';

interface ProjectTabProps {
    data: Project[];
    expandedId: number | null;
    toggleExpand: (id: number) => void;
    handleEdit: (id: number) => void;
    handleStatusToggle: (project: Project) => void;
    dbRelation: { dbTable: string; relations: string[]; fk: string };
}

export const ProjectTab: React.FC<ProjectTabProps> = ({
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
            {data.map((project) => {
                const isExpanded = expandedId === project.id;
                return (
                    <div key={project.id} className={`bg-white dark:bg-gray-800 rounded-xl border ${project.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900/30 opacity-75'} overflow-hidden transition-all shadow-sm hover:shadow-md`}>
                        <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleExpand(project.id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-12 h-12 ${project.is_active ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'} rounded-xl flex items-center justify-center shrink-0`}>
                                        <FolderKanban size={24} className={project.is_active ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                            <span className={`font-semibold ${project.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-500'} line-clamp-2`} title={project.project_name}>
                                                {project.project_name}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {project.status}
                                                </span>
                                                {!project.is_active && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                                                        INACTIVE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                                            <span className="font-mono">Code: {project.project_code}</span>
                                            <span>Timeline: {project.start_date} - {project.end_date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleEdit(project.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="แก้ไข"
                                    >
                                        <Database size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleStatusToggle(project)}
                                        className={`p-2 ${project.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
                                        title={project.is_active ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'}
                                    >
                                        <ChevronDown size={16} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Description</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{project.description || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Budget Amount</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {project.budget_amount.toLocaleString('en-US', { style: 'currency', currency: 'THB' })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <p className="text-[10px] font-semibold text-gray-400 mb-3 flex items-center gap-2">
                                        <Database size={12} /> DATABASE RELATIONS
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                                            <p className="text-gray-400 mb-0.5">Table:</p>
                                            <p className="text-blue-600 dark:text-blue-400 font-mono font-medium">{dbRelation.dbTable}</p>
                                        </div>
                                        <div className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                                            <p className="text-gray-400 mb-0.5">Relations:</p>
                                            <p className="text-blue-600 dark:text-blue-400 font-mono font-medium truncate" title={dbRelation.relations.join(', ')}>
                                                {dbRelation.relations.join(', ')}
                                            </p>
                                        </div>
                                        <div className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                                            <p className="text-gray-400 mb-0.5">FK:</p>
                                            <p className="text-blue-600 dark:text-blue-400 font-mono font-medium">{dbRelation.fk}</p>
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
