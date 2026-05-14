import type { AxiosRequestConfig } from 'axios';
import type {
  BranchListItem,
  WarehouseListItem,
  UOMListItem,
  CostCenter,
  Project,
  ProductCategoryListItem,
  ItemTypeListItem,
  ItemListItem,
  DepartmentListItem,
  Currency,
  SaleAreaListItem,
} from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';

// Import services
import { BranchService } from '@/modules/master-data/company/services/org-branch.service';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UOMService } from '@/modules/master-data/inventory/services/uom.service';
import { CostCenterService } from '@/modules/master-data/accounting/services/cost-center.service';
import { ProjectService } from '@/modules/master-data/project/services/project.service';
import { ProductCategoryService } from '@/modules/master-data/inventory/services/product-category.service';
import { ItemTypeService } from '@/modules/master-data/inventory/services/item-type.service';
import { EmployeeDeptService as DepartmentService } from '@/modules/master-data/company/services/employee-dept.service';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';
import { SaleAreaService } from '@/modules/master-data/sales/pages/area/services/area.service';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { OrgEmployeeService as EmployeeService } from '@/modules/master-data/company/services/employee.service';
import type { EmployeeListItem } from '@/modules/master-data/company/types/employee.types';

import { PriceLevelNameService } from '@/modules/master-data/sales/pages/price-level-name/services/price-level-name.service';
import type { PriceLevelName } from '@/modules/master-data/sales/pages/price-level-name/types/price-level-name.types';
import { normalizeListResponse } from '@/shared/utils/apiUtils';

export const MasterDataService = {
  // ... existing methods ...
  getPriceLevelNames: async (config?: AxiosRequestConfig): Promise<PriceLevelName[]> => {
    try {
      const response = await PriceLevelNameService.getList(config);
      return normalizeListResponse<PriceLevelName>(response).items;
    } catch (error) {
      logger.error('[MasterDataService] getPriceLevelNames failed:', error);
      return [];
    }
  },

  getCustomers: async (config?: AxiosRequestConfig): Promise<CustomerMaster[]> => {
    try {
      const response = await CustomerService.getList({ limit: 1000 }, config);
      return response.data || []; // CustomerService uses DataListResponse (data)
    } catch (error) {
      logger.error('[MasterDataService] getCustomers failed:', error);
      return [];
    }
  },

  getBranches: async (config?: AxiosRequestConfig): Promise<BranchListItem[]> => {
    try {
      const response = await BranchService.getList(undefined, config);
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getBranches failed:', error);
      return [];
    }
  },

  toggleBranchStatus: async (id: number, isActive: boolean) => {
    try {
      return await BranchService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleBranchStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
    }
  },

  getWarehouses: async (config?: AxiosRequestConfig): Promise<WarehouseListItem[]> => {
    try {
      const response = await WarehouseService.getAll(undefined, config);
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getWarehouses failed:', error);
      return [];
    }
  },

  toggleWarehouseStatus: async (id: number, isActive: boolean) => {
    try {
      return await WarehouseService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleWarehouseStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
    }
  },

  getItems: async (query?: string, vendorId?: number | string, config?: AxiosRequestConfig): Promise<ItemListItem[]> => {
    try {
      const response = await ItemMasterService.getAll(
        { q: query, vendor_id: vendorId ? String(vendorId) : undefined, limit: 50 },
        config
      );
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getItems failed:', error);
      return [];
    }
  },

  getUOMs: async (config?: AxiosRequestConfig): Promise<UOMListItem[]> => {
    try {
      const response = await UOMService.getAll({ limit: 1000 }, config);
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getUOMs failed:', error);
      return [];
    }
  },

  toggleUOMStatus: async (id: number, isActive: boolean) => {
    try {
      return await UOMService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleUOMStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
    }
  },


  getCostCenters: async (config?: AxiosRequestConfig): Promise<CostCenter[]> => {
    try {
      return await CostCenterService.getList(config);
    } catch (error) {
      logger.error('[MasterDataService] getCostCenters failed:', error);
      return [];
    }
  },

  toggleCostCenterStatus: async (id: number, isActive: boolean) => {
    try {
      return await CostCenterService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleCostCenterStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
    }
  },

  getDepartments: async (config?: AxiosRequestConfig): Promise<DepartmentListItem[]> => {
    try {
      const response = await DepartmentService.getList({ limit: 100 }, config);
      return response?.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getDepartments failed:', error);
      return [];
    }
  },

  getProjects: async (config?: AxiosRequestConfig): Promise<Project[]> => {
    try {
      return await ProjectService.getList(config);
    } catch (error) {
      logger.error('[MasterDataService] getProjects failed:', error);
      return [];
    }
  },

  toggleProjectStatus: async (id: number, isActive: boolean) => {
    try {
      return await ProjectService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleProjectStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
    }
  },

  getProductCategories: async (config?: AxiosRequestConfig): Promise<ProductCategoryListItem[]> => {
    try {
      const response = await ProductCategoryService.getAll(undefined, config);
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getProductCategories failed:', error);
      return [];
    }
  },

  toggleCategoryStatus: async (id: number, isActive: boolean) => {
    try {
      return await ProductCategoryService.toggleStatus(id, isActive);
    } catch (error) {
      logger.error('[MasterDataService] toggleCategoryStatus failed:', error);
      return { success: false, message: 'Failed to toggle status' };
    }
  },

  getItemTypes: async (config?: AxiosRequestConfig): Promise<ItemTypeListItem[]> => {
    try {
      const response = await ItemTypeService.getAll(undefined, config);
      return response.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getItemTypes failed:', error);
      return [];
    }
  },

  getCurrencies: async (config?: AxiosRequestConfig): Promise<Currency[]> => {
    try {
      const response = await CurrencyService.getCurrencies(config);
      return response?.items || [];
    } catch (error) {
      logger.error('[MasterDataService] getCurrencies failed:', error);
      return [];
    }
  },
  
  getSaleAreas: async (config?: AxiosRequestConfig): Promise<SaleAreaListItem[]> => {
    try {
      const response = await SaleAreaService.getList(config);
      return response || [];
    } catch (error) {
      logger.error('[MasterDataService] getSaleAreas failed:', error);
      return [];
    }
  },

  getEmployees: async (config?: AxiosRequestConfig): Promise<EmployeeListItem[]> => {
    try {
      const response = await EmployeeService.getList({ limit: 1000 }, config);
      return normalizeListResponse<EmployeeListItem>(response).items;
    } catch (error) {
      logger.error('[MasterDataService] getEmployees failed:', error);
      return [];
    }
  }
};
