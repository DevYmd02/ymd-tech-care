/**
 * @file prService.ts
 * @description Service สำหรับจัดการข้อมูล Purchase Requisition
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 * ควบคุมโดย VITE_USE_MOCK ใน .env
 */


import api, { USE_MOCK } from './api';
import { RELATED_PRS } from '../__mocks__/relatedMocks';
import { getMockFlowWithSteps, MOCK_APPROVERS } from '../__mocks__/approvalFlowMocks';
import type { 
  PRHeader, 
  PRFormData, 
  PRStatus, 
  ApprovalTask 
} from '../types/pr-types';
import { logger } from '../utils/logger';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

// =============================================================================
// PR SERVICE
// =============================================================================

export const prService = {

  // ==================== READ OPERATIONS ====================

  /**
   * ดึงรายการ PR ทั้งหมด
   */
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    if (USE_MOCK) {
      logger.log('[prService] Using MOCK data');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let filteredPRs = [...RELATED_PRS];
      
      // Filter by status
      if (params?.status && params.status !== 'ALL') {
        filteredPRs = filteredPRs.filter(pr => pr.status === params.status);
      }
      
      // Filter by requester name
      if (params?.requester_name) {
        const search = params.requester_name.toLowerCase();
        filteredPRs = filteredPRs.filter(pr => 
          pr.requester_name?.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filteredPRs,
        total: filteredPRs.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }

    try {
      const response = await api.get<PRListResponse>('/pr', { params });
      return response.data;
    } catch (error) {
      logger.error('prService.getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  },

  /**
   * ดึงรายละเอียด PR ตาม ID
   */
  getById: async (prId: string): Promise<PRHeader | null> => {
    if (USE_MOCK) {
      return RELATED_PRS.find(pr => pr.pr_id === prId) || null;
    }

    try {
      const response = await api.get<PRHeader>(`/pr/${prId}`);
      return response.data;
    } catch (error) {
      logger.error('prService.getById error:', error);
      return null;
    }
  },

  // ==================== WRITE OPERATIONS ====================

  /**
   * สร้าง PR ใหม่
   */
  create: async (data: PRFormData): Promise<PRHeader | null> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock create:', data);
      const newPR: PRHeader = {
        pr_id: `pr-${Date.now()}`,
        pr_no: `PR-202601-${String(RELATED_PRS.length + 1).padStart(4, '0')}`,
        branch_id: 'branch-001',
        requester_user_id: 'user-001',
        requester_name: 'ผู้ใช้ปัจจุบัน',
        request_date: new Date().toISOString().split('T')[0],
        required_date: data.required_date || '',
        cost_center_id: data.cost_center_id || '',
        purpose: data.purpose || '',
        status: 'DRAFT',
        currency_code: 'THB',
        total_amount: data.total_amount || 0,
        attachment_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_user_id: 'user-001',
        updated_by_user_id: 'user-001',
      };
      
      // Update Mock Data
      RELATED_PRS.unshift(newPR);
      
      return newPR;
    }

    try {
      const response = await api.post<PRHeader>('/pr', data);
      return response.data;
    } catch (error) {
      logger.error('prService.create error:', error);
      return null;
    }
  },

  /**
   * อัปเดต PR
   */
  update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock update:', prId, data);
      const index = RELATED_PRS.findIndex(pr => pr.pr_id === prId);
      if (index !== -1) {
        RELATED_PRS[index] = { ...RELATED_PRS[index], ...(data as unknown as Partial<PRHeader>) };
        return RELATED_PRS[index];
      }
      return null;
    }

    try {
      const response = await api.put<PRHeader>(`/pr/${prId}`, data);
      return response.data;
    } catch (error) {
      logger.error('prService.update error:', error);
      return null;
    }
  },

  /**
   * ลบ PR
   */
  delete: async (prId: string): Promise<boolean> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock delete:', prId);
      const index = RELATED_PRS.findIndex(pr => pr.pr_id === prId);
      if (index !== -1) {
        RELATED_PRS.splice(index, 1);
      }
      return true;
    }

    try {
      await api.delete(`/pr/${prId}`);
      return true;
    } catch (error) {
      logger.error('prService.delete error:', error);
      return false;
    }
  },

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * ส่ง PR เพื่อขออนุมัติ
   */
  submit: async (prId: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock submit:', prId);
      
      const prIndex = RELATED_PRS.findIndex(pr => pr.pr_id === prId);
      if (prIndex === -1) return { success: false, message: 'PR not found' };

      const pr = RELATED_PRS[prIndex];
      const flowConfig = getMockFlowWithSteps('PR', pr.total_amount);

      if (!flowConfig || !flowConfig.approval_flow_steps || flowConfig.approval_flow_steps.length === 0) {
        // No flow found, auto approve? Or warning?
        // Let's assume auto-approve if no flow match (e.g. very small amount)
        // Or default flow. User requirement implies flow always exists.
        return { success: false, message: 'ไม่พบ Flow การอนุมัติสำหรับยอดเงินนี้' };
      }

      // 1. Create First Task
      const firstStep = flowConfig.approval_flow_steps[0];
      const approverName = Object.values(MOCK_APPROVERS).find(u => u.id === firstStep.approver_user_id)?.name || 'Unknown';
      const approverPos = Object.values(MOCK_APPROVERS).find(u => u.id === firstStep.approver_user_id)?.position || 'Unknown';

      const newTask: ApprovalTask = {
        task_id: `task-${Date.now()}`,
        document_type: 'PR',
        document_id: pr.pr_id,
        document_no: pr.pr_no,
        approver_user_id: firstStep.approver_user_id,
        approver_name: approverName,
        approver_position: approverPos,
        status: 'PENDING',
        created_at: new Date().toISOString()
      };

      // 2. Update PR
      RELATED_PRS[prIndex] = {
        ...pr,
        status: 'IN_APPROVAL',
        approval_tasks: [newTask] // Start with first task
      };

      return { success: true, message: `ส่งอนุมัติเรียบร้อย (เสนอ: ${approverName})` };
    }

    try {
      const response = await api.post<{ success: boolean; message: string }>(`/pr/${prId}/submit`);
      return response.data;
    } catch (error) {
      logger.error('prService.submit error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่งอนุมัติ' };
    }
  },

  /**
   * อนุมัติ/ปฏิเสธ PR
   */
  approve: async (request: ApprovalRequest): Promise<ApprovalResponse> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock approve:', request);
      
      const prIndex = RELATED_PRS.findIndex(pr => pr.pr_id === request.pr_id);
      if (prIndex === -1) return { success: false, message: 'PR not found' };

      const pr = RELATED_PRS[prIndex];
      const currentTasks = pr.approval_tasks || [];
      const pendingTaskIndex = currentTasks.findIndex(t => t.status === 'PENDING');

      if (pendingTaskIndex === -1) {
        return { success: false, message: 'ไม่พบงานที่รออนุมัติ' };
      }

      // 1. Update Current Task
      const updatedTask = {
        ...currentTasks[pendingTaskIndex],
        status: request.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        approved_at: new Date().toISOString(),
        remark: request.remark
      } as ApprovalTask;

      currentTasks[pendingTaskIndex] = updatedTask;

      // 2. Handle Action
      if (request.action === 'REJECT') {
        // Reject -> PR Rejected
        RELATED_PRS[prIndex] = {
          ...pr,
          status: 'REJECTED',
          approval_tasks: currentTasks
        };
        return { success: true, message: 'ไม่อนุมัติเอกสารเรียบร้อย', approval_task: updatedTask };
      } 
      
      // Approve -> Check Next Step
      // Find current step info
      const flowConfig = getMockFlowWithSteps('PR', pr.total_amount);
      if (flowConfig && flowConfig.approval_flow_steps) {
        // Find current step sequence
        // We assume we know which step we just approved. 
        // In real backend we check step_id. Here we approximate by checking index or user match.
        // Simplified: Just take the pending task as the "current" one in sequence.
        // If we want next step, we need to know "what was this step number?"
        // Hack: The mock data sequence matches the task creation order.
        
        const currentStepSeq = pendingTaskIndex + 1; // 0->1, 1->2
        const nextStep = flowConfig.approval_flow_steps.find(s => s.sequence_no === currentStepSeq + 1);

        if (nextStep) {
          // Create Next Task
          const approverName = Object.values(MOCK_APPROVERS).find(u => u.id === nextStep.approver_user_id)?.name || 'Unknown';
          const approverPos = Object.values(MOCK_APPROVERS).find(u => u.id === nextStep.approver_user_id)?.position || 'Unknown';

          const nextTask: ApprovalTask = {
            task_id: `task-${Date.now()}-next`,
            document_type: 'PR',
            document_id: pr.pr_id,
            document_no: pr.pr_no,
            approver_user_id: nextStep.approver_user_id,
            approver_name: approverName,
            approver_position: approverPos,
            status: 'PENDING', // Next one is pending
            created_at: new Date().toISOString()
          };
          currentTasks.push(nextTask);
          
          RELATED_PRS[prIndex] = {
             ...pr,
             status: 'IN_APPROVAL', // Still in approval
             approval_tasks: currentTasks
          };
          
          return { success: true, message: `อนุมัติเรียบร้อย (ส่งต่อ: ${approverName})`, approval_task: updatedTask };

        } else {
          // No next step -> PR Approved
           RELATED_PRS[prIndex] = {
             ...pr,
             status: 'APPROVED',
             approval_tasks: currentTasks
          };
           return { success: true, message: 'อนุมัติเอกสารเสร็จสมบูรณ์', approval_task: updatedTask };
        }
      }

      return { success: true, message: 'บันทึกเรียบร้อย', approval_task: updatedTask };
    }

    try {
      const response = await api.post<ApprovalResponse>(`/pr/${request.pr_id}/approve`, {
        action: request.action,
        remark: request.remark,
      });
      return response.data;
    } catch (error) {
      logger.error('prService.approve error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติ' };
    }
  },

  /**
   * ยกเลิก PR
   */
  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock cancel:', prId);
       const index = RELATED_PRS.findIndex(pr => pr.pr_id === prId);
      if (index !== -1) {
        RELATED_PRS[index] = { ...RELATED_PRS[index], status: 'CANCELLED' };
      }
      return { success: true, message: 'ยกเลิกสำเร็จ (Mock)' };
    }

    try {
      const response = await api.post<{ success: boolean; message: string }>(`/pr/${prId}/cancel`, { remark });
      return response.data;
    } catch (error) {
      logger.error('prService.cancel error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก' };
    }
  },

  /**
   * แปลง PR เป็น RFQ หรือ PO
   */
  convert: async (request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock convert:', request);
      return { success: true, document_id: 'doc-001', document_no: 'RFQ-001' };
    }

    try {
      const response = await api.post<{ success: boolean; document_id?: string; document_no?: string }>(
        `/pr/${request.pr_id}/convert`,
        { convert_to: request.convert_to, line_ids: request.line_ids }
      );
      return response.data;
    } catch (error) {
      logger.error('prService.convert error:', error);
      return { success: false };
    }
  },

  // ==================== ATTACHMENT OPERATIONS ====================

  uploadAttachment: async (prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock uploadAttachment:', prId);
      return { success: true, attachment_id: `att-${Date.now()}` };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<{ success: boolean; attachment_id?: string }>(
        `/pr/${prId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      logger.error('prService.uploadAttachment error:', error);
      return { success: false };
    }
  },

  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    if (USE_MOCK) {
      logger.log('[prService] Mock deleteAttachment:', prId, attachmentId);
      return true;
    }

    try {
      await api.delete(`/pr/${prId}/attachments/${attachmentId}`);
      return true;
    } catch (error) {
      logger.error('prService.deleteAttachment error:', error);
      return false;
    }
  },
};

export default prService;

