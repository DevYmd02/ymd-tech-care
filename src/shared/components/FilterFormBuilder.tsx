/**
 * @file FilterFormBuilder.tsx
 * @description Highly reusable filter form builder component for standardizing search forms across the ERP.
 * Eliminates manual Grid/Layout duplication by generating filter forms from configuration.
 * 
 * @features
 * - Type-safe configuration with generics matching filter keys
 * - Responsive grid layout (1 col mobile, 4 cols md, 5 cols lg)
 * - Automatic button grouping (Search/Reset inline with last field)
 * - Overflow prevention with proper width constraints
 * - Support for text, select, and date field types
 */

import React, { type ReactNode } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { FilterField, type FilterFieldType, type SelectOption } from '@ui/FilterField';

// ====================================================================================
// TYPES
// ====================================================================================

/**
 * Configuration for a single filter field
 * @template TFilterKeys - Union type of valid filter key names
 */
export interface FilterFieldConfig<TFilterKeys extends string = string> {
    /** Field name - must match a key in the filters object */
    name: TFilterKeys;
    /** Display label for the field */
    label: string;
    /** Field type: text, select, or date */
    type: FilterFieldType;
    /** Placeholder text (for text inputs) */
    placeholder?: string;
    /** Options for select fields */
    options?: SelectOption[];
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Column span override (default: 1) */
    colSpan?: number;
}

/**
 * Props for the FilterFormBuilder component
 * @template TFilters - Type of the filters object from useTableFilters
 * @template TFilterKeys - Union type of valid filter key names
 */
export interface FilterFormBuilderProps<
    TFilters extends object,
    TFilterKeys extends string = Extract<keyof TFilters, string>
> {
    /** Array of field configurations */
    config: FilterFieldConfig<TFilterKeys>[];
    /** Current filter state from useTableFilters */
    filters: TFilters;
    /** Function to update individual filter values */
    onFilterChange: (name: TFilterKeys, value: string) => void;
    /** Function to trigger the search */
    onSearch: () => void;
    /** Function to clear all filters */
    onReset: () => void;
    /** Accent color for styling */
    accentColor?: 'emerald' | 'blue' | 'purple' | 'teal' | 'indigo';
    /** Optional additional action buttons (e.g., "+ Create") */
    actionButtons?: ReactNode;
    /** Optional callback for create button - if provided, renders a green "สร้างใหม่" button */
    onCreate?: () => void;
    /** Custom label for the create button (default: "สร้างใหม่") */
    createLabel?: string;
    /** Custom search button label */
    searchLabel?: string;
    /** Custom reset button label */
    resetLabel?: string;
    /** Number of columns for the grid (default: 4 for md, 5 for lg) */
    columns?: {
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    /** Column span for the action buttons container */
    actionColSpan?: {
        sm?: number | 'full';
        md?: number | 'full';
        lg?: number | 'full';
        xl?: number | 'full';
    };
    /** Alignment of action buttons (default: 'end') */
    actionAlign?: 'start' | 'end' | 'center' | 'between';
}

// ====================================================================================
// COLOR MAPPINGS
// ====================================================================================

const buttonColors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
};

// ====================================================================================
// COMPONENT
// ====================================================================================

/**
 * FilterFormBuilder - A reusable component for building filter forms from configuration
 * 
 * @example
 * ```tsx
 * const filterConfig: FilterFieldConfig<keyof typeof filters>[] = [
 *   { name: 'search', label: 'เลขที่ PR', type: 'text', placeholder: 'PR-xxx' },
 *   { name: 'status', label: 'สถานะ', type: 'select', options: STATUS_OPTIONS },
 *   { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
 *   { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
 * ];
 * 
 * <FilterFormBuilder
 *   config={filterConfig}
 *   filters={filters}
 *   onFilterChange={(name, value) => handleFilterChange(name, value)}
 *   onSearch={handleSearch}
 *   onReset={resetFilters}
 *   accentColor="blue"
 *   actionButtons={<CreateButton />}
 * />
 * ```
 */
export function FilterFormBuilder<
    TFilters extends object,
    TFilterKeys extends string = Extract<keyof TFilters, string>
