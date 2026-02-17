/**
 * @file PageListLayout.tsx
 * @description Reusable layout สำหรับหน้า List ทุกหน้า (PR, RFQ, QT, QC)
 * ลด boilerplate code และ standardize โครงสร้าง UI
 * 
 * @usage
 * ```tsx
 * <PageListLayout
 *   title="รายการใบขอซื้อ"
 *   subtitle="Purchase Requisition (PR)"
 *   icon={FileText}
 *   accentColor="emerald"
 *   searchForm={<MySearchForm />}
 *   actionButtons={<MyActionButtons />}
 * >
 *   <DataTable ... />
 * </PageListLayout>
 * ```
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';
import { styles } from '@/shared/constants/styles';

// ====================================================================================
// TYPES
// ====================================================================================

export type AccentColor = 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'teal' | 'indigo';

export interface PageListLayoutProps {
    /** Page title (Thai) */
    title: string;
    /** Page subtitle (English or description) */
    subtitle?: string;
    /** Icon component */
    icon: LucideIcon;
    /** Accent color theme */
    accentColor?: AccentColor;
    /** Search form content */
    searchForm?: React.ReactNode;
    /** Action buttons (right side of header or search form) */
    actionButtons?: React.ReactNode;
    /** Show search form section */
    showSearchForm?: boolean;
    /** Search form title */
    searchFormTitle?: string;
    /** Page content (data table, cards, etc.) */
    children: React.ReactNode;
    /** Loading state */
    isLoading?: boolean;
    /** Total record count for the list */
    totalCount?: number;
    /** Whether the record count is still loading */
    totalCountLoading?: boolean;
}

// ====================================================================================
// COLOR MAPPINGS
// ====================================================================================

const colorMaps: Record<AccentColor, { header: string; icon: string; border: string }> = {
    emerald: {
        header: 'from-emerald-600 to-emerald-700',
        icon: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-600',
    },
    blue: {
        header: 'from-blue-600 to-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-600',
    },
    purple: {
        header: 'from-purple-600 to-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-600',
    },
    amber: {
        header: 'from-amber-500 to-amber-600',
        icon: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-600',
    },
    red: {
        header: 'from-red-600 to-red-700',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-600',
    },
    teal: {
        header: 'from-teal-600 to-teal-700',
        icon: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-600',
    },
    indigo: {
        header: 'from-indigo-600 to-indigo-700',
        icon: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-600',
    },
};

// ====================================================================================
// COMPONENT
// ====================================================================================

export const PageListLayout: React.FC<PageListLayoutProps> = ({
    title,
    subtitle,
    icon: Icon,
    accentColor = 'emerald',
    searchForm,
    actionButtons,
    showSearchForm = true,
    searchFormTitle = 'ฟอร์มค้นหาข้อมูล',
    children,
    isLoading = false,
    totalCount,
    totalCountLoading = false,
}) => {
    const colors = colorMaps[accentColor];

    return (
        <div className={styles.pageContainerCompact}>
            {/* ==================== PAGE HEADER ==================== */}
            <div className={`bg-gradient-to-r ${colors.header} rounded-lg p-4 shadow-lg mb-6`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Icon size={24} className="text-white shrink-0" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-white break-words">{title}</h1>
                            </div>
                            {subtitle && (
                                <p className="text-white/80 text-sm break-words">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {actionButtons && (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {actionButtons}
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== SEARCH FORM ==================== */}
            {showSearchForm && searchForm && (
                <div className={`${styles.card} p-4 mb-6`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Search size={18} className={colors.icon} />
                        <h2 className="text-base font-bold text-gray-700 dark:text-white">
                            {searchFormTitle}
                        </h2>
                    </div>
                    {searchForm}
                </div>
            )}

            {/* ==================== RECORD SUMMARY ==================== */}
            {totalCountLoading ? (
                <div className="mb-4 h-7 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
            ) : typeof totalCount === 'number' && (
                <div className="mb-4 animate-in fade-in slide-in-from-left-2 duration-500">
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                        พบข้อมูล <span className="text-blue-600 dark:text-blue-400 mx-1">{totalCount.toLocaleString()}</span> รายการ
                    </p>
                </div>
            )}

            {/* ==================== LOADING OVERLAY ==================== */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        <span className="text-gray-700 dark:text-gray-200">กำลังโหลด...</span>
                    </div>
                </div>
            )}

            {/* ==================== PAGE CONTENT (Data Table) ==================== */}
            {children}
        </div>
    );
};

export default PageListLayout;
