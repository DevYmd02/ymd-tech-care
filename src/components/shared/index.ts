/**
 * @file index.ts
 * @description Barrel export สำหรับ Shared Components
 * 
 * shared/ = Higher-level business components ที่ใช้ร่วมกันหลายที่
 * ui/ = Basic UI primitives (Input, Label, Card, Button, Toast)
 */

// Summary & Stats
export { SummaryCard } from './SummaryCard';
export type { SummaryCardProps } from './SummaryCard';

export { StatCard, QuickAccessCard } from './StatCard';
export type { StatCardProps, QuickAccessCardProps } from './StatCard';

// Page Layout
export { PageBanner } from './PageBanner';
export type { PageBannerProps } from './PageBanner';

// Status Badges
export {
  StatusBadge,
  PRStatusBadge,
  RFQStatusBadge,
  QTStatusBadge,
  QCStatusBadge,
  ActiveStatusBadge,
  VendorStatusBadge,
  ModuleStatusBadge,
} from './StatusBadge';
export type { StatusBadgeProps, ActiveStatusBadgeProps, VendorStatusBadgeProps, ModuleStatusBadgeProps } from './StatusBadge';

// Modals
export { ApprovalModal } from './ApprovalModal';
export { ProductSearchModal } from './ProductSearchModal';
export { SearchModal } from './SearchModal';
export { VendorSearchModal } from './VendorSearchModal';

// Layouts
export { WindowFormLayout } from './WindowFormLayout';
export { PageListLayout } from './PageListLayout';
export type { PageListLayoutProps, AccentColor } from './PageListLayout';
export { SystemAlert } from './SystemAlert';

// Filter Components
export { FilterField, FilterActions } from './FilterField';
export type { FilterFieldProps, FilterActionsProps, SelectOption } from './FilterField';

// Filter Form Builder
export { FilterFormBuilder } from './FilterFormBuilder';
export type { FilterFieldConfig, FilterFormBuilderProps } from './FilterFormBuilder';
export { createFilterChangeHandler } from './filterFormUtils';
export type { FilterChangeHandlers } from './filterFormUtils';

// Utilities
export { ErrorBoundary } from './ErrorBoundary';

// Tab Panel
export { default as TabPanel } from './TabPanel';
export type { TabItem, TabPanelProps } from './TabPanel';
export { DOCUMENT_FORM_TABS } from './tabConstants';