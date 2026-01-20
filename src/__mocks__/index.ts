/**
 * @file index.ts
 * @description Barrel export สำหรับ Mock Data
 * 
 * @structure
 * - masterDataMocks.ts: Branch, Warehouse, Unit, ProductCategory, ItemType
 * - products.ts: Product mock สำหรับ ProductSearchModal
 * - relatedMocks.ts: Vendor → PR → RFQ (linked data)
 */

// Master Data Mocks
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

// Product Mocks
export { MOCK_PRODUCTS, type Product } from './products';

// Related Mocks (Vendor → PR → RFQ linked)
export {
  RELATED_VENDORS,
  RELATED_PRS,
  RELATED_RFQS,
  RELATED_RFQ_LINES,
  RELATED_RFQ_VENDORS,
  getApprovedPRs,
  getRFQByPRId,
  getVendorsByRFQId,
  getVendorById,
} from './relatedMocks';
