/**
 * @file BranchServiceImpl.ts
 * @description Real API implementation for Branch Service (CRUD operations)
 * @note Uses /org-branches endpoint to match backend API
 */

import api from '../api';
import type { IBranchService, BranchCreateRequest, BranchUpdateRequest } from '../interfaces/IBranchService';
import type { BranchListItem, BranchDropdownItem } from '../../types/master-data-types';
import { logger } from '../../utils/logger';

const ENDPOINT = '/org-branches';

export class BranchServiceImpl implements IBranchService {
  async getList(): Promise<BranchListItem[]> {
    try {
      const response = await api.get(ENDPOINT);
      
      // Handle multiple response formats
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      logger.warn('[BranchServiceImpl] getList: unexpected response format');
      return [];
    } catch (error) {
      logger.error('[BranchServiceImpl] getList error:', error);
      return [];
    }
  }

  async getDropdown(): Promise<BranchDropdownItem[]> {
    try {
      const response = await api.get(`${ENDPOINT}/dropdown`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      logger.error('[BranchServiceImpl] getDropdown error:', error);
      return [];
    }
  }

  async getById(id: string): Promise<BranchListItem | null> {
    try {
      const response = await api.get<BranchListItem>(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[BranchServiceImpl] getById error:', error);
      return null;
    }
  }

  async create(data: BranchCreateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post(ENDPOINT, data);
      return { success: true };
    } catch (error) {
      logger.error('[BranchServiceImpl] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างสาขา' };
    }
  }

  async update(data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.put(`${ENDPOINT}/${data.branch_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[BranchServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสาขา' };
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
      return true;
    } catch (error) {
      logger.error('[BranchServiceImpl] delete error:', error);
      return false;
    }
  }
}
