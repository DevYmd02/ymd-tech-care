/**
 * @file MockPRService.ts
 * @description Mock implementation for PR Service with full data persistence.
 * @refactored Enforce immutable state management with structuredClone and full field preservation.
 */

import type {
  IPRService,
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
} from '../interfaces/IPRService';
import type { PRHeader, PRFormData, PRLine, ApprovalTask, CreatePRPayload } from '../../types/pr-types';
import { MOCK_PRS } from '../../__mocks__/procurementMocks';
import { getMockFlowWithSteps, MOCK_APPROVERS } from '../../__mocks__/approvalFlowMocks';

import { logger } from '../../utils/logger';

export class MockPRService implements IPRService {
  private prs: PRHeader[];

  constructor() {
    // Initialize with a deep copy of mock data
    this.prs = structuredClone(MOCK_PRS);
  }

  async getList(params?: PRListParams): Promise<PRListResponse> {
    logger.log('[MockPRService] getList', params);
    await this.delay(300);

    let filteredPRs = [...this.prs];

    if (params) {
      if (params.status && params.status !== 'ALL') {
        filteredPRs = filteredPRs.filter(pr => pr.status === params.status);
      }

      if (params.requester_name) {
        const search = params.requester_name.toLowerCase();
        filteredPRs = filteredPRs.filter(pr => pr.requester_name?.toLowerCase().includes(search));
      }

      if (params.date_from) {
        filteredPRs = filteredPRs.filter(pr => pr.request_date >= params.date_from!);
      }
      if (params.date_to) {
        filteredPRs = filteredPRs.filter(pr => pr.request_date <= params.date_to!);
      }

      if (params.cost_center_id) {
        filteredPRs = filteredPRs.filter(pr => pr.cost_center_id === params.cost_center_id);
      }

      if (params.project_id) {
        filteredPRs = filteredPRs.filter(pr => pr.project_id === params.project_id);
      }
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPRs = filteredPRs.slice(startIndex, endIndex);

    return {
      data: structuredClone(paginatedPRs),
      total: filteredPRs.length,
      page,
      limit,
    };
  }

  async getById(prId: string): Promise<PRHeader | null> {
    logger.log('[MockPRService] getById', prId);
    await this.delay(200);
    const pr = this.prs.find(pr => pr.pr_id === prId);
    return pr ? structuredClone(pr) : null;
  }

  async create(payload: CreatePRPayload): Promise<PRHeader | null> {
    logger.log('[MockPRService] create (batch)', payload);
    await this.delay(500);

    const now = new Date();
    const prId = `pr-${Date.now()}`;
    // Auto-generate PR NO
    const prNo = `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(this.prs.length + 1).padStart(4, '0')}`;

    // Map items -> PRLine
    const lines: PRLine[] = payload.items.map((item, idx) => ({
      pr_id: prId,
      pr_line_id: `line-${Date.now()}-${idx}`,
      line_no: idx + 1,
      item_id: item.item_id || `temp-item-${idx}`, // Fallback if no ID
      item_code: item.item_code,
      item_name: item.item_name,
      item_description: '', // Optional in payload, default empty
      quantity: item.qty,
      uom: item.uom,
      est_unit_price: item.price,
      est_amount: item.qty * item.price,
      needed_date: item.needed_date || payload.required_date || now.toISOString().split('T')[0],
      remark: item.remark
    }));

    // Calculate total
    const totalAmount = lines.reduce((sum, line) => sum + line.est_amount, 0);

    // Create Header
    const newPR: PRHeader = {
      pr_id: prId,
      pr_no: prNo,
      // Map Payload Fields
      request_date: payload.pr_date,
      purpose: payload.remark || '', // map remark -> purpose
      cost_center_id: payload.department_id || 'cc-default', // map department_id -> cost_center_id
      project_id: payload.project_id,
      requester_name: payload.requester_name || 'Anonymous',
      required_date: payload.required_date || '',
      
      // Additional UI Fields
      delivery_date: payload.delivery_date,
      credit_days: payload.credit_days,
      vendor_quote_no: payload.vendor_quote_no,
      shipping_method: payload.shipping_method,
      remarks: payload.remark, // Also store in remarks
      preferred_vendor_id: payload.preferred_vendor_id,
      vendor_name: payload.vendor_name,

      // System Fields
      branch_id: 'branch-001',
      requester_user_id: 'user-001',
      status: 'PENDING',
      currency_code: 'THB',
      total_amount: totalAmount,
      attachment_count: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      created_by_user_id: 'user-001',
      updated_by_user_id: 'user-001',
      
      lines: lines
    };

    // Store in internal array
    this.prs.unshift(structuredClone(newPR));
    
    return structuredClone(newPR);
  }

  async update(prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> {
    logger.log('[MockPRService] update', prId, data);
    await this.delay(500);

    const index = this.prs.findIndex(pr => pr.pr_id === prId);
    if (index === -1) return null;

    const existingPR = this.prs[index];

    // Handle lines update specifically if provided
    let updatedLines = existingPR.lines;
    if (data.lines) {
      updatedLines = data.lines.map((l, idx) => ({
        ...l,
        pr_line_id: (l as typeof l & { pr_line_id?: string }).pr_line_id || `line-${Date.now()}-${idx}`,
        pr_id: prId,
        line_no: idx + 1
      })) as PRLine[];
    }

    // Merge existing object with updates using spread
    const updatedPR: PRHeader = {
      ...existingPR,
      ...data,
      requester_name: data.requester_name || existingPR.requester_name,
      lines: updatedLines,
      updated_at: new Date().toISOString()
    };

    // Save and return
    this.prs[index] = structuredClone(updatedPR);
    return structuredClone(updatedPR);
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

    const updatedPR: PRHeader = {
      ...pr,
      status: 'PENDING',
      approval_tasks: [newTask],
    };

    this.prs[prIndex] = structuredClone(updatedPR);

    return { success: true, message: `ส่งอนุมัติเรียบร้อย (เสนอ: ${approverName})` };
  }

  async approve(prId: string): Promise<boolean> {
    logger.log('[MockPRService] approve', prId);
    await this.delay(500);

    const prIndex = this.prs.findIndex(pr => pr.pr_id === prId);
    if (prIndex === -1) return false;

    const pr = this.prs[prIndex];
    
    // Update status to APPROVED
    const updatedPR: PRHeader = {
      ...pr,
      status: 'APPROVED',
      updated_at: new Date().toISOString()
    };

    // Update internal state
    this.prs[prIndex] = structuredClone(updatedPR);
    
    return true;
  }

  async cancel(prId: string, remark?: string): Promise<{ success: boolean; message: string }> {
    logger.log('[MockPRService] cancel', prId, remark);
    const index = this.prs.findIndex(pr => pr.pr_id === prId);
    if (index !== -1) {
      const cancelledPR: PRHeader = { ...this.prs[index], status: 'CANCELLED' };
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

  async generateNextDocumentNo(): Promise<string> {
    logger.log('[MockPRService] generateNextDocumentNo');
    await this.delay(300);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PR-${year}${month}-`;

    // Filter existing PRs that match the current month's prefix
    const existingPRs = this.prs.filter(pr => pr.pr_no && pr.pr_no.startsWith(prefix));

    if (existingPRs.length === 0) {
      return `${prefix}0001`;
    }

    // Find the highest sequence number
    const maxSequence = existingPRs.reduce((max, pr) => {
      const parts = pr.pr_no.split('-');
      if (parts.length === 3) {
        const sequence = parseInt(parts[2], 10);
        return !isNaN(sequence) && sequence > max ? sequence : max;
      }
      return max;
    }, 0);

    // Increment and pad with zeros
    return `${prefix}${String(maxSequence + 1).padStart(4, '0')}`;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
