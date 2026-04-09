import api from '@/core/api/api';
import { type CompanyInfo, type CompanyInfoFormData } from '../types/company-info.types';

/**
 * @file company-info.service.ts
 * @description Service for managing Company Information via API
 */
export const CompanyInfoService = {
  /**
   * Fetch main company information
   */
  get: () => api.get<CompanyInfo | null>('/org-company-info'),

  /**
   * Update company information
   */
  update: (id: number, data: Partial<CompanyInfoFormData>) => 
    api.put<{ success: boolean; data?: CompanyInfo; message?: string }>(`/org-company-info/${id}`, data),

  /**
   * Upload company logo
   */
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: boolean; logo_url: string; message?: string }>('/org-company-info/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
