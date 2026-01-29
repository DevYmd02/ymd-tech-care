/**
 * @file MasterDataServiceImpl.ts
 * @description Real API implementation for Master Data Service
 * @note All methods handle multiple backend response formats and gracefully handle errors
 */

import api from '../api';
import type { IMasterDataService } from '../interfaces/IMasterDataService';
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
import { logger } from '../../utils/logger';

const ENDPOINTS = {
  branches: '/org-branches',
  warehouses: '/warehouses',
  items: '/items',
  units: '/units',
  costCenters: '/cost-centers',
  projects: '/projects',
  productCategories: '/product-categories',
  itemTypes: '/item-types',
};

/**
 * Helper to parse various backend response formats into an array
 * Handles: simple array, { data: [] }, { items: [] }, single object, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResponseToArray<T>(responseData: any, entityName: string): T[] {
  logger.log(`[MasterDataServiceImpl] ${entityName} raw response:`, responseData);

  if (Array.isArray(responseData)) {
    // Backend returns simple array
    return responseData;
  }
  
  if (responseData?.data && Array.isArray(responseData.data)) {
    // Standard paginated format: { data: [], total, page, limit }
    return responseData.data;
  }
  
  if (responseData?.items && Array.isArray(responseData.items)) {
    // Alternative format: { items: [] }
    return responseData.items;
  }
  
  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    // Check if it's a single entity object (has an id field)
    if (responseData.branch_id || responseData.warehouse_id || responseData.item_id || 
        responseData.cost_center_id || responseData.project_id || responseData.unit_id) {
      return [responseData as T];
    }
  }

  logger.warn(`[MasterDataServiceImpl] ${entityName} unknown response format, returning empty array`);
  return [];
}

export class MasterDataServiceImpl implements IMasterDataService {
  async getBranches(): Promise<BranchMaster[]> {
    try {
      const response = await api.get(ENDPOINTS.branches);
      return parseResponseToArray<BranchMaster>(response.data, 'getBranches');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getBranches error:', error);
      return [];
    }
  }

  async getWarehouses(): Promise<WarehouseMaster[]> {
    try {
      const response = await api.get(ENDPOINTS.warehouses);
      return parseResponseToArray<WarehouseMaster>(response.data, 'getWarehouses');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getWarehouses error:', error);
      return [];
    }
  }

  async getItems(): Promise<ItemMaster[]> {
    try {
      const response = await api.get(ENDPOINTS.items);
      return parseResponseToArray<ItemMaster>(response.data, 'getItems');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getItems error:', error);
      return [];
    }
  }

  async getUnits(): Promise<UnitMaster[]> {
    try {
      const response = await api.get(ENDPOINTS.units);
      return parseResponseToArray<UnitMaster>(response.data, 'getUnits');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getUnits error:', error);
      return [];
    }
  }

  async getCostCenters(): Promise<CostCenter[]> {
    try {
      const response = await api.get(ENDPOINTS.costCenters);
      return parseResponseToArray<CostCenter>(response.data, 'getCostCenters');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getCostCenters error:', error);
      return [];
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get(ENDPOINTS.projects);
      return parseResponseToArray<Project>(response.data, 'getProjects');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getProjects error:', error);
      return [];
    }
  }

  async getProductCategories(): Promise<ProductCategoryListItem[]> {
    try {
      const response = await api.get(ENDPOINTS.productCategories);
      return parseResponseToArray<ProductCategoryListItem>(response.data, 'getProductCategories');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getProductCategories error:', error);
      return [];
    }
  }

  async getItemTypes(): Promise<ItemTypeListItem[]> {
    try {
      const response = await api.get(ENDPOINTS.itemTypes);
      return parseResponseToArray<ItemTypeListItem>(response.data, 'getItemTypes');
    } catch (error) {
      logger.error('[MasterDataServiceImpl] getItemTypes error:', error);
      return [];
    }
  }
}
