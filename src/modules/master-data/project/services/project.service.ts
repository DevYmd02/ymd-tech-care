/**
 * @file project.service.ts
 * @description Simplified Project Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { Project } from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';
import { mockProjects } from '@/modules/master-data/mocks/masterDataMocks';

export const ProjectService = {
  getList: async (): Promise<Project[]> => {
    if (USE_MOCK) {
       return mockProjects;
    }
    try {
      type ExpectedResponse = Project[] | { items?: Project[]; data?: Project[] };
      const response = await api.get<ExpectedResponse>('/project');
      
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        if ('items' in response && Array.isArray(response.items)) {
          return response.items;
        }
        if ('data' in response && Array.isArray(response.data)) {
           return response.data;
        }
      }
      
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      logger.error('[ProjectService] getList error:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Project | null> => {
    if (USE_MOCK) {
      return mockProjects.find(p => p.project_id === id) || null;
    }
    try {
      const response = await api.get<Project>(`/project/${id}`);
      return response;
    } catch (error) {
      logger.error('[ProjectService] getById error:', error);
      return null;
    }
  },

  create: async (data: Partial<Project>): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
       logger.info('[ProjectService] Mock Create:', data);
       return { success: true };
    }
    try {
      await api.post('/project', data);
      return { success: true };
    } catch (error) {
      logger.error('[ProjectService] create error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  update: async (id: number, data: Partial<Project>): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
       logger.info('[ProjectService] Mock Update:', id, data);
       return { success: true };
    }
    try {
      await api.patch(`/project/${id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[ProjectService] update error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  toggleStatus: async (id: number, currentStatus: boolean): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
       const p = mockProjects.find(proj => proj.project_id === id);
       if (p) p.is_active = !currentStatus;
       return { success: true };
    }
    try {
      await api.patch(`/project/${id}/status`, { is_active: !currentStatus });
      return { success: true };
    } catch (error) {
      logger.error('[ProjectService] toggleStatus error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};
