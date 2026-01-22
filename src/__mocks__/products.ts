/**
 * @file products.ts
 * @description Product Lookup Interface & Data (Derived from masterDataMocks.ts)
 * 
 * @note This file now derives data from mockItems (SSOT) to avoid split-brain issues.
 *       Interface ProductLookup exists for backward compatibility with existing components.
 */

import { mockItems } from './masterDataMocks';

// =============================================================================
// INTERFACE - Item Lookup (ค้นหาสินค้า)
// =============================================================================

/**
 * ProductLookup - สำหรับ Item Lookup Modal
 * Maps to ItemListItem structure from masterDataMocks
 */
export interface ProductLookup {
    /** รหัสสินค้า (e.g., ITEM-001) */
    item_code: string;
    /** ชื่อสินค้า */
    item_name: string;
    /** หน่วยนับ */
    unit: string;
    /** ราคา/หน่วย */
    unit_price: number;
}

// =============================================================================
// DERIVED DATA FROM SSOT (masterDataMocks.ts)
// =============================================================================

/**
 * MOCK_PRODUCTS - Derived from mockItems (Single Source of Truth)
 * Maps ItemListItem to ProductLookup format for backward compatibility
 */
export const MOCK_PRODUCTS: ProductLookup[] = mockItems.map(item => ({
    item_code: item.item_code,
    item_name: item.item_name,
    unit: item.unit_name,
    unit_price: 0, // Default price - can be enhanced later with price lookup
}));

// Legacy export for backward compatibility
export type Product = ProductLookup;
