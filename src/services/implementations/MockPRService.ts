/**
 * @file MockPRService.ts
 * @description Mock implementation for PR Service
 * @refactored Enforce immutable state management with structuredClone
 */

import type {
  IPRService,
  PRListParams,
  PRListResponse,
  ApprovalRequest,
  ApprovalResponse,
  ConvertPRRequest,
} from '../interfaces/IPRService';
import type { PRHeader, PRFormData, ApprovalTask } from '../../types/pr-types';
import { MOCK_PRS } from '../../__mocks__/procurementMocks';
import { getMockFlowWithSteps, MOCK_APPROVERS } from '../../__mocks__/approvalFlowMocks';
import { logger } from '../../utils/logger';

export class MockPRService implements IPRService {
  private prs: PRHeader[];

  constructor() {
    this.prs = structuredClone(MOCK_PRS);
  }

  async getList(params?: PRListParams): Promise<PRListResponse> {
    logger.log('[MockPRService] getList', params);
    await this.delay(300);

    let filteredPRs = this.prs; // Works with reference initially

    if (params) {
      // Filter by status
      if (params.status && params.status !== 'ALL') {
        filteredPRs = filteredPRs.filter(pr => pr.status === params.status);
      }

      // Filter by requester name (partial match)
      if (params.requester_name) {
        const search = params.requester_name.toLowerCase();
        filteredPRs = filteredPRs.filter(pr => pr.requester_name?.toLowerCase().includes(search));
      }

      // Filter by date range
      if (params.date_from) {
        filteredPRs = filteredPRs.filter(pr => pr.request_date >= params.date_from!);
      }
      if (params.date_to) {
        filteredPRs = filteredPRs.filter(pr => pr.request_date <= params.date_to!);
      }

      // Filter by cost center
      if (params.cost_center_id) {
        filteredPRs = filteredPRs.filter(pr => pr.cost_center_id === params.cost_center_id);
      }

      // Filter by project
      if (params.project_id) {
        filteredPRs = filteredPRs.filter(pr => pr.project_id === params.project_id);
      }
    }

    // Return deep copy
    return {
      data: structuredClone(filteredPRs),
      total: filteredPRs.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  }

  async getById(prId: string): Promise<PRHeader | null> {
    logger.log('[MockPRService] getById', prId);
    await this.delay(200);
    const pr = this.prs.find(pr => pr.pr_id === prId);
    return pr ? structuredClone(pr) : null;
  }

  async create(data: PRFormData): Promise<PRHeader | null> {
    logger.log('[MockPRService] create', data);

    const newPR: PRHeader = {
      pr_id: `pr-${Date.now()}`,
      pr_no: `PR-202601-${String(this.prs.length + 1).padStart(4, '0')}`,
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

    // Store copy
    this.prs.unshift(structuredClone(newPR));
    
    // Return copy
    return structuredClone(newPR);
  }

  async update(prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> {
    logger.log('[MockPRService] update', prId, data);
    const index = this.prs.findIndex(pr => pr.pr_id === prId);
    if (index !== -1) {
      // Create fresh object with merged data
      const updatedPR = { ...this.prs[index], ...(data as unknown as Partial<PRHeader>) };
      // Save deep copy to internal state (just in case data props are refs)
      this.prs[index] = structuredClone(updatedPR);
      // Return fresh deep copy
      return structuredClone(updatedPR);
    }
    return null;
  }

  async delete(prId: string): Promise<boolean> {
    logger.log('[MockPRService] delete', prId);
    const index = this.prs.findIndex(pr => pr.pr_id === prId);
    if (index !== -1) {
      this.prs.splice(index, 1);
    }
    return true;
  }

  async submit(prId: string): Promise<{ success: boolean; message: string }> {
    logger.log('[MockPRService] submit', prId);

    const prIndex = this.prs.findIndex(pr => pr.pr_id === prId);
    if (prIndex === -1) return { success: false, message: 'PR not found' };

    const pr = this.prs[prIndex];
    const flowConfig = getMockFlowWithSteps('PR', pr.total_amount);

    if (!flowConfig || !flowConfig.approval_flow_steps || flowConfig.approval_flow_steps.length === 0) {
      return { success: false, message: 'ไม่พบ Flow การอนุมัติสำหรับยอดเงินนี้' };
    }

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
      created_at: new Date().toISOString(),
    };

    const updatedPR = {
      ...pr,
      status: 'PENDING' as const,
      approval_tasks: [newTask],
    };

    this.prs[prIndex] = structuredClone(updatedPR);

    return { success: true, message: `ส่งอนุมัติเรียบร้อย (เสนอ: ${approverName})` };
  }

  async approve(request: ApprovalRequest): Promise<ApprovalResponse> {
    logger.log('[MockPRService] approve', request);

    const prIndex = this.prs.findIndex(pr => pr.pr_id === request.pr_id);
    if (prIndex === -1) return { success: false, message: 'PR not found' };

    // Work on a deep copy to ensure atomic update
    const pr = structuredClone(this.prs[prIndex]);
    const currentTasks = [...(pr.approval_tasks || [])];
    const pendingTaskIndex = currentTasks.findIndex(t => t.status === 'PENDING');

    if (pendingTaskIndex === -1) {
      return { success: false, message: 'ไม่พบงานที่รออนุมัติ' };
    }

    const updatedTask: ApprovalTask = {
      ...currentTasks[pendingTaskIndex],
      status: request.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approved_at: new Date().toISOString(),
      remark: request.remark,
    };

    const newTasks = [...currentTasks];
    newTasks[pendingTaskIndex] = updatedTask;

    if (request.action === 'REJECT') {
      const rejectedPR = {
        ...pr,
        status: 'CANCELLED' as const,
        approval_tasks: newTasks,
      };
      
      this.prs[prIndex] = rejectedPR; // Save
      
      return { success: true, message: 'ไม่อนุมัติเอกสารเรียบร้อย', approval_task: structuredClone(updatedTask) };
    }

    const flowConfig = getMockFlowWithSteps('PR', pr.total_amount);
    if (flowConfig && flowConfig.approval_flow_steps) {
      const currentStepSeq = pendingTaskIndex + 1;
      const nextStep = flowConfig.approval_flow_steps.find(s => s.sequence_no === currentStepSeq + 1);

      if (nextStep) {
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
          status: 'PENDING',
          created_at: new Date().toISOString(),
        };

        const progressingPR = {
          ...pr,
          status: 'PENDING' as const,
          approval_tasks: [...newTasks, nextTask],
        };

        this.prs[prIndex] = progressingPR;

        return { success: true, message: `อนุมัติเรียบร้อย (ส่งต่อ: ${approverName})`, approval_task: structuredClone(updatedTask) };
      }

      const approvedPR = {
        ...pr,
        status: 'APPROVED' as const,
        approval_tasks: newTasks,
      };

      this.prs[prIndex] = approvedPR;
      
      return { success: true, message: 'อนุมัติเอกสารเสร็จสมบูรณ์', approval_task: structuredClone(updatedTask) };
    }

    // Default case (should not happen if flow exists)
    const defaultPR = { 
        ...pr, 
        approval_tasks: newTasks 
    };
    this.prs[prIndex] = defaultPR;
    
    return { success: true, message: 'บันทึกเรียบร้อย', approval_task: structuredClone(updatedTask) };
  }

  async cancel(prId: string, remark?: string): Promise<{ success: boolean; message: string }> {
    logger.log('[MockPRService] cancel', prId, remark);
    const index = this.prs.findIndex(pr => pr.pr_id === prId);
    if (index !== -1) {
      const cancelledPR = { ...this.prs[index], status: 'CANCELLED' as const };
      this.prs[index] = cancelledPR;
    }
    return { success: true, message: 'ยกเลิกสำเร็จ (Mock)' };
  }

  async convert(request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> {
    logger.log('[MockPRService] convert', request);
    return { success: true, document_id: 'doc-001', document_no: 'RFQ-001' };
  }

  async uploadAttachment(prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> {
    logger.log('[MockPRService] uploadAttachment', prId, file.name);
    return { success: true, attachment_id: `att-${Date.now()}` };
  }

  async deleteAttachment(prId: string, attachmentId: string): Promise<boolean> {
    logger.log('[MockPRService] deleteAttachment', prId, attachmentId);
    return true;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
