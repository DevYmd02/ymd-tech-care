
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
    Search
} from 'lucide-react';

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
        getRowId: (row) => String(row[rowIdField]), // Use custom ID field
        state: {
            rowSelection,
        },
        onRowSelectionChange: setRowSelection,
        manualPagination: true,
        enableRowSelection: true,
        enableSorting: false,
        manualSorting: false,
    });

    // Pagination calculations
    const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);
    const startRow = (pagination.pageIndex - 1) * pagination.pageSize + 1;
    const endRow = Math.min(pagination.pageIndex * pagination.pageSize, pagination.totalCount);

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
            {/* Table Container */}
            <div className="flex-1 overflow-auto relative">
                <table 
                    className="w-full table-fixed text-left text-sm"
                    style={{ minWidth: table.getTotalSize() }}
                >
                    <thead className="bg-blue-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-600">
                                {headerGroup.headers.map(header => {
                                    return (
                                        <th
                                            key={header.id}
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }} // Use size if specifically set
                                            className="px-4 py-3 font-semibold select-none group"
                                        >
                                            <div className="flex items-center gap-1 w-full">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {isLoading ? (
                            // Loading Skeleton
                            Array.from({ length: pagination.pageSize }).map((_, index) => (
                                <tr key={`skeleton-${index}`} className="animate-pulse">
                                    {columns.map((_, colIndex) => (
                                        <td key={`skeleton-cell-${colIndex}`} className="px-4 py-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick && onRowClick(row.original)}
                                    className={`
                                        group transition-colors duration-150 border-b border-gray-50 dark:border-gray-800 last:border-none
                                        ${onRowClick ? 'cursor-pointer' : ''}
                                        ${hoverable ? 'hover:bg-blue-50 dark:hover:bg-gray-700' : ''}
                                    `}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            // Empty State
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
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
                        <tfoot className="bg-blue-50 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200 sticky bottom-0 z-10 border-t-2 border-gray-300 dark:border-gray-600 shadow-sm">
                            {table.getFooterGroups().map(footerGroup => (
                                <tr key={footerGroup.id}>
                                    {footerGroup.headers.map(header => (
                                        <td key={header.id} className="px-4 py-2 relative">
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
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                
                {/* Left: Info & Size Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600 dark:text-gray-400 w-full sm:w-auto">
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
        </div>
    );
}

export default SmartTable;
