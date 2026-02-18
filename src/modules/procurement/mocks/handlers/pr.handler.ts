import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_PRS, DEPARTMENT_MOCK_MAP } from '../data/prData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';
import type { PRHeader, CreatePRPayload, CreatePRLineItem } from '@/modules/procurement/types/pr-types';

/**
 * Interface for Mock List Processing
 * Includes synthetic fields for filtering/sorting that aren't in the DB schema
 */
interface MockPRListItem extends PRHeader {
    department: string;  // Mapped from cost_center_id
    pr_date_no: string;  // Synthetic sort key
}

/**
 * Helper: Generate next PR Number (PR-YYYYMM-XXXX)
 */
const generateNextPRNumber = (items: PRHeader[]): string => {
    const now = new Date();
    const prefix = `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const maxSeq = items
      .filter(p => p.pr_no && p.pr_no.startsWith(prefix))
      .reduce((max, p) => {
        const parts = p.pr_no.split('-');
        const seq = parseInt(parts[2] || '0', 10);
        return seq > max ? seq : max;
      }, 0);

    return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
};

export const setupPRHandlers = (mock: MockAdapter) => {
    // 1. GET PR List
    mock.onGet('/pr').reply((config: AxiosRequestConfig) => {
        const params = config.params || {};

        // Sanitizer & Enhancement Layer
        // We map to MockPRListItem to include 'department' and 'pr_date_no' for the generic filter to work
        const enhancedData: MockPRListItem[] = MOCK_PRS.map(pr => {
            const costCenterId = sanitizeId(pr.cost_center_id);
            return {
                ...pr,
                pr_id: sanitizeId(pr.pr_id),
                branch_id: sanitizeId(pr.branch_id),
                requester_user_id: sanitizeId(pr.requester_user_id),
                cost_center_id: costCenterId,
                
                // Synthetic Fields for Filter/Sort
                department: DEPARTMENT_MOCK_MAP[costCenterId] || '', 
                pr_date_no: `${pr.pr_date}_${pr.pr_no}`
            };
        });

        const result = applyMockFilters(enhancedData, params, {
            searchableFields: ['pr_no', 'requester_name', 'purpose', 'department'],
            dateField: 'pr_date'
        });

        return [200, result];
    });

    // 2. GET PR Detail
    mock.onGet(/\/pr\/.+/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/').pop());
        const found = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        
        if (found) {
            const sanitized: PRHeader = {
                ...found,
                pr_id: sanitizeId(found.pr_id),
                branch_id: sanitizeId(found.branch_id),
                requester_user_id: sanitizeId(found.requester_user_id),
                cost_center_id: sanitizeId(found.cost_center_id),
                lines: (found.lines || []).map(line => ({
                    ...line,
                    pr_line_id: sanitizeId(line.pr_line_id),
                    pr_id: sanitizeId(line.pr_id),
                    item_id: sanitizeId(line.item_id),
                    uom_id: sanitizeId(line.uom_id),
                }))
            };
            return [200, sanitized];
        }
        return [404, { message: 'PR Not Found' }];
    });

    // 3. POST Create PR
    mock.onPost('/pr').reply((config: AxiosRequestConfig) => {
        const data = JSON.parse(config.data || '{}') as CreatePRPayload;
        const newPrId = `pr-${Date.now()}`;
        
        // Logic Fix: Check if status is PENDING (submitted immediately)
        const isPending = data.status === 'PENDING';
        const newPrNo = isPending 
            ? generateNextPRNumber(MOCK_PRS) 
            : `DRAFT-TEMP-${Date.now()}`;

        const newPR: PRHeader = {
            ...data,
            pr_id: newPrId,
            pr_no: newPrNo,
            status: isPending ? 'PENDING' : 'DRAFT',
            total_amount: 0, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by_user_id: '1',
            updated_by_user_id: '1',
            attachment_count: 0,
            requester_name: 'Mock Requester',
            purpose: data.remark || '',
            cost_center_id: sanitizeId(data.cost_center_id),
            branch_id: sanitizeId(data.branch_id),
            requester_user_id: sanitizeId(data.requester_user_id),
            lines: (data.items || []).map((item: CreatePRLineItem, index: number) => ({
                pr_line_id: `l-${Date.now()}-${index}`,
                pr_id: newPrId,
                line_no: index + 1,
                item_id: sanitizeId(item.item_id),
                item_code: 'MOCK-CODE',
                item_name: 'Mock Item Name',
                uom: 'PCS',
                uom_id: sanitizeId(item.uom_id),
                qty: item.qty,
                quantity: item.qty,
                est_unit_price: item.est_unit_price,
                est_amount: 0, 
                needed_date: item.needed_date || new Date().toISOString().split('T')[0]
            }))
        };
        
        MOCK_PRS.unshift(newPR);
        return [200, newPR];
    });

    // 4. PUT Update PR
    mock.onPut(/\/pr\/.+/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/').pop());
        const pr = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        if (!pr) return [404, { message: 'PR Not Found' }];

        const data = JSON.parse(config.data || '{}') as Record<string, unknown>;
        Object.assign(pr, data, { updated_at: new Date().toISOString() });
        return [200, pr];
    });

    // 5. DELETE PR
    mock.onDelete(/\/pr\/.+/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/').pop());
        const pr = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        
        if (!pr) return [404, { message: 'PR Not Found' }];
        const index = MOCK_PRS.indexOf(pr);
        if (index > -1) {
            MOCK_PRS.splice(index, 1);
        }
        return [200, { success: true }];
    });

    // 6. SUBMIT PR
    mock.onPost(/\/pr\/.+\/submit/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const pr = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        if (pr) {
            if (pr.pr_no.startsWith('DRAFT-TEMP')) {
                pr.pr_no = generateNextPRNumber(MOCK_PRS);
            }
            pr.status = 'PENDING';
            return [200, { success: true, message: 'ส่งอนุมัติสำเร็จ', pr_no: pr.pr_no }];
        }
        return [404, { success: false, message: 'ไม่พบเอกสาร' }];
    });

    // 7. APPROVE
    mock.onPost(/\/pr\/.+\/approve/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const pr = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        if (pr) {
            pr.status = 'APPROVED';
            return [200, { success: true, message: 'อนุมัติสำเร็จ' }];
        }
        return [404, { success: false, message: 'ไม่พบเอกสาร' }];
    });

    // 8. REJECT
    mock.onPost(/\/pr\/.+\/reject/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const pr = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        if (pr) {
            pr.status = 'REJECTED';
            return [200, { success: true, message: 'ไม่อนุมัติสำเร็จ' }];
        }
        return [404, { success: false, message: 'ไม่พบเอกสาร' }];
    });

    // 9. CANCEL
    mock.onPost(/\/pr\/.+\/cancel/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const pr = MOCK_PRS.find(p => sanitizeId(p.pr_id) === id);
        if (pr) {
            pr.status = 'CANCELLED';
            return [200, { success: true, message: 'ยกเลิกสำเร็จ' }];
        }
        return [404, { success: false, message: 'ไม่พบเอกสาร' }];
    });
};
