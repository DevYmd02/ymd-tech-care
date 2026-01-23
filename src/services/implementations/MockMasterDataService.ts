/**
 * @file MockMasterDataService.ts
 * @description Mock implementation for Master Data Service
 */

import type { IMasterDataService } from '../interfaces/IMasterDataService';
import {
  mockBranches,
  mockWarehouses,
  mockUnits,
  mockProductCategories,
  mockItemTypes,
  mockItems,
} from '../../__mocks__/masterDataMocks';
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

export class MockMasterDataService implements IMasterDataService {
  async getBranches(): Promise<BranchMaster[]> {
    logger.log('[MockMasterDataService] getBranches');
    return mockBranches as unknown as BranchMaster[];
  }

  async getWarehouses(): Promise<WarehouseMaster[]> {
    logger.log('[MockMasterDataService] getWarehouses');
    return mockWarehouses as unknown as WarehouseMaster[];
  }

  async getItems(): Promise<ItemMaster[]> {
    logger.log('[MockMasterDataService] getItems');
    return mockItems as unknown as ItemMaster[];
  }

  async getUnits(): Promise<UnitMaster[]> {
    logger.log('[MockMasterDataService] getUnits');
    return mockUnits as unknown as UnitMaster[];
  }

  async getCostCenters(): Promise<CostCenter[]> {
    logger.log('[MockMasterDataService] getCostCenters');
    return mockCostCenters;
  }

  async getProjects(): Promise<Project[]> {
    logger.log('[MockMasterDataService] getProjects');
    return mockProjects;
  }

  async getProductCategories(): Promise<ProductCategoryListItem[]> {
    logger.log('[MockMasterDataService] getProductCategories');
    return mockProductCategories;
  }

  async getItemTypes(): Promise<ItemTypeListItem[]> {
    logger.log('[MockMasterDataService] getItemTypes');
    return mockItemTypes;
  }
}
