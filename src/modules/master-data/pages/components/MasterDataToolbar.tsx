import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { TabConfig, TabLabel } from '@/modules/master-data/types';

interface MasterDataToolbarProps {
    currentTab: TabConfig;
    tabLabel: TabLabel;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAddNew: () => void;
    totalItems: number;
}

export const MasterDataToolbar: React.FC<MasterDataToolbarProps> = ({
    currentTab,
    tabLabel,
    searchTerm,
    onSearchChange,
    onAddNew,
    totalItems
}) => {
    return (
        <>
            {/* Content Section Header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center shrink-0">
                        <currentTab.icon size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                            {tabLabel.main}
                        </h2>
                        <p className="text-sm text-blue-600 dark:text-blue-400 line-clamp-1">
                            {tabLabel.desc}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onAddNew}
                    className={`${styles.btnPrimary} w-full sm:w-auto flex items-center justify-center gap-2`}
                >
                    <Plus size={20} />
                    Add New
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${currentTab.label} (${currentTab.labelEn})...`}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Filter size={20} className="text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Filter</span>
                </button>
            </div>

            {/* Filter Summary */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                <Filter size={16} />
                <span>พบ {totalItems} รายการ จาก {currentTab.recordCount} รายการ</span>
            </div>
        </>
    );
};
