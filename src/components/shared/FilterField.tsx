/**
 * @file FilterField.tsx
 * @description Reusable filter field component สำหรับ Search Forms
 * ใช้ร่วมกับ PageListLayout เพื่อ standardize search forms
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { styles } from '../../constants';

// ====================================================================================
// TYPES
// ====================================================================================

export type FilterFieldType = 'text' | 'select' | 'date';

export interface SelectOption {
    value: string;
    label: string;
}

export interface FilterFieldProps {
    /** Field label */
    label: string;
    /** Field type */
    type?: FilterFieldType;
    /** Current value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Options for select type */
    options?: SelectOption[];
    /** Accent color for focus ring */
    accentColor?: 'emerald' | 'blue' | 'purple' | 'teal' | 'indigo';
    /** Disabled state */
    disabled?: boolean;
}

// ====================================================================================
// COLOR MAPPINGS
// ====================================================================================

const ringColors = {
    emerald: 'ring-emerald-500 focus:ring-emerald-500',
    blue: 'ring-blue-500 focus:ring-blue-500',
    purple: 'ring-purple-500 focus:ring-purple-500',
    teal: 'ring-teal-500 focus:ring-teal-500',
    indigo: 'ring-indigo-500 focus:ring-indigo-500',
};

// ====================================================================================
// COMPONENT
// ====================================================================================

export const FilterField: React.FC<FilterFieldProps> = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    options = [],
    accentColor = 'emerald',
    disabled = false,
}) => {
    const inputClass = styles.input.replace('ring-blue-500', ringColors[accentColor]);
    const labelClass = styles.label;

    return (
        <div>
            <label className={labelClass}>{label}</label>
            {type === 'select' ? (
                <div className="relative">
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        className={`${inputClass} appearance-none pr-8`}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                </div>
            ) : type === 'date' ? (
                <div className="relative">
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        className={inputClass}
                    />
                </div>
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClass}
                />
            )}
        </div>
    );
};

// ====================================================================================
// FILTER ACTION BUTTONS
// ====================================================================================

export interface FilterActionsProps {
    onSearch: () => void;
    onClear: () => void;
    searchLabel?: string;
    clearLabel?: string;
    accentColor?: 'emerald' | 'blue' | 'purple' | 'teal' | 'indigo';
}

const buttonColors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
};

export const FilterActions: React.FC<FilterActionsProps> = ({
    onSearch,
    onClear,
    searchLabel = 'ค้นหา',
    clearLabel = 'ล้าง',
    accentColor = 'emerald',
}) => {
    return (
        <div className="flex items-end gap-2">
            <button
                onClick={onSearch}
                className={`h-10 px-6 ${buttonColors[accentColor]} text-white rounded-md font-semibold transition-colors shadow-sm`}
            >
                {searchLabel}
            </button>
            <button
                onClick={onClear}
                className="h-10 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
                {clearLabel}
            </button>
        </div>
    );
};

export default FilterField;