>({
    config,
    filters,
    onFilterChange,
    onSearch,
    onReset,
    accentColor = 'emerald',
    actionButtons,
    onCreate,
    createLabel = 'สร้างใหม่',
    searchLabel = 'ค้นหา',
    resetLabel = 'ล้างค่า',
    columns = { sm: 2, md: 4, lg: 5, xl: 6 },
    actionColSpan = { sm: 'full', md: 2, lg: 2, xl: 2 },
    actionAlign = 'end',
}: FilterFormBuilderProps<TFilters, TFilterKeys>): React.ReactElement {
    // Grid column mappings to ensure Tailwind scanner picks them up
    // This eliminates the need for safelisting in tailwind.config.js
    const gridColsMap: Record<number, string> = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        7: 'grid-cols-7',
        8: 'grid-cols-8',
        9: 'grid-cols-9',
        10: 'grid-cols-10',
        11: 'grid-cols-11',
        12: 'grid-cols-12',
    };

    const getGridClass = (cols: number | undefined, prefix: string) => {
        if (!cols || !gridColsMap[cols]) return '';
        return prefix ? `${prefix}:${gridColsMap[cols]}` : gridColsMap[cols];
    };

    const smCols = getGridClass(columns.sm, 'sm') || 'sm:grid-cols-2';
    const mdCols = getGridClass(columns.md, 'md') || 'md:grid-cols-4';
    const lgCols = getGridClass(columns.lg, 'lg') || 'lg:grid-cols-5';
    const xlCols = getGridClass(columns.xl, 'xl') || 'xl:grid-cols-6';

    // Build responsive grid classes
    const gridClasses = [
        'grid',
        'grid-cols-1',
        smCols,
        mdCols,
        lgCols,
        xlCols,
        'gap-4',
        'w-full',
    ].filter(Boolean).join(' ');

    // Column span mapping for fields
    const colSpanMap: Record<number, string> = {
        1: 'col-span-1',
        2: 'col-span-2',
        3: 'col-span-3',
        4: 'col-span-4',
        5: 'col-span-5',
        6: 'col-span-6',
        7: 'col-span-7',
        8: 'col-span-8',
        9: 'col-span-9',
        10: 'col-span-10',
        11: 'col-span-11',
        12: 'col-span-12',
    };

    // Helper to generate col-span classes for action buttons
    const getActionColSpanClass = (span: number | 'full' | undefined, prefix: string) => {
        if (!span) return '';
        if (span === 'full') return `${prefix}col-span-full`;
        // Safe check for number type to satisfy TypeScript
        if (typeof span === 'number' && colSpanMap[span]) {
            return `${prefix}${colSpanMap[span]}`;
        }
        return '';
    };

    const actionSmSpan = getActionColSpanClass(actionColSpan.sm, 'sm:');
    const actionMdSpan = getActionColSpanClass(actionColSpan.md, 'md:');
    const actionLgSpan = getActionColSpanClass(actionColSpan.lg, 'lg:');
    const actionXlSpan = getActionColSpanClass(actionColSpan.xl, 'xl:');

    // Handle form submission (prevent default and trigger search)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    // Handle Enter key press on inputs
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSearch();
        }
    };

    /**
     * Helper to get justification class
     */
    const getJustifyClass = (align: 'start' | 'end' | 'center' | 'between') => {
        switch (align) {
            case 'start': return 'justify-start';
            case 'center': return 'justify-center';
            case 'between': return 'justify-between';
            case 'end':
            default: return 'justify-end';
        }
    };

    const justifyClass = getJustifyClass(actionAlign);

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className={gridClasses}>
                {/* Render filter fields from config */}
                {config.map((field) => {
                    const value = (filters as Record<string, unknown>)[field.name];
                    const stringValue = value !== undefined && value !== null ? String(value) : '';
                    
                    // Handle column span
                    const colSpanClass = field.colSpan && field.colSpan > 1 && colSpanMap[field.colSpan]
                        ? colSpanMap[field.colSpan]
                        : '';

                    return (
                        <div 
                            key={field.name} 
                            className={`min-w-0 ${colSpanClass}`}
                            onKeyDown={handleKeyDown}
                        >
                            <FilterField
                                label={field.label}
                                type={field.type}
                                value={stringValue}
                                onChange={(val) => onFilterChange(field.name, val)}
                                placeholder={field.placeholder}
                                options={field.options}
                                accentColor={accentColor}
                                disabled={field.disabled}
                            />
                        </div>
                    );
                })}

                {/* Action Buttons */}
                <div className={`flex flex-col sm:flex-row flex-wrap items-end ${justifyClass} gap-2 min-w-0 col-span-1 ${actionSmSpan} ${actionMdSpan} ${actionLgSpan} ${actionXlSpan}`}>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        {/* Reset Button */}
                        <button
                            type="button"
                            onClick={onReset}
                            className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <X size={16} />
                            {resetLabel}
                        </button>

                        {/* Search Button */}
                        <button
                            type="submit"
                            className={`flex-1 sm:flex-none h-10 px-6 ${buttonColors[accentColor]} text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm`}
                        >
                            <Search size={16} />
                            {searchLabel}
                        </button>
                    </div>

                    {/* Create Button - rendered if onCreate is provided */}
                    {onCreate && (
                        <button
                            type="button"
                            onClick={onCreate}
                            className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Plus size={18} />
                            {createLabel}
                        </button>
                    )}

                    {/* Additional Action Buttons */}
                    {actionButtons && (
                         <div className="w-full md:w-auto flex flex-wrap gap-2">
                            {actionButtons}
                         </div>
                    )}
                </div>
            </div>
        </form>
    );
}

export default FilterFormBuilder;
