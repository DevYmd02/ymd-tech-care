import React from 'react';
import type { TabConfig, TabType } from '@/modules/master-data/types';

interface MasterDataTabsProps {
    tabs: TabConfig[];
    activeTab: TabType;
    onTabChange: (tabId: TabType) => void;
}

export const MasterDataTabs: React.FC<MasterDataTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div
                className={`
                    flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden gap-3 pb-3 snap-x snap-mandatory
                    [&::-webkit-scrollbar]:h-1.5
                    [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-slate-800
                    [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600
                `}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex-shrink-0 snap-start w-[148px] sm:w-[168px] lg:w-[180px] p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                            activeTab === tab.id
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-transparent'
                        }`}
                    >
                        <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                            <tab.icon size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="text-center w-full min-w-0 flex flex-col justify-center">
                            <p className={`text-xs sm:text-sm font-medium truncate w-full ${
                                activeTab === tab.id
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300'
                            }`}>
                                {tab.label}
                            </p>
                            <p className={`text-[10px] sm:text-xs truncate w-full mb-1 ${
                                activeTab === tab.id ? 'text-blue-500/80' : 'text-gray-500'
                            }`}>
                                {tab.labelEn}
                            </p>
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                {tab.recordCount} รายการ
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
