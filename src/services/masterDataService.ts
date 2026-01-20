/**
 * @file masterDataService.ts
 * @description Service สำหรับ Master Data configurations
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 * ควบคุมโดย VITE_USE_MOCK ใน .env
 */

import api, { USE_MOCK } from './api';
import {
  mockBranches,
  mockWarehouses,
  mockUnits,
  mockProductCategories,
  mockItemTypes,
  mockItems,
} from '../__mocks__/masterDataMocks';
import type { 
    BranchMaster, 
    WarehouseMaster, 
    ItemMaster, 
    UnitMaster,
    CostCenter,
    Project,
    MasterDataListResponse 
} from '../types/master-data-types';
import { logger } from '../utils/logger';

// =============================================================================
// MOCK COST CENTERS & PROJECTS (ไม่อยู่ใน masterDataMocks)
// =============================================================================

const mockCostCenters: CostCenter[] = [
  { cost_center_id: 'cc-001', cost_center_code: 'CC-IT', cost_center_name: 'ฝ่ายเทคโนโลยีสารสนเทศ', budget_amount: 5000000, manager_name: 'สมชาย IT', is_active: true },
  { cost_center_id: 'cc-002', cost_center_code: 'CC-HR', cost_center_name: 'ฝ่ายทรัพยากรบุคคล', budget_amount: 2000000, manager_name: 'สมหญิง HR', is_active: true },
  { cost_center_id: 'cc-003', cost_center_code: 'CC-PROD', cost_center_name: 'ฝ่ายผลิต', budget_amount: 10000000, manager_name: 'วิชัย ผลิต', is_active: true },
  { cost_center_id: 'cc-004', cost_center_code: 'CC-SALES', cost_center_name: 'ฝ่ายขาย', budget_amount: 3000000, manager_name: 'มานะ ขาย', is_active: true },
];

const mockProjects: Project[] = [
  { project_id: 'prj-001', project_code: 'PRJ-2026-001', project_name: 'ปรับปรุงระบบ ERP', cost_center_id: 'cc-001', budget_amount: 2000000, start_date: '2026-01-01', end_date: '2026-12-31', status: 'ACTIVE' },
  { project_id: 'prj-002', project_code: 'PRJ-2026-002', project_name: 'ขยายสายการผลิต', cost_center_id: 'cc-003', budget_amount: 5000000, start_date: '2026-03-01', end_date: '2026-09-30', status: 'ACTIVE' },
  { project_id: 'prj-003', project_code: 'PRJ-2026-003', project_name: 'Digital Transformation', cost_center_id: 'cc-001', budget_amount: 3000000, start_date: '2026-02-01', end_date: '2027-01-31', status: 'ACTIVE' },
];

// =============================================================================
// ENDPOINTS
// =============================================================================

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

// =============================================================================
// MASTER DATA SERVICE
// =============================================================================

export const masterDataService = {
    /** Get all branches */
    async getBranches(): Promise<BranchMaster[]> {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK branches');
            return mockBranches as unknown as BranchMaster[];
        }
        const response = await api.get<MasterDataListResponse<BranchMaster>>(ENDPOINTS.branches);
        return response.data.data;
    },

    /** Get all warehouses */
    async getWarehouses(): Promise<WarehouseMaster[]> {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK warehouses');
            return mockWarehouses as unknown as WarehouseMaster[];
        }
        const response = await api.get<MasterDataListResponse<WarehouseMaster>>(ENDPOINTS.warehouses);
        return response.data.data;
    },

    /** Get all items */
    async getItems(): Promise<ItemMaster[]> {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK items');
            return mockItems as unknown as ItemMaster[];
        }
        const response = await api.get<MasterDataListResponse<ItemMaster>>(ENDPOINTS.items);
        return response.data.data;
    },

    /** Get all units */
    async getUnits(): Promise<UnitMaster[]> {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK units');
            return mockUnits as unknown as UnitMaster[];
        }
        const response = await api.get<MasterDataListResponse<UnitMaster>>(ENDPOINTS.units);
        return response.data.data;
    },

    /** Get all cost centers */
    async getCostCenters(): Promise<CostCenter[]> {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK cost centers');
            return mockCostCenters;
        }
        const response = await api.get<MasterDataListResponse<CostCenter>>(ENDPOINTS.costCenters);
        return response.data.data;
    },

    /** Get all projects */
    async getProjects(): Promise<Project[]> {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK projects');
            return mockProjects;
        }
        const response = await api.get<MasterDataListResponse<Project>>(ENDPOINTS.projects);
        return response.data.data;
    },

    /** Get product categories */
    async getProductCategories() {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK product categories');
            return mockProductCategories;
        }
        const response = await api.get(ENDPOINTS.productCategories);
        return response.data.data;
    },

    /** Get item types */
    async getItemTypes() {
        if (USE_MOCK) {
            logger.log('[masterDataService] Using MOCK item types');
            return mockItemTypes;
        }
        const response = await api.get(ENDPOINTS.itemTypes);
        return response.data.data;
    },
};

export default masterDataService;
