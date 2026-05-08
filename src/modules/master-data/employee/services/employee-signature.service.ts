/**
 * @file employee-signature.service.ts
 * @description Service for managing employee signatures
 */

import api from '@/core/api/api';
import type { IEmployeeSignature, IUploadSignatureResponse } from '@/modules/master-data/company/types/employee-types';
import { logger } from '@/shared/utils';

export const EmployeeSignatureService = {
  /**
   * Upload a new signature for an employee
   */
  uploadSignature: async (employeeId: number, file: File, signatureName?: string): Promise<IUploadSignatureResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (signatureName) {
        formData.append('signature_name', signatureName);
      }

      const response = await api.post<IUploadSignatureResponse>(`/employee-signature/${employeeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      logger.error('[EmployeeSignatureService] uploadSignature error:', error);
      throw error;
    }
  },

  /**
   * Get all signatures for an employee
   */
  getSignatures: async (employeeId: number): Promise<IEmployeeSignature[]> => {
    try {
      const response = await api.get<IEmployeeSignature[]>(`/employee-signature/${employeeId}`);
      return response;
    } catch (error) {
      logger.error('[EmployeeSignatureService] getSignatures error:', error);
      throw error;
    }
  },

  /**
   * Set a specific signature as active
   */
  setActive: async (signatureId: number): Promise<{ message: string }> => {
    try {
      const response = await api.patch<{ message: string }>(`/employee-signature/active/${signatureId}`);
      return response;
    } catch (error) {
      logger.error('[EmployeeSignatureService] setActive error:', error);
      throw error;
    }
  },

  /**
   * Delete (Soft delete) a signature
   */
  deleteSignature: async (signatureId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>(`/employee-signature/${signatureId}`);
      return response;
    } catch (error) {
      logger.error('[EmployeeSignatureService] deleteSignature error:', error);
      throw error;
    }
  }
};
