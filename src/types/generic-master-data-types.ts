/**
 * @file generic-master-data-types.ts
 * @description Generic types for reusable Master Data components
 * @usage import type { GenericMasterDataConfig } from '@/types/generic-master-data-types';
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// ====================================================================================
// GENERIC CONFIGURATION TYPES
// ====================================================================================

/**
 * Column configuration for generic table
 */
export interface GenericTableColumn<T> {
    /** Column header label */
    header: string;
    /** Accessor function to get cell value from data item */
    accessor: (item: T) => ReactNode;
    /** Optional CSS classes for the column */
    className?: string;
    /** Hide column on mobile (md breakpoint) */
    hideOnMobile?: boolean;
}

/**
 * Configuration for GenericMasterDataList component
 */
export interface GenericMasterDataListConfig<T> {
    /** Module title (e.g., "กำหนดรหัสหมวดสินค้า") */
    title: string;
    /** Module subtitle/description */
    subtitle: string;
    /** Icon component from lucide-react */
    icon: LucideIcon;
    /** Button text for creating new item */
    createButtonText: string;
    /** Search input placeholder */
    searchPlaceholder: string;
    /** Empty state message */
    emptyMessage: string;
    /** Delete confirmation message */
    deleteConfirmMessage: string;
    /** Table column definitions */
    columns: GenericTableColumn<T>[];
}

/**
 * Props for GenericMasterDataList component
 */
export interface GenericMasterDataListProps<T> {
    /** Configuration object */
    config: GenericMasterDataListConfig<T>;
    /** Data items to display */
    items: T[];
    /** Loading state */
    isLoading: boolean;
    /** Search term */
    searchTerm: string;
    /** Status filter */
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
    /** Current page number */
    currentPage: number;
    /** Rows per page */
    rowsPerPage: number;
    /** Total number of items */
    totalItems: number;
    /** Callback when search term changes */
    onSearchChange: (term: string) => void;
    /** Callback when status filter changes */
    onStatusFilterChange: (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Callback when rows per page changes */
    onRowsPerPageChange: (rows: number) => void;
    /** Callback when create button is clicked */
    onCreate: () => void;
    /** Callback when edit button is clicked */
    onEdit: (id: string) => void;
    /** Callback when delete button is clicked */
    onDelete: (id: string) => void;
    /** Callback when refresh button is clicked */
    onRefresh: () => void;
    /** Function to extract ID from item */
    getItemId: (item: T) => string;
}

// ====================================================================================
// GENERIC FORM TYPES
// ====================================================================================

/**
 * Field type for generic form
 */
export type GenericFieldType = 'text' | 'checkbox' | 'select' | 'textarea' | 'search';

/**
 * Field configuration for generic form
 */
export interface GenericFormField<T> {
    /** Field name/key */
    name: keyof T;
    /** Field label */
    label: string;
    /** Field type */
    type: GenericFieldType;
    /** Placeholder text */
    placeholder?: string;
    /** Is field required */
    required?: boolean;
    /** Is field read-only */
    readOnly?: boolean;
    /** Options for select field */
    options?: Array<{ value: string; label: string }>;
    /** Custom render function */
    render?: (value: unknown, onChange: (value: unknown) => void) => ReactNode;
    /** Grid column span (1-2) */
    colSpan?: 1 | 2;
    /** Show search button next to field */
    showSearchButton?: boolean;
    /** Search button click handler */
    onSearchClick?: () => void;
}

/**
 * Section configuration for grouping form fields
 */
export interface GenericFormSection<T> {
    /** Section title (optional) */
    title?: string;
    /** Fields in this section */
    fields: GenericFormField<T>[];
}

/**
 * Configuration for GenericMasterDataForm component
 */
export interface GenericMasterDataFormConfig<T> {
    /** Module title */
    title: string;
    /** Icon component */
    icon: LucideIcon;
    /** Form sections */
    sections: GenericFormSection<T>[];
    /** Quick view fields (shown at top) */
    quickViewFields?: Array<keyof T>;
}

/**
 * Props for GenericMasterDataForm component
 */
export interface GenericMasterDataFormProps<T> {
    /** Configuration object */
    config: GenericMasterDataFormConfig<T>;
    /** Form data */
    formData: T;
    /** Is saving state */
    isSaving: boolean;
    /** Save error message */
    saveError: string | null;
    /** Is edit mode */
    isEditMode: boolean;
    /** Callback when form data changes */
    onChange: (field: keyof T, value: unknown) => void;
    /** Callback when New button is clicked */
    onNew: () => void;
    /** Callback when Save button is clicked */
    onSave: () => void;
    /** Callback when Delete button is clicked */
    onDelete: () => void;
    /** Callback when Find button is clicked */
    onFind: () => void;
    /** Callback when Close button is clicked */
    onClose: () => void;
}

// ====================================================================================
// UTILITY TYPES
// ====================================================================================

/**
 * Base interface that all master data items should extend
 */
export interface GenericMasterDataItem {
    is_active: boolean;
    created_at: string;
}

/**
 * Generic filter state
 */
export interface GenericFilterState {
    searchTerm: string;
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
    currentPage: number;
    rowsPerPage: number;
}
