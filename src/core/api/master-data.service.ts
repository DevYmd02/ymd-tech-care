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
    const response = await BranchService.getList();
    return response.items;
  },

  getWarehouses: async (): Promise<WarehouseListItem[]> => {
    const response = await WarehouseService.getAll();
    return response.items;
  },

  getItems: async (query?: string, vendorId?: string): Promise<ItemListItem[]> => {
    const response = await ItemMasterService.getAll({ q: query, vendor_id: vendorId, limit: 50 });
    return response.items;
  },

  getUnits: async (): Promise<UnitListItem[]> => {
    const response = await UnitService.getAll();
    return response.items;
  },

  getCostCenters: async (): Promise<CostCenter[]> => {
    return CostCenterService.getList();
  },

  getProjects: async (): Promise<Project[]> => {
    return ProjectService.getList();
  },

  getProductCategories: async (): Promise<ProductCategoryListItem[]> => {
    const response = await ProductCategoryService.getAll();
    return response.items;
  },

  getItemTypes: async (): Promise<ItemTypeListItem[]> => {
    const response = await ItemTypeService.getAll();
    return response.items;
  }
};
