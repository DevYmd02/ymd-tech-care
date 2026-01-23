/**
 * @file IMasterDataService.ts
 * @description Interface for Master Data Service - defines standard methods for both Mock and Real implementations
 */

import type {
  BranchMaster,
  WarehouseMaster,
  ItemMaster,
  UnitMaster,
  CostCenter,
  Project,
  ProductCategoryListItem,
  ItemTypeListItem,
} from '../../types/master-data-types';

export interface IMasterDataService {
  getBranches(): Promise<BranchMaster[]>;
  getWarehouses(): Promise<WarehouseMaster[]>;
  getItems(): Promise<ItemMaster[]>;
  getUnits(): Promise<UnitMaster[]>;
  getCostCenters(): Promise<CostCenter[]>;
  getProjects(): Promise<Project[]>;
  getProductCategories(): Promise<ProductCategoryListItem[]>;
  getItemTypes(): Promise<ItemTypeListItem[]>;
}
