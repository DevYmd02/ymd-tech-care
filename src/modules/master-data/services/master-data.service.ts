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
    try {
      const response = await BranchService.getList();
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getBranches failed:', error);
      return [];
    }
  },

  getWarehouses: async (): Promise<WarehouseListItem[]> => {
    try {
      const response = await WarehouseService.getAll();
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getWarehouses failed:', error);
      return [];
    }
  },

  getItems: async (query?: string, vendorId?: number | string): Promise<ItemListItem[]> => {
    try {
      const response = await ItemMasterService.getAll({ q: query, vendor_id: vendorId ? String(vendorId) : undefined, limit: 50 });
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getItems failed:', error);
      return [];
    }
  },

  getUnits: async (): Promise<UnitListItem[]> => {
    try {
      const response = await UnitService.getAll();
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getUnits failed:', error);
      return [];
    }
  },

  getCostCenters: async (): Promise<CostCenter[]> => {
    try {
      return await CostCenterService.getList();
    } catch (error) {
      logger.error('[MasterDataService] getCostCenters failed:', error);
      return [];
    }
  },

  getDepartments: async (): Promise<DepartmentListItem[]> => {
    try {
      const response = await DepartmentService.getList({ limit: 100 });
      return response?.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getDepartments failed:', error);
      return [];
    }
  },

  getProjects: async (): Promise<Project[]> => {
    try {
      return await ProjectService.getList();
    } catch (error) {
      logger.error('[MasterDataService] getProjects failed:', error);
      return [];
    }
  },

  getProductCategories: async (): Promise<ProductCategoryListItem[]> => {
    try {
      const response = await ProductCategoryService.getAll();
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getProductCategories failed:', error);
      return [];
    }
  },

  getItemTypes: async (): Promise<ItemTypeListItem[]> => {
    try {
      const response = await ItemTypeService.getAll();
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getItemTypes failed:', error);
      return [];
    }
  }
};
