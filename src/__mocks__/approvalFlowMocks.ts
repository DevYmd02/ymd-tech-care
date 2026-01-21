/**
 * @file approvalFlowMocks.ts
 * @description Mock Data สำหรับ Approval Workflow Config
 */

import type { ApprovalFlow, ApprovalFlowStep } from '../types/master-data-types';

// ====================================================================================
// FLOW IDs
// ====================================================================================
const FLOW_PR_LOW = 'flow-pr-low'; // < 50,000
const FLOW_PR_HIGH = 'flow-pr-high'; // >= 50,000

// ====================================================================================
// MOCK USERS (Reference)
// ====================================================================================
export const MOCK_APPROVERS = {
    dept_manager: {
        id: 'user-manager-001',
        name: 'สมชาย จัดการแผนก',
        position: 'Department Manager'
    },
    vp_purchase: {
        id: 'user-vp-001',
        name: 'วิชัย รองกรรมการ',
        position: 'VP of Purchasing'
    }
};

// ====================================================================================
// APPROVAL FLOWS
// ====================================================================================
export const MOCK_APPROVAL_FLOWS: ApprovalFlow[] = [
    {
        flow_id: FLOW_PR_LOW,
        doc_type: 'PR',
        min_amount: 0,
        max_amount: 49999.99,
    },
    {
        flow_id: FLOW_PR_HIGH,
        doc_type: 'PR',
        min_amount: 50000,
        max_amount: 999999999,
    }
];

// ====================================================================================
// APPROVAL STEPS
// ====================================================================================
// Flow Low (< 50k): Manager (1 step)
// Flow High (>= 50k): Manager -> VP (2 steps)

export const MOCK_APPROVAL_STEPS: ApprovalFlowStep[] = [
    // Flow Low Steps
    {
        step_id: 'step-low-1',
        flow_id: FLOW_PR_LOW,
        approver_user_id: MOCK_APPROVERS.dept_manager.id,
        sequence_no: 1,
    },

    // Flow High Steps
    {
        step_id: 'step-high-1',
        flow_id: FLOW_PR_HIGH,
        approver_user_id: MOCK_APPROVERS.dept_manager.id,
        sequence_no: 1,
    },
    {
        step_id: 'step-high-2',
        flow_id: FLOW_PR_HIGH,
        approver_user_id: MOCK_APPROVERS.vp_purchase.id,
        sequence_no: 2,
    }
];

// Helper to get full flow with steps
export const getMockFlowWithSteps = (docType: string, amount: number) => {
    const flow = MOCK_APPROVAL_FLOWS.find(f => 
        f.doc_type === docType && 
        amount >= f.min_amount && 
        amount <= f.max_amount
    );

    if (!flow) return null;

    const steps = MOCK_APPROVAL_STEPS
        .filter(s => s.flow_id === flow.flow_id)
        .sort((a, b) => a.sequence_no - b.sequence_no);

    return { ...flow, approval_flow_steps: steps };
};
