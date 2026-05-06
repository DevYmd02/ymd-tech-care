/**
 * @file SearchModal.tsx
 * @description Generic Search Modal Component - ใช้สำหรับค้นหาข้อมูลทุกประเภท
 * @purpose Reusable modal ที่รองรับ search แบบ generic (Vendor, Product, etc.)
 * 
 * @example
 * <SearchModal<Vendor>
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onSelect={handleSelect}
 *   title="ค้นหาผู้ขาย"
 *   subtitle="กรอกข้อมูลเพื่อค้นหาผู้ขายในระบบ"
 *   searchPlaceholder="รหัสผู้ขายหรือชื่อผู้ขาย"
 *   data={vendors}
 *   columns={vendorColumns}
 *   filterFn={(item, term) => item.code.includes(term) || item.name.includes(term)}
 *   getKey={(item) => item.code}
 * />
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { useSearchKeyboardNavigation } from '@/shared/hooks';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/** Column definition for table display */
export interface ColumnDef<T> {
    key: keyof T | 'action';  // Field key or 'action' for select button
    header: string;           // Column header text
    width?: string;           // Optional CSS width (e.g., '100px', '1fr')
    align?: 'left' | 'center' | 'right';  // Text alignment
    render?: (item: T) => React.ReactNode; // Custom render function
}

/** Props for SearchModal */
export interface SearchModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: T) => void;

    // Modal configuration
    title: string;
    subtitle?: string;
    searchLabel?: string;
    searchPlaceholder?: string;
    accentColor?: 'emerald' | 'blue' | 'purple';  // Theme color

    // Data configuration
    data: T[];
    columns: ColumnDef<T>[];
    filterFn: (item: T, searchTerm: string) => boolean;
    getKey: (item: T) => string | number;

    // Empty state
    // Empty state
    emptyText?: string;
    /** Loading state */
    isLoading?: boolean;
    /** Optional callback for external search handling (Server-side) */
    onSearchChange?: (term: string) => void;
}

// ====================================================================================
// COMPONENT - SearchModal
// ====================================================================================

