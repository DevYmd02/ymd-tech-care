/**
 * @file vendor/index.ts
 * @description Vendor Module - Centralized exports
 * @module vendor
 */

// Services
export { VendorService } from './services/vendor.service';

// Types
export * from './types/vendor-types';

// Hooks
export { useVendorForm } from './hooks/useVendorForm';

// Pages (lazy loaded in App.tsx)
// export { default as VendorDashboard } from './pages/VendorDashboard';
// export { default as VendorList } from './pages/VendorList';
// export { default as VendorForm } from './pages/VendorForm';
