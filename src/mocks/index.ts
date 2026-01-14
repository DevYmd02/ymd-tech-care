/**
 * @file index.ts
 * @description Barrel export สำหรับ Mock Data
 */

export * from './vendors';
export * from './products';
export * from './vendorDropdown';

// New exports (ตาม Database Schema)
export { MOCK_PR_HEADERS, MOCK_COST_CENTERS, MOCK_PROJECTS } from './prList';

// Legacy exports (for backward compatibility)
export { MOCK_PR_LIST } from './prList';
export type { PRItem, ApproverInfo } from './prList';
