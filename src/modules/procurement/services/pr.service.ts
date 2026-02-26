import api from '@/core/api/api';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader, 
  CreatePRPayload,
  PRStatus,
} from '@/modules/procurement/types';

export type PRUpdatePayload = Partial<CreatePRPayload> & { status?: PRStatus };

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/pr',
  detail: (id: string) => `/pr/${id}`,
  submit: (id: string) => `/pr/${id}/submit`,
  approve: (id: string) => `/pr/${id}/approve`,
  cancel: (id: string) => `/pr/${id}/cancel`,
  reject: (id: string) => `/pr/${id}/reject`,
  convert: (id: string) => `/pr/${id}/convert`,
  attachments: (id: string) => `/pr/${id}/attachments`,
  attachment: (id: string, attachmentId: string) => `/pr/${id}/attachments/${attachmentId}`,
  generateNo: '/pr/generate-no',
};

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    logger.info('[PRService] Fetching PR List', params);
    const response = await api.get<PRListResponse>(ENDPOINTS.list, { params });
    return response;
  },

  getDetail: async (id: string): Promise<PRHeader> => {
    logger.info(`[PRService] Fetching PR Detail: ${id}`);
    const response = await api.get<PRHeader>(ENDPOINTS.detail(id));
    return response;
  },

  create: async (payload: CreatePRPayload): Promise<PRHeader> => {
    logger.info('[PRService] Creating PR');
    const response = await api.post<PRHeader>(ENDPOINTS.list, payload);
    return response;
  },

  update: async (id: string, payload: PRUpdatePayload): Promise<PRHeader> => {
    logger.info(`[PRService] Updating PR: ${id}`);
    const response = await api.patch<PRHeader>(ENDPOINTS.detail(id), payload);
    return response;
  },

  delete: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Deleting PR: ${id}`);
    const response = await api.delete<SuccessResponse>(ENDPOINTS.detail(id));
    return response;
  },

  submit: async (id: string): Promise<SuccessResponse & { pr_no?: string }> => {
    logger.info(`[PRService] Submitting PR: ${id}`);
    const response = await api.post<SuccessResponse & { pr_no?: string }>(ENDPOINTS.submit(id));
    return response;
  },

  approve: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Approving PR: ${id}`);
    const response = await api.post<SuccessResponse>(ENDPOINTS.approve(id));
    return response;
  },

  reject: async (id: string, reason: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Rejecting PR: ${id}`);
    const response = await api.post<SuccessResponse>(ENDPOINTS.reject(id), { reason });
    return response;
  },

  cancel: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Cancelling PR: ${id}`);
    const response = await api.post<SuccessResponse>(ENDPOINTS.cancel(id));
    return response;
  },

  convert: async (id: string, request: ConvertPRRequest): Promise<SuccessResponse> => {
    logger.info(`[PRService] Converting PR: ${id}`);
    const response = await api.post<SuccessResponse>(ENDPOINTS.convert(id), request);
    return response;
  },

  uploadAttachment: async (id: string, file: File): Promise<SuccessResponse> => {
    logger.info(`[PRService] Uploading attachment for PR: ${id}`);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<SuccessResponse>(ENDPOINTS.attachments(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  deleteAttachment: async (id: string, attachmentId: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Deleting attachment ${attachmentId} for PR: ${id}`);
    const response = await api.delete<SuccessResponse>(ENDPOINTS.attachment(id, attachmentId));
    return response;
  },

  generateNextDocumentNo: async (): Promise<{ document_no: string }> => {
    logger.info('[PRService] Generating next document number');
    const response = await api.get<{ document_no: string }>(ENDPOINTS.generateNo);
    return response;
  },
};
