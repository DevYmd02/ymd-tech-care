/**
 * @file MasterDataServiceImpl.ts
 * @description Real API implementation for Master Data Service
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
  MasterDataListResponse,
  ProductCategoryListItem,
  ItemTypeListItem,
} from '../../types/master-data-types';

const ENDPOINTS = {
  branches: '/master/branches',
  warehouses: '/master/warehouses',
  items: '/master/items',
  units: '/master/units',
  costCenters: '/master/cost-centers',
  projects: '/master/projects',
  productCategories: '/master/product-categories',
  itemTypes: '/master/item-types',
};

export class MasterDataServiceImpl implements IMasterDataService {
  async getBranches(): Promise<BranchMaster[]> {
    const response = await api.get<MasterDataListResponse<BranchMaster>>(ENDPOINTS.branches);
    return response.data.data;
  }

  async getWarehouses(): Promise<WarehouseMaster[]> {
    const response = await api.get<MasterDataListResponse<WarehouseMaster>>(ENDPOINTS.warehouses);
    return response.data.data;
  }

  async getItems(): Promise<ItemMaster[]> {
    const response = await api.get<MasterDataListResponse<ItemMaster>>(ENDPOINTS.items);
    return response.data.data;
  }

  async getUnits(): Promise<UnitMaster[]> {
    const response = await api.get<MasterDataListResponse<UnitMaster>>(ENDPOINTS.units);
    return response.data.data;
  }

  async getCostCenters(): Promise<CostCenter[]> {
    const response = await api.get<MasterDataListResponse<CostCenter>>(ENDPOINTS.costCenters);
    return response.data.data;
  }

  async getProjects(): Promise<Project[]> {
    const response = await api.get<MasterDataListResponse<Project>>(ENDPOINTS.projects);
    return response.data.data;
  }

  async getProductCategories(): Promise<ProductCategoryListItem[]> {
    const response = await api.get<MasterDataListResponse<ProductCategoryListItem>>(ENDPOINTS.productCategories);
    return response.data.data;
  }

  async getItemTypes(): Promise<ItemTypeListItem[]> {
    const response = await api.get<MasterDataListResponse<ItemTypeListItem>>(ENDPOINTS.itemTypes);
    return response.data.data;
  }
}
