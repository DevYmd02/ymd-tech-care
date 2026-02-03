/**
 * @file project.service.ts
 * @description Simplified Project Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { Project } from '@/types/master-data-types';
import { logger } from '@/utils/logger';
import { mockProjects } from '@/__mocks__/masterDataMocks';

export const ProjectService = {
  getList: async (): Promise<Project[]> => {
    if (USE_MOCK) {
       return mockProjects;
    }
    try {
      const response = await api.get<Project[]>('/projects');
      return response.data;
    } catch (error) {
      logger.error('[ProjectService] getList error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Project | null> => {
    try {
      const response = await api.get<Project>(`/projects/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[ProjectService] getById error:', error);
      return null;
    }
  }
};
