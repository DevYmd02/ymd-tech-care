import type {
  BranchListItem,
  WarehouseListItem,
  ItemMaster,
  UnitListItem,
  CostCenter,
  Project,
  ProductCategoryListItem,
  ItemTypeListItem,
} from '@/types/master-data-types';

// Import services
import { BranchService } from '@/services/core/branch.service';
import { WarehouseService } from '@/services/inventory/warehouse.service';
import { ItemMasterService } from '@/services/inventory/item-master.service';
import { UnitService } from '@/services/inventory/unit.service';
import { CostCenterService } from '@/services/core/cost-center.service';
import { ProjectService } from '@/services/core/project.service';
import { ProductCategoryService } from '@/services/inventory/product-category.service';
import { ItemTypeService } from '@/services/inventory/item-type.service';

export const MasterDataService = {
  getBranches: async (): Promise<BranchListItem[]> => {
    return BranchService.getList();
  },

  getWarehouses: async (): Promise<WarehouseListItem[]> => {
    return WarehouseService.getList();
  },

  getItems: async (): Promise<ItemMaster[]> => {
    return ItemMasterService.getAll();
  },

  getUnits: async (): Promise<UnitListItem[]> => {
    return UnitService.getList();
  },

  getCostCenters: async (): Promise<CostCenter[]> => {
    return CostCenterService.getList();
  },

  getProjects: async (): Promise<Project[]> => {
    return ProjectService.getList();
  },

  getProductCategories: async (): Promise<ProductCategoryListItem[]> => {
    return ProductCategoryService.getList();
  },

  getItemTypes: async (): Promise<ItemTypeListItem[]> => {
    return ItemTypeService.getList();
  }
};
