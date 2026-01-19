/**
 * @file index.ts
 * @description Barrel export สำหรับ Mock Data
 * @note vendors.ts และ vendorDropdown.ts ต้อง import ตรงๆ จากแต่ละไฟล์
 *       เพราะมี dependency กับ types/vendor-types.ts
 */

// Export products mock (ไม่มี external dependencies)
export * from './products';

// New exports (ตาม Database Schema)
export { MOCK_PR_HEADERS, MOCK_COST_CENTERS, MOCK_PROJECTS } from './prList';
export { MOCK_RFQS, getRFQStats } from './rfqMocks';

// Legacy exports (for backward compatibility)
export { MOCK_PR_LIST } from './prList';
export type { PRItem, ApproverInfo } from './prList';

// Note: For vendors, import directly from './vendors' or './vendorDropdown'
// NOT from this index file to avoid circular dependency issues
