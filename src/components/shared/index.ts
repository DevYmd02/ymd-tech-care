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
  ActiveStatusBadge,
  VendorStatusBadge,
} from './StatusBadge';
export type { StatusBadgeProps, ActiveStatusBadgeProps, VendorStatusBadgeProps } from './StatusBadge';

// Modals
export { ApprovalModal } from './ApprovalModal';
export { ProductSearchModal } from './ProductSearchModal';
export { SearchModal } from './SearchModal';
export { VendorSearchModal } from './VendorSearchModal';

// Layouts
export { WindowFormLayout } from './WindowFormLayout';
export { SystemAlert } from './SystemAlert';

// Utilities
export { ErrorBoundary } from './ErrorBoundary';