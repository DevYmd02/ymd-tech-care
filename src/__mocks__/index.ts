/**
 * @file index.ts
 * @description Barrel export สำหรับ Mock Data
 * 
 * @structure
 * - vendorMocks.ts: Vendor Master (SSOT)
 * - masterDataMocks.ts: Branch, Warehouse, Unit, ProductCategory, ItemType, Item
 * - procurementMocks.ts: PR → RFQ → QT → QC (linked flow)
 * - approvalFlowMocks.ts: Approval configuration
 */

// ====================================================================================
// VENDOR MASTER (Single Source of Truth)
// ====================================================================================
export {
  MOCK_VENDORS,
  getVendorById,
  getVendorByCode,
  getActiveVendors,
} from './vendorMocks';

// ====================================================================================
// MASTER DATA
// ====================================================================================
export {
  mockBranches,
  mockBranchDropdown,
  mockWarehouses,
  mockProductCategories,
  mockItemTypes,
  mockUnits,
  mockItems,
  mockUOMConversions,
  mockItemBarcodes,
} from './masterDataMocks';

// ====================================================================================
// PROCUREMENT FLOW (PR → RFQ → QT → QC)
// ====================================================================================
export {
  // PR
  MOCK_PRS,
  MOCK_PR_LINES,
  getApprovedPRs,
  // RFQ
  MOCK_RFQS,
  MOCK_RFQ_LINES,
  MOCK_RFQ_VENDORS,
  getRFQByPRId,
  getRFQLinesByRFQId,
  getVendorsByRFQId,
  // QT
  MOCK_QTS,
  getQTsByRFQNo,
  // QC
  MOCK_QCS,
  getQCByPRId,
} from './procurementMocks';

// ====================================================================================
// APPROVAL FLOW
// ====================================================================================
export {
  MOCK_APPROVAL_FLOWS,
  MOCK_APPROVERS,
  getMockFlowWithSteps,
} from './approvalFlowMocks';

// ====================================================================================
// LEGACY EXPORTS (For backward compatibility - will be deprecated)
// ====================================================================================

// Re-export from procurementMocks for backward compatibility with existing imports
export { MOCK_PRS as RELATED_PRS } from './procurementMocks';
export { MOCK_RFQS as RELATED_RFQS } from './procurementMocks';
export { MOCK_RFQ_LINES as RELATED_RFQ_LINES } from './procurementMocks';
export { MOCK_RFQ_VENDORS as RELATED_RFQ_VENDORS } from './procurementMocks';
export { MOCK_VENDORS as RELATED_VENDORS } from './vendorMocks';

// ====================================================================================
// PRODUCT LOOKUP (Item Search)
// ====================================================================================
export { MOCK_PRODUCTS, type ProductLookup, type Product } from './products';
