import type {
  BranchListItem,
  WarehouseListItem,
  UnitListItem,
  CostCenter,
  Project,
  ProductCategoryListItem,
  ItemTypeListItem,
  ItemListItem,
} from '@/modules/master-data/types/master-data-types';

// Import services
import { BranchService } from '@/core/api/branch.service';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { CostCenterService } from '@/core/api/cost-center.service';
import { ProjectService } from '@/core/api/project.service';
import { ProductCategoryService } from '@/modules/master-data/inventory/services/product-category.service';
import { ItemTypeService } from '@/modules/master-data/inventory/services/item-type.service';

export const MasterDataService = {
  getBranches: async (): Promise<BranchListItem[]> => {
    return BranchService.getList();
  },

  getWarehouses: async (): Promise<WarehouseListItem[]> => {
    return WarehouseService.getList();
  },

  getItems: async (): Promise<ItemListItem[]> => {
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
