
import React from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight, 
    Search,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

interface SmartTableProps<TData> {
    data: TData[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: ColumnDef<TData, any>[];
    isLoading?: boolean;
    pagination: {
        pageIndex: number;
        pageSize: number;
        totalCount: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
    };
    onRowClick?: (row: TData) => void;
    className?: string; // Additional container classes
    enableRowSelection?: boolean;
    onRowSelectionChange?: (selectedIds: string[]) => void;
    rowIdField?: keyof TData; // Field to use as ID for selection (default: 'id')
    hoverable?: boolean; // Enable/disable hover effect (default: true)
    showFooter?: boolean; // Enable/disable footer row (default: false)
    sortConfig?: SortConfig | null;
    onSortChange?: (key: string) => void;
    stickyColumns?: boolean; // Enable sticky columns logic (default: false)
    stickyBorders?: boolean; // Show border/shadow for sticky columns (default: true)
    showPagination?: boolean; // Enable/disable pagination footer (default: true)
    renderMobileCard?: (item: TData) => React.ReactNode; // Optional card renderer for mobile
}

export function SmartTable<TData>({
    data,
    columns,
    isLoading = false,
    pagination,
    onRowClick,
    className,
    enableRowSelection = false,
    onRowSelectionChange,
    rowIdField = 'id' as keyof TData,
    hoverable = true,
    showFooter = false,
    sortConfig,
    onSortChange,
    stickyColumns = false,
    stickyBorders = true,
    showPagination = true,
    renderMobileCard,
}: SmartTableProps<TData>) {
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

    // Sync selection back to parent
    React.useEffect(() => {
        if (onRowSelectionChange) {
            const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
            onRowSelectionChange(selectedIds);
        }
    }, [rowSelection, onRowSelectionChange]);

    // Enhance columns with selection checkbox if enabled
    const tableColumns = React.useMemo(() => {
        if (!enableRowSelection) return columns;

        const selectionColumn: ColumnDef<TData, unknown> = {
            id: 'select',
            header: ({ table }) => (
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                </div>
            ),
            size: 40,
        };

        return [selectionColumn, ...columns];
    }, [columns, enableRowSelection]);
    
    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowId: (row, index) => String(row[rowIdField] ?? index), // Use custom ID field with index fallback
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
            sorting: sortConfig ? [{ id: sortConfig.key, desc: sortConfig.direction === 'desc' }] : [],
        },
        manualPagination: true,
        manualSorting: !!onSortChange, // If onSortChange is provided, assume manual sorting
        enableRowSelection: true,
        enableSorting: true,
    });

    const visibleColumns = table.getVisibleFlatColumns();
    const stickyOffsets = React.useMemo(() => {
        if (!stickyColumns) return { left: {}, right: {} };
        
        const leftOffsets: Record<string, number> = {};
        const rightOffsets: Record<string, number> = {};
        
        let leftSum = 0;
        visibleColumns.forEach(column => {
            const meta = column.columnDef.meta as { sticky?: 'left' | 'right' } | undefined;
            if (meta?.sticky === 'left') {
                leftOffsets[column.id] = leftSum;
                leftSum += column.getSize() || 0;
            }
        });

        let rightSum = 0;
        for (let i = visibleColumns.length - 1; i >= 0; i--) {
            const column = visibleColumns[i];
            const meta = column.columnDef.meta as { sticky?: 'left' | 'right' } | undefined;
            if (meta?.sticky === 'right') {
                rightOffsets[column.id] = rightSum;
                rightSum += column.getSize() || 0;
            }
        }
        
        return { left: leftOffsets, right: rightOffsets };
    }, [visibleColumns, stickyColumns]);

    // Pagination calculations
    const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
    const startRow = (pagination.pageIndex - 1) * pagination.pageSize + 1;
    const endRow = Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount);

    return (
        <div className={`flex flex-col h-full ${styles.bg.surface} rounded-lg shadow-sm border ${styles.border.default} ${className}`}>
            {/* Mobile View: Render Cards if renderMobileCard is provided */}
            {renderMobileCard && data.length > 0 && (
                <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-3">
                    {data.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {renderMobileCard(item)}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Table Container - Hidden on mobile if cards are rendered */}
            <div className={`flex-1 overflow-auto relative ${stickyColumns ? 'rounded-lg' : ''} ${styles.bg.surface} ${renderMobileCard ? 'hidden md:block' : ''}`}>
                <table 
                    className={`w-full text-left border-collapse table-fixed text-sm ${stickyColumns ? 'min-w-max' : 'min-w-full'}`}
                >
                    <thead className={`${styles.bg.header} ${styles.text.secondary} uppercase text-xs sticky top-0 ${stickyColumns ? 'z-30' : 'z-10'}`}>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className={`border-b ${styles.border.default}`}>
                                {headerGroup.headers.map(header => {
                                    const canSort = header.column.getCanSort();
                                    const meta = header.column.columnDef.meta as { thClassName?: string, sticky?: 'left' | 'right', align?: string } | undefined;
                                    const stickyType = stickyColumns ? meta?.sticky : undefined;
                                    const stickyOffset = stickyType === 'left' ? stickyOffsets.left[header.id] : stickyType === 'right' ? stickyOffsets.right[header.id] : undefined;

                                    const alignClass = meta?.thClassName?.includes('text-center') ? 'justify-center' :
                                                       meta?.thClassName?.includes('text-right') ? 'justify-end' : '';

                                    return (
                                        <th
                                            key={header.id}
                                            style={{ 
                                                width: header.getSize(),
                                                minWidth: header.getSize(), // Ensure it doesn't collapse
                                                ...(stickyType === 'left' ? { left: stickyOffset, position: 'sticky', zIndex: 32 } : {}),
                                                ...(stickyType === 'right' ? { right: stickyOffset, position: 'sticky', zIndex: 32 } : {}),
                                            }}
                                            className={`${meta?.thClassName || 'px-2 py-3 font-semibold'} select-none group ${
                                                canSort ? `cursor-pointer ${styles.state.hover}` : ''
                                            } ${sortConfig?.key === header.column.id ? styles.state.active : ''} ${
                                                styles.bg.header
                                            } ${
                                                stickyType === 'left' && stickyBorders ? 'border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : 
                                                stickyType === 'right' && stickyBorders ? 'border-l border-gray-200 dark:border-gray-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''
                                            }`}
                                            onClick={() => {
                                                if (canSort && onSortChange) {
                                                    onSortChange(header.column.id);
                                                } else if (canSort) {
                                                    header.column.getToggleSortingHandler()?.(null);
                                                }
                                            }}
                                        >
                                            <div className={`flex items-center gap-1 w-full whitespace-nowrap ${alignClass || (meta?.align === 'right' ? 'justify-end pr-10' : '')}`}>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {canSort && (
                                                    <span className={styles.text.accent}>
                                                        {sortConfig?.key === header.column.id ? (
                                                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                                        ) : (
                                                            <div className="w-4 h-4 opacity-0 group-hover:opacity-30 flex items-center justify-center">
                                                                <ChevronDown size={14} />
                                                            </div>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-none">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="p-0">
                                    <div className="border-none">
                                        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 px-4 py-4 animate-pulse">
                                            {Array.from({ length: Math.min(6, columns.length) }).map((_, i) => (
                                                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded mr-4 flex-1" />
                                            ))}
                                        </div>
                                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                            {Array.from({ length: pagination.pageSize }).map((_, rowIndex) => (
                                                <div key={rowIndex} className="flex px-4 py-4 items-center animate-pulse">
                                                    {Array.from({ length: Math.min(6, columns.length) }).map((_, colIndex) => (
                                                        <div key={colIndex} className="h-3 bg-gray-100 dark:bg-gray-800 rounded mr-4 flex-1 opacity-60" />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (data?.length ?? 0) > 0 ? (
                            table.getRowModel()?.rows?.map(row => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    className={`
                                        group transition-colors duration-150 border-b border-transparent last:border-none
                                        ${styles.tableStripe}
                                        ${onRowClick ? 'cursor-pointer' : ''}
                                        ${hoverable ? styles.state.hover : ''}
                                    `}
                                >
                                    {row.getVisibleCells().map(cell => {
                                        const meta = cell.column.columnDef.meta as { tdClassName?: string, sticky?: 'left' | 'right' } | undefined;
                                        const stickyType = stickyColumns ? meta?.sticky : undefined;
                                        const stickyOffset = stickyType === 'left' ? stickyOffsets.left[cell.column.id] : stickyType === 'right' ? stickyOffsets.right[cell.column.id] : undefined;

                                        return (
                                        <td 
                                            key={cell.id} 
                                            style={{
                                                width: cell.column.getSize(),
                                                minWidth: cell.column.getSize(),
                                                ...(stickyType === 'left' ? { left: stickyOffset, position: 'sticky', zIndex: 21 } : {}),
                                                ...(stickyType === 'right' ? { right: stickyOffset, position: 'sticky', zIndex: 21 } : {}),
                                            }}
                                            className={`${meta?.tdClassName || 'px-2 py-3 text-sm'} text-gray-700 dark:text-gray-300 transition-colors ${
                                                stickyType 
                                                    ? 'bg-white dark:bg-[#1f2937] group-even:bg-[#f9fafb] dark:group-even:bg-[#26303f] group-hover:bg-[#f0f7ff] dark:group-hover:bg-[#2b3544]' 
                                                    : 'group-even:bg-[#f9fafb] dark:group-even:bg-[#26303f] group-hover:bg-[#f0f7ff] dark:group-hover:bg-[#2b3544]'
                                            } ${
                                                stickyType === 'left' && stickyBorders ? `border-r border-gray-100 dark:border-gray-700/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]` :
                                                stickyType === 'right' && stickyBorders ? `border-l border-gray-100 dark:border-gray-700/50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]` : ''
                                            }`}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    )})}
                                </tr>
                            ))
                        ) : (
                            // Empty State
                            <tr>
                                <td colSpan={columns.length} className={`px-2 py-16 text-center ${styles.text.tertiary}`}>
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className={`w-12 h-12 rounded-full ${styles.bg.subtle} flex items-center justify-center text-gray-400`}>
                                            <Search size={24} />
                                        </div>
                                        <p className="text-lg font-medium">ไม่พบข้อมูล</p>
                                        <p className="text-sm">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {showFooter && (
                        <tfoot className={`${styles.bg.header} font-bold ${styles.text.primary} sticky bottom-0 z-10 border-t-2 border-gray-300 dark:border-gray-600 shadow-sm`}>
                            {table.getFooterGroups().map(footerGroup => (
                                <tr key={footerGroup.id}>
                                    {footerGroup.headers.map(header => (
                                        <td key={header.id} className="px-2 py-2 relative">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.footer,
                                                    header.getContext()
                                                )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tfoot>
                    )}
                    </table>
                </div>
 
            {/* Pagination Footer */}
            {showPagination && (
                <div className={`px-4 py-3 ${styles.bg.subtle} border-t ${styles.border.default} flex flex-col sm:flex-row items-center justify-between gap-4 select-none`}>
                    
                    {/* Left: Info & Size Selector */}
                    <div className={`flex flex-col sm:flex-row items-center gap-4 text-sm ${styles.text.secondary} w-full sm:w-auto`}>
                        <div className="flex items-center gap-2">
                            <span>แสดง</span>
                            <select
                                value={pagination.pageSize}
                                onChange={e => pagination.onPageSizeChange(Number(e.target.value))}
                                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-200"
                            >
                                {[5, 10, 20, 50, 100].map(pageSize => (
                                    <option key={pageSize} value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                            <span>แถว</span>
                        </div>
                        
                        <span className="hidden sm:inline text-gray-300">|</span>
                        
                        <span>
                            แสดง {pagination.totalCount > 0 ? startRow : 0} ถึง {endRow} จาก {pagination.totalCount} รายการ
                        </span>
                    </div>
    
                    {/* Right: Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-gray-300"
                            onClick={() => pagination.onPageChange(1)}
                            disabled={pagination.pageIndex === 1 || isLoading}
                            title="หน้าแรก"
                            aria-label="Go to first page"
                        >
                            <ChevronsLeft size={20} />
                        </button>
                        <button
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-gray-300"
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.pageIndex - 1))}
                            disabled={pagination.pageIndex === 1 || isLoading}
                            title="ก่อนหน้า"
                            aria-label="Go to previous page"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <span className="px-2 text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[3rem] text-center">
                            หน้า {pagination.pageIndex} / {Math.max(1, totalPages)}
                        </span>
    
                        <button
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-gray-300"
                            onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.pageIndex + 1))}
                            disabled={pagination.pageIndex === totalPages || totalPages === 0 || isLoading}
                            title="ถัดไป"
                            aria-label="Go to next page"
                        >
                            <ChevronRight size={20} />
                        </button>
                        <button
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-gray-600 dark:text-gray-300"
                            onClick={() => pagination.onPageChange(totalPages)}
                            disabled={pagination.pageIndex === totalPages || totalPages === 0 || isLoading}
                            title="หน้าสุดท้าย"
                            aria-label="Go to last page"
                        >
                            <ChevronsRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SmartTable;
