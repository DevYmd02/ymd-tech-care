/**
 * @file master-data-types.ts
 * @description Barrel file for backward compatibility - re-exports from modular type files
 * @deprecated Import directly from the specific type files instead:
 *   - '@/shared/types/common-master.types' for base types
 *   - '@/shared/types/approval-types' for approval workflow
 *   - '@/modules/master-data/company/types/branch-types' for branch types
 *   - '@/modules/master-data/company/types/company-structure.types' for company org types
 *   - '@/modules/master-data/sales/types/sales-structure.types' for sales org types
 *   - '@/modules/master-data/inventory/types/warehouse-types' for warehouse types
 *   - '@/modules/master-data/inventory/types/product-types' for product/item types
 *   - '@/core/types/project-types' for project/cost center types
 */

// ====================================================================================
// RE-EXPORTS FROM SHARED
// ====================================================================================
export * from '@/shared/types/common-master.types';
export * from '@/shared/types/approval-types';

// ====================================================================================
// RE-EXPORTS FROM COMPANY MODULE
// ====================================================================================
export * from '@/modules/master-data/company/types/branch-types';
export * from '@/modules/master-data/company/types/company-structure.types';

// ====================================================================================
// RE-EXPORTS FROM SALES MODULE
// ====================================================================================
export * from '@/modules/master-data/sales/types/sales-structure.types';

// ====================================================================================
// RE-EXPORTS FROM INVENTORY MODULE
// ====================================================================================
export * from '@/modules/master-data/inventory/types/warehouse-types';
export * from '@/modules/master-data/inventory/types/product-types';

// ====================================================================================
// RE-EXPORTS FROM CORE
// ====================================================================================
export * from '@/core/types/project-types';