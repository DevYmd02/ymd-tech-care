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
import { FilterField, type FilterFieldType, type SelectOption } from './FilterField';

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
    };
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
    columns = { sm: 2, md: 4, lg: 5 },
}: FilterFormBuilderProps<TFilters, TFilterKeys>): React.ReactElement {
    // Build responsive grid classes
    const gridClasses = [
        'grid',
        'grid-cols-1',
        columns.sm ? `sm:grid-cols-${columns.sm}` : 'sm:grid-cols-2',
        columns.md ? `md:grid-cols-${columns.md}` : 'md:grid-cols-4',
        columns.lg ? `lg:grid-cols-${columns.lg}` : 'lg:grid-cols-5',
        'gap-4',
        'w-full',
    ].join(' ');

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

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className={gridClasses}>
                {/* Render filter fields from config */}
                {config.map((field) => {
                    const value = (filters as Record<string, unknown>)[field.name];
                    const stringValue = value !== undefined && value !== null ? String(value) : '';
                    
                    // Handle column span
                    const colSpanClass = field.colSpan && field.colSpan > 1 
                        ? `col-span-${field.colSpan}` 
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

                {/* Action Buttons - inline with last field row */}
                <div className="flex items-end gap-2 flex-nowrap min-w-0">
                    {/* Search Button */}
                    <button
                        type="submit"
                        className={`px-4 py-2 ${buttonColors[accentColor]} text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm`}
                    >
                        <Search size={16} />
                        {searchLabel}
                    </button>

                    {/* Reset Button */}
                    <button
                        type="button"
                        onClick={onReset}
                        className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <X size={16} />
                        {resetLabel}
                    </button>

                    {/* Create Button - rendered if onCreate is provided */}
                    {onCreate && (
                        <button
                            type="button"
                            onClick={onCreate}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Plus size={18} />
                            {createLabel}
                        </button>
                    )}

                    {/* Additional Action Buttons */}
                    {actionButtons}
                </div>
            </div>
        </form>
    );
}

export default FilterFormBuilder;
