/**
 * @file master-data-types.ts
 * @description Barrel file for backward compatibility - re-exports from modular type files
 * @deprecated Import directly from the specific type files instead:
 *   - '@/shared/types/common-master.types' for base types
 *   - '@/shared/types/approval-types' for approval workflow
 *   - '@/modules/master-data/company/types/branch-types' for branch types
 *   - '@/modules/master-data/company/types/[entity].types' for company org types
 *   - '@/modules/master-data/sales/types/sales-structure.types' for sales org types
 *   - '@/modules/master-data/inventory/types/warehouse-types' for warehouse types
 *   - '@/modules/master-data/inventory/types/product-types' for product/item types
 *   - '@/modules/master-data/project/types/project-types' for project/cost center types
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
export * from '@/modules/master-data/company/types/employee-side.types';
export * from '@/modules/master-data/company/types/employee-dept.types';
export * from '@/modules/master-data/company/types/job.types';
export * from '@/modules/master-data/company/types/position.types';
export * from '@/modules/master-data/company/types/employee-group.types';
export * from '@/modules/master-data/company/types/employee.types';

// ====================================================================================
// RE-EXPORTS FROM SALES MODULE
// ====================================================================================
export * from '@master-data/sales/pages/area/types/area.types';
export * from '@master-data/sales/pages/channel/types/channel.types';
export * from '@master-data/sales/pages/target/types/sale-period.types';
export * from '@master-data/sales/pages/target/types/sale-target.types';

// Backward compatibility aliases
import { type SaleAreaListItem } from '@master-data/sales/pages/area/types/area.types';
import { type SalePeriodListItem } from '@master-data/sales/pages/target/types/sale-period.types';
export type SalesZoneListItem = SaleAreaListItem;
export type SalesTargetListItem = SalePeriodListItem;

// ====================================================================================
// RE-EXPORTS FROM INVENTORY MODULE
// ====================================================================================
export * from '@/modules/master-data/inventory/types/warehouse-types';
export * from '@/modules/master-data/inventory/types/product-types';

// ====================================================================================
// RE-EXPORTS FROM CORE
// ====================================================================================
export * from '@/modules/master-data/project/types/project-types';

// ====================================================================================
// RE-EXPORTS FROM CURRENCY MODULE
// ====================================================================================
export * from '@/modules/master-data/currency/types/currency-types';