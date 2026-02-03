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
  // PO
  MOCK_POS,
  // GRN
  MOCK_GRNS,
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
// PRODUCT LOOKUP (Item Search)
// ====================================================================================
export { MOCK_PRODUCTS, type ProductLookup, type Product } from './products';
