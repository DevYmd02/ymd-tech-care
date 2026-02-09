/**
 * @file index.ts
 * @description Barrel export สำหรับ Shared Components
 * 
 * shared/ = Higher-level business components ที่ใช้ร่วมกันหลายที่
 * ui/ = Basic UI primitives (Input, Label, Card, Button, Toast)
 */

// Summary & Stats
// Basic UI Elements moved to @ui
// export { StatCard } from './StatCard'; // Moved to @ui
// export { SummaryCard } from './SummaryCard'; // Moved to @ui

// export { SummaryCard } from './SummaryCard'; // MOVED TO @ui
// export type { SummaryCardProps } from './SummaryCard';

// export { QuickAccessCard } from './StatCard'; // MOVED TO @ui
// export type { StatCardProps, QuickAccessCardProps } from './StatCard';

// Page Layout
// export { PageBanner } from './PageBanner'; // MOVED TO @layout
// export type { PageBannerProps } from './PageBanner';

// Status Badges
// MOVED TO @ui/StatusBadge

// Modals
export { ApprovalModal } from './ApprovalModal';
export { ProductSearchModal } from './ProductSearchModal';
export { SearchModal } from './SearchModal';
export { VendorSearchModal } from './VendorSearchModal';

// Layouts
// export { WindowFormLayout } from './WindowFormLayout'; // Moved to @layout
// export { PageListLayout } from './PageListLayout'; // MOVED TO @layout
// export type { PageListLayoutProps, AccentColor } from './PageListLayout';
// export { SystemAlert } from './SystemAlert'; // MOVED TO @ui

// Filter Components
// Filter Components
// export { FilterField, FilterActions } from './FilterField'; // MOVED TO @ui
// export type { FilterFieldProps, FilterActionsProps, SelectOption } from './FilterField';

// Filter Form Builder
export { FilterFormBuilder } from './FilterFormBuilder';
export type { FilterFieldConfig, FilterFormBuilderProps } from './FilterFormBuilder';
export { createFilterChangeHandler } from './filterFormUtils';
export type { FilterChangeHandlers } from './filterFormUtils';

// Utilities
// export { ErrorFallback, ErrorBoundary } from './ErrorBoundary'; // MOVED TO @system
// export { GlobalLoading } from './GlobalLoading'; // MOVED TO @system

// Tab Panel
// export { default as TabPanel } from './TabPanel'; // MOVED TO @layout
// export type { TabItem, TabPanelProps } from './TabPanel';
export { DOCUMENT_FORM_TABS } from './tabConstants';

// Base UI
// export { PageLoader } from './PageLoader'; // MOVED TO @layout
// export { SmartTable } from './SmartTable'; // MOVED TO @ui
