import type {
  BranchListItem,
  WarehouseListItem,
  UnitListItem,
  CostCenter,
  Project,
  ProductCategoryListItem,
  ItemTypeListItem,
  ItemListItem,
  DepartmentListItem,
} from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';

// Import services
import { BranchService } from '../company/services/branch.service';
import { WarehouseService } from '../inventory/services/warehouse.service';
import { ItemMasterService } from '../inventory/services/item-master.service';
import { UnitService } from '../inventory/services/unit.service';
import { CostCenterService } from '../accounting/services/cost-center.service';
import { ProjectService } from '../project/services/project.service';
import { ProductCategoryService } from '../inventory/services/product-category.service';
import { ItemTypeService } from '../inventory/services/item-type.service';
import { DepartmentService } from '../company/services/company.service';

export const MasterDataService = {
  getBranches: async (): Promise<BranchListItem[]> => {
    const response = await BranchService.getList();
    return response.items;
  },

  getWarehouses: async (): Promise<WarehouseListItem[]> => {
    const response = await WarehouseService.getAll();
    return response.items;
  },

  getItems: async (query?: string, vendorId?: number | string): Promise<ItemListItem[]> => {
    const response = await ItemMasterService.getAll({ q: query, vendor_id: vendorId ? String(vendorId) : undefined, limit: 50 });
    return response.items;
  },

  getUnits: async (): Promise<UnitListItem[]> => {
    const response = await UnitService.getAll();
    return response.items;
  },

  getCostCenters: async (): Promise<CostCenter[]> => {
    return CostCenterService.getList();
  },

  getDepartments: async (): Promise<DepartmentListItem[]> => {
    try {
      const response = await DepartmentService.getList({ limit: 100 });
      return response?.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getDepartments error:', error);
      return [];
    }
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
