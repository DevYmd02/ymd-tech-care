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
      const response = await api.get<Project[]>('/projects');
      return response;
    } catch (error) {
      logger.error('[ProjectService] getList error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Project | null> => {
    try {
      const response = await api.get<Project>(`/projects/${id}`);
      return response;
    } catch (error) {
      logger.error('[ProjectService] getById error:', error);
      return null;
    }
  }
};
