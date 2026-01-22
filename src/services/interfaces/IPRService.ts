/**
 * @file IPRService.ts
 * @description Interface for PR Service - defines standard methods for both Mock and Real implementations
 */

import type {
  PRHeader,
  PRFormData,
  PRStatus,
  ApprovalTask,
} from '../../types/pr-types';

export interface PRListParams {
  status?: PRStatus | 'ALL';
  cost_center_id?: string;
  project_id?: string;
  requester_name?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface PRListResponse {
  data: PRHeader[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmitPRRequest {
  pr_id: string;
}

export interface ApprovalRequest {
  pr_id: string;
  action: 'APPROVE' | 'REJECT';
  remark?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  approval_task?: ApprovalTask;
}

export interface ConvertPRRequest {
  pr_id: string;
  convert_to: 'RFQ' | 'PO';
  line_ids?: string[];
}

export interface IPRService {
  getList(params?: PRListParams): Promise<PRListResponse>;
  getById(prId: string): Promise<PRHeader | null>;
  create(data: PRFormData): Promise<PRHeader | null>;
  update(prId: string, data: Partial<PRFormData>): Promise<PRHeader | null>;
  delete(prId: string): Promise<boolean>;
  submit(prId: string): Promise<{ success: boolean; message: string }>;
  approve(request: ApprovalRequest): Promise<ApprovalResponse>;
  cancel(prId: string, remark?: string): Promise<{ success: boolean; message: string }>;
  convert(request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }>;
  uploadAttachment(prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }>;
  deleteAttachment(prId: string, attachmentId: string): Promise<boolean>;
}
