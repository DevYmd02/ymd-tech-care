/**
 * @file GenericMasterDataList.tsx
 * @description Generic reusable component for Master Data list pages with CRUD, Search, and Pagination
 * @usage Used to eliminate code duplication across master data modules
 */

import { Edit2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Plus } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { GenericMasterDataListProps, GenericMasterDataItem, GenericTableColumn } from '@/modules/master-data/types/generic-master-data-types';
import { FilterFormBuilder } from '@ui';

/**
 * Generic Master Data List Component
 * Handles common CRUD operations, search, filtering, and pagination
 */
export function GenericMasterDataList<T extends GenericMasterDataItem>(
    props: GenericMasterDataListProps<T>
) {
    const {
        config,
        items,
        isLoading,
        searchTerm,
        statusFilter,
        currentPage,
        rowsPerPage,
        totalItems,
        onSearchChange,
        onStatusFilterChange,
        onPageChange,
        onRowsPerPageChange,
        onCreate,
        onEdit,
        onDelete,
        onRefresh,
        getItemId,
    } = props;

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

    // Handle delete with confirmation
    const handleDelete = (id: string) => {
        if (confirm(config.deleteConfirmMessage)) {
            onDelete(id);
        }
    };

    const Icon = config.icon;

    // Filter Config for FilterFormBuilder
    const filterConfig = [
        { 
            name: 'search', 
            label: 'ค้นหา', 
            type: 'text' as const, 
            placeholder: config.searchPlaceholder 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select' as const, 
            options: [
                { value: 'ALL', label: 'ทั้งหมด' },
                { value: 'ACTIVE', label: 'ใช้งาน' },
                { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
            ] 
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Icon className="text-blue-600" />
                        {config.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {config.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="รีเฟรช"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={onCreate}
                        className={`${styles.btnPrimary} flex items-center gap-2 whitespace-nowrap`}
                    >
                        <Plus size={20} />
                        {config.createButtonText}
                    </button>
                </div>
            </div>

            {/* Filter Section (Standardized) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={{ search: searchTerm, status: statusFilter }}
                    onFilterChange={(name: string, value: string | boolean | string[]) => {
                        if (name === 'search') onSearchChange(value as string);
                        if (name === 'status') onStatusFilterChange(value as 'ALL' | 'ACTIVE' | 'INACTIVE');
                    }}
                    onSearch={() => onPageChange(1)}
                    onReset={() => {
                        onSearchChange('');
                        onStatusFilterChange('ALL');
                    }}
                    onCreate={onCreate}
                    createLabel={config.createButtonText}
                    accentColor="indigo"
                />
            </div>

            {/* Data Table */}
            <div className={styles.tableContainer}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    {config.columns.map((column: GenericTableColumn<T>, index: number) => (
                                        <th
                                            key={index}
                                            className={`px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase ${
                                                column.hideOnMobile ? 'hidden md:table-cell' : ''
                                            } ${column.className || ''}`}
                                        >
                                            {column.header}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {items.length > 0 ? (
                                    items.map((item: T) => {
                                        const itemId = getItemId(item);
                                        return (
                                            <tr key={itemId} className={styles.tableTr}>
                                                {config.columns.map((column: GenericTableColumn<T>, colIndex: number) => (
                                                    <td
                                                        key={colIndex}
                                                        className={`px-6 py-4 text-sm ${
                                                            column.hideOnMobile ? 'hidden md:table-cell' : ''
                                                        } ${column.className || ''}`}
                                                    >
                                                        {column.accessor(item)}
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => onEdit(itemId)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(itemId)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={config.columns.length + 1}
                                            className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            {config.emptyMessage}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && items.length > 0 && (
                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>แสดง</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                                className={styles.inputSm}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                            <span>
                                รายการ | {startIndex + 1}-{endIndex} จาก {totalItems}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onPageChange(1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>

                            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                หน้า {currentPage} / {totalPages || 1}
                            </span>

                            <button
                                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => onPageChange(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


