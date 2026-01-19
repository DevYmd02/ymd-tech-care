/**
 * @file masterDataService.ts
 * @description Centralized service for fetching master data configurations
 * Replaces direct mock data usage with API calls
 */

import api from './api';
import type { 
    BranchMaster, 
    WarehouseMaster, 
    ItemMaster, 
    UnitMaster,
    CostCenter,
    Project,
    MasterDataListResponse 
} from '../types/master-data-types';

const ENDPOINTS = {
    branches: '/master/branches',
    warehouses: '/master/warehouses',
    items: '/master/items',
    units: '/master/units', // or uoms
    costCenters: '/master/cost-centers',
    projects: '/master/projects'
};

export const masterDataService = {
    /** Get all branches */
    async getBranches(): Promise<BranchMaster[]> {
        const response = await api.get<MasterDataListResponse<BranchMaster>>(ENDPOINTS.branches);
        return response.data.data;
    },

    /** Get all warehouses */
    async getWarehouses(): Promise<WarehouseMaster[]> {
        const response = await api.get<MasterDataListResponse<WarehouseMaster>>(ENDPOINTS.warehouses);
        return response.data.data;
    },

    /** Get all items */
    async getItems(): Promise<ItemMaster[]> {
        const response = await api.get<MasterDataListResponse<ItemMaster>>(ENDPOINTS.items);
        return response.data.data;
    },

    /** Get all units */
    async getUnits(): Promise<UnitMaster[]> {
        const response = await api.get<MasterDataListResponse<UnitMaster>>(ENDPOINTS.units);
        return response.data.data;
    },

    /** Get all cost centers */
    async getCostCenters(): Promise<CostCenter[]> {
        const response = await api.get<MasterDataListResponse<CostCenter>>(ENDPOINTS.costCenters);
        return response.data.data;
    },

    /** Get all projects */
    async getProjects(): Promise<Project[]> {
        const response = await api.get<MasterDataListResponse<Project>>(ENDPOINTS.projects);
        return response.data.data;
    }
};
