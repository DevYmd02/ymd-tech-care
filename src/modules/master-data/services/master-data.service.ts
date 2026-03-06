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
  Currency,
} from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';

// Import services
import { BranchService } from '@/modules/master-data/company/services/branch.service';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { CostCenterService } from '@/modules/master-data/accounting/services/cost-center.service';
import { ProjectService } from '@/modules/master-data/project/services/project.service';
import { ProductCategoryService } from '@/modules/master-data/inventory/services/product-category.service';
import { ItemTypeService } from '@/modules/master-data/inventory/services/item-type.service';
import { DepartmentService } from '@/modules/master-data/company/services/company.service';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';

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

  toggleBranchStatus: async (id: string, isActive: boolean) => {
    try {
      return await BranchService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleBranchStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
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

  toggleWarehouseStatus: async (id: string, isActive: boolean) => {
    try {
      return await WarehouseService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleWarehouseStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
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

  toggleUnitStatus: async (id: string, isActive: boolean) => {
    try {
      return await UnitService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleUnitStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
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

  toggleCostCenterStatus: async (id: string, isActive: boolean) => {
    try {
      return await CostCenterService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleCostCenterStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
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

  toggleProjectStatus: async (id: string, isActive: boolean) => {
    try {
      return await ProjectService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleProjectStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
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

  toggleCategoryStatus: async (id: string, isActive: boolean) => {
    try {
      return await ProductCategoryService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleCategoryStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
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
  },

  getCurrencies: async (): Promise<Currency[]> => {
    try {
      const response = await CurrencyService.getCurrencies();
      return response?.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getCurrencies failed:', error);
      return [];
    }
  }
};