// Inner generic function — React.memo erases generic type params, so we
// export it separately and then re-export the memo version cast to the
// correct generic signature. This way <SearchModal<T> /> works in JSX.
function SearchModalInner<T>({
    isOpen,
    onClose,
    onSelect,
    title,
    subtitle = 'กรอกข้อมูลเพื่อค้นหาในระบบ',
    searchLabel,
    searchPlaceholder = 'พิมพ์เพื่อค้นหา...',
    accentColor = 'emerald',
    data,
    columns,
    filterFn,
    getKey,
    emptyText = 'ไม่พบข้อมูลที่ค้นหา',
    isLoading = false,
    onSearchChange
}: SearchModalProps<T>) {
    // State สำหรับเก็บคำค้นหา
    const [searchTerm, setSearchTerm] = useState('');

    // กรองข้อมูลตามคำค้นหา
    // BUG FIX: ถ้ามี onSearchChange (Server-side) เราจะไม่ทำการกรองซ้ำที่ Client เพราะข้อมูลที่ได้รับมาคือผลลัพธ์จากการกรองที่ Server แล้ว
    // หากกรองซ้ำที่นี่ จะทำให้ข้อมูล "หายไป" ชั่วขณะขณะที่กำลังรอ API (เพราะ searchTerm เปลี่ยนแต่ data ยังเป็นชุดเก่า)
    const filteredData = useMemo(() => {
        if (onSearchChange) return data;
        return data.filter(item =>
            filterFn(item, searchTerm.toLowerCase())
        );
    }, [data, filterFn, searchTerm, onSearchChange]);

    // ✨ Centralized Keyboard Navigation
    const { selectedIndex, handleKeyDown } = useSearchKeyboardNavigation({
        items: filteredData,
        onSelect: (item) => onSelect(item),
        isOpen
    });

    // Generate color classes based on accent color
    const colorClasses = React.useMemo(() => ({
        emerald: {
            title: 'text-emerald-600',
            label: 'text-emerald-600',
            ring: 'focus:ring-emerald-500',
            button: 'bg-emerald-500 hover:bg-emerald-600',
            hover: 'hover:bg-emerald-50',
            loader: 'border-emerald-500',
        },
        blue: {
            title: 'text-blue-600',
            label: 'text-blue-700',
            ring: 'focus:ring-blue-500',
            button: 'bg-blue-500 hover:bg-blue-600',
            hover: 'hover:bg-blue-50',
            loader: 'border-blue-500',
        },
        purple: {
            title: 'text-purple-600',
            label: 'text-purple-700',
            ring: 'focus:ring-purple-500',
            button: 'bg-purple-500 hover:bg-purple-600',
            hover: 'hover:bg-purple-50',
            loader: 'border-purple-500',
        },
    }[accentColor]), [accentColor]);

    // Generate grid template columns from column definitions
    const gridCols = React.useMemo(() => columns.map(col => col.width || '1fr').join(' '), [columns]);

    // ถ้า Modal ปิดอยู่ ไม่ต้อง render (ย้ายมาไว้หลัง Hooks ตามกฎ React)
    if (!isOpen) return null;

    return createPortal(
        // Overlay
        <div className={`${styles.modalOverlay} p-4 font-sans`}>
            {/* Modal Container */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">

                {/* ==================== HEADER ==================== */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className={`text-xl font-bold ${colorClasses.title}`}>{title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ==================== SEARCH BAR ==================== */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    {searchLabel && (
                        <label className={`block text-sm font-bold ${colorClasses.label} mb-1`}>
                            {searchLabel}
                        </label>
                    )}
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className={`w-full h-10 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 ${colorClasses.ring} text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                        value={searchTerm}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSearchTerm(val);
                            onSearchChange?.(val);
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>

                {/* ==================== DATA TABLE ==================== */}
                <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800 relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                            <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${colorClasses.loader}`}></div>
                            <span className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูล...</span>
                        </div>
                    )}

                    <div className="space-y-1">
                        {/* Table Header */}
                        <div
                            className={`grid gap-4 px-2 py-2 text-sm font-bold ${colorClasses.label} border-b border-gray-100 dark:border-gray-700`}
                            style={{ gridTemplateColumns: gridCols }}
                        >
                            {columns.map((col) => (
                                <div
                                    key={String(col.key)}
                                    className={col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                                >
                                    {col.header}
                                </div>
                            ))}
                        </div>

                        {/* Data Rows */}
                        {!isLoading && filteredData.map((item, index) => (
                            <div
                                key={getKey(item)}
                                className={`grid gap-4 items-center px-2 py-3 border-b border-gray-100 dark:border-gray-700 transition-colors rounded-md cursor-pointer
                                    ${index === selectedIndex 
                                        ? `${accentColor === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-1 ring-inset ring-emerald-500' : 
                                           accentColor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-inset ring-blue-500' : 
                                           'bg-purple-100 dark:bg-purple-900/30 ring-1 ring-inset ring-purple-500'}`
                                        : `${colorClasses.hover} dark:hover:bg-gray-700/50`
                                    }
                                `}
                                style={{ gridTemplateColumns: gridCols }}
                                onClick={() => onSelect(item)}
                            >
                                {columns.map((col) => {
                                    // Action column (select button)
                                    if (col.key === 'action') {
                                        return (
                                            <div key="action" className="flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelect(item)}
                                                    className={`flex items-center justify-center ${colorClasses.button} text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-sm transition-colors w-full max-w-[70px]`}
                                                >
                                                    <Search size={14} className="mr-1" /> เลือก
                                                </button>
                                            </div>
                                        );
                                    }

                                    // Custom render function
                                    if (col.render) {
                                        return (
                                            <div 
                                                key={String(col.key)} 
                                                className={col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                                            >
                                                {col.render(item)}
                                            </div>
                                        );
                                    }

                                    // Default: display field value
                                    return (
                                        <div
                                            key={String(col.key)}
                                            className={`text-sm text-gray-800 dark:text-gray-200 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                                        >
                                            {col.key !== 'action' ? String(item[col.key] ?? '') : ''}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Empty State */}
                        {!isLoading && filteredData.length === 0 && (
                            <div className="text-center py-10 text-gray-400 dark:text-gray-500">{emptyText}</div>
                        )}
                    </div>
                </div>

                {/* ==================== FOOTER ==================== */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

}

// Cast preserves the <T> generic so `<SearchModal<MyType> />` works in JSX
// without TypeScript raising ts(2558) "Expected 0 type arguments".
export const SearchModal = React.memo(SearchModalInner) as typeof SearchModalInner;
