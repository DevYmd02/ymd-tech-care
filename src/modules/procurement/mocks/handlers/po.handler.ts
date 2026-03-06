import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_POS } from '@/modules/procurement/mocks/data/poData';

import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';
import type { POListItem, POLine } from '@/modules/procurement/types';
import type { POStatus } from '@/modules/procurement/schemas/po-schemas';

// ---------------------------------------------------------------------------
// Helper: Generate next PO Number
// ---------------------------------------------------------------------------
const generateNextPONumber = (): string => {
    const now = new Date();
    const prefix = `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const maxSeq = MOCK_POS
        .filter(p => p.po_no?.startsWith(prefix))
        .reduce((max, p) => {
            const seq = parseInt(p.po_no?.split('-').pop() || '0', 10);
            return seq > max ? seq : max;
        }, 0);
    return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
};

// ---------------------------------------------------------------------------
// Helper: Transition PO status (enforces state machine)
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS: Partial<Record<POStatus, POStatus>> = {
    DRAFT:            'PENDING_APPROVAL',
    PENDING_APPROVAL: 'APPROVED',
    APPROVED:         'ISSUED',
    ISSUED:           'COMPLETED',
};

export const setupPOHandlers = (mock: MockAdapter) => {
    // ── 1. GET PO List ──────────────────────────────────────────────────────
    mock.onGet('/purchase-orders').reply((config: AxiosRequestConfig) => {
        const params = config.params || {};
        const sanitizedData = MOCK_POS.map(po => ({
            ...po,
            po_id:     sanitizeId(po.po_id),
            pr_id:     sanitizeId(po.pr_id),
            qc_id:     sanitizeId(po.qc_id),
            vendor_id: sanitizeId(po.vendor_id),
            branch_id: sanitizeId(po.branch_id),
        }));

        const result = applyMockFilters(sanitizedData, params, {
            searchableFields: ['po_no', 'vendor_name', 'qc_no', 'pr_no'],
            dateField: 'po_date',
        });

        return [200, result];
    });

    // ── 2. GET PO Detail ────────────────────────────────────────────────────
    mock.onGet(/\/purchase-orders\/.+/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/').pop());
        const found = MOCK_POS.find(p => sanitizeId(p.po_id) === id);

        interface POWithLines extends POListItem { lines?: POLine[]; }

        if (found) {
            const poWithLines = found as POWithLines;
            const sanitized = {
                ...found,
                po_id:     sanitizeId(found.po_id),
                pr_id:     sanitizeId(found.pr_id),
                qc_id:     sanitizeId(found.qc_id),
                vendor_id: sanitizeId(found.vendor_id),
                branch_id: sanitizeId(found.branch_id),
                lines: (poWithLines.lines || []).map((line: POLine) => ({
                    ...line,
                    po_line_id: sanitizeId(line.po_line_id),
                    po_id:      sanitizeId(line.po_id),
                    pr_line_id: sanitizeId(line.pr_line_id),
                    item_id:    sanitizeId(line.item_id),
                })),
            };
            return [200, sanitized];
        }
        return [404, { message: 'PO Not Found' }];
    });

    // ── 3. POST Create PO ───────────────────────────────────────────────────
    mock.onPost('/purchase-orders').reply((config: AxiosRequestConfig) => {
        const body = config.data ? JSON.parse(config.data) : {};

        // Basic guard: qc_id and vendor_id are required per CreatePOSchema
        if (!body.qc_id || !body.vendor_id) {
            return [400, { message: 'qc_id and vendor_id are required to create a PO', success: false }];
        }

        const newPO: POListItem = {
            po_id:            `po-${Date.now()}`,
            po_no:            generateNextPONumber(),
            po_date:          body.po_date || new Date().toISOString().split('T')[0],
            pr_id:            sanitizeId(body.pr_id || ''),
            pr_no:            body.pr_no || '',
            qc_id:            sanitizeId(body.qc_id),
            qc_no:            body.qc_no || '',
            vendor_id:        sanitizeId(body.vendor_id),
            vendor_name:      body.vendor_name || 'Unknown Vendor',
            branch_id:        sanitizeId(body.branch_id || ''),
            status:           'DRAFT',
            currency_code:    body.currency_code || 'THB',
            exchange_rate:    body.exchange_rate ?? 1,
            payment_term_days: body.payment_term_days ?? 30,
            subtotal:         body.subtotal ?? 0,
            tax_amount:       body.tax_amount ?? 0,
            total_amount:     body.total_amount ?? 0,
            remarks:          body.remarks || '',
            created_by:       'mock-user',
            item_count:       (body.lines ?? []).length,
            transactions:     [{
                id: `tx-${Date.now()}`,
                po_id: `po-${Date.now()}`,
                from_status: undefined,
                to_status: 'DRAFT',
                action_by: 'mock-user',
                action_date: new Date().toISOString()
            }]
        };

        MOCK_POS.unshift(newPO);
        return [201, newPO];
    });

    // ── 4. POST Issue PO (APPROVED → ISSUED) ────────────────────────────────
    mock.onPost(/\/purchase-orders\/.+\/issue/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const po = MOCK_POS.find(p => sanitizeId(p.po_id) === id);
        if (!po) return [404, { message: 'PO Not Found' }];
        if (po.status !== 'APPROVED') {
            return [422, { message: `Cannot issue PO in status: ${po.status}` }];
        }
        const prevStatus = po.status;
        po.status = 'ISSUED';
        if (!po.transactions) po.transactions = [];
        po.transactions.push({
            id: `tx-${Date.now()}`, po_id: po.po_id,
            from_status: prevStatus as POStatus, to_status: 'ISSUED',
            action_by: 'mock-user', action_date: new Date().toISOString()
        });
        return [200, { success: true, message: `PO ${po.po_no} ออก PO เรียบร้อย` }];
    });

    // ── 5. POST Approve PO (DRAFT → PENDING_APPROVAL or PENDING_APPROVAL → APPROVED)
    mock.onPost(/\/purchase-orders\/.+\/approve/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const po = MOCK_POS.find(p => sanitizeId(p.po_id) === id);
        if (!po) return [404, { message: 'PO Not Found' }];

        const nextStatus = VALID_TRANSITIONS[po.status as POStatus];
        if (!nextStatus || (po.status !== 'DRAFT' && po.status !== 'PENDING_APPROVAL')) {
            return [422, { message: `Cannot approve PO in status: ${po.status}` }];
        }
        const prevStatus = po.status;
        po.status = nextStatus;
        if (!po.transactions) po.transactions = [];
        po.transactions.push({
            id: `tx-${Date.now()}`, po_id: po.po_id,
            from_status: prevStatus as POStatus, to_status: nextStatus,
            action_by: 'mock-user', action_date: new Date().toISOString()
        });
        const msg = po.status === 'PENDING_APPROVAL' ? 'ส่งอนุมัติเรียบร้อย' : 'อนุมัติเรียบร้อย';
        return [200, { success: true, message: `PO ${po.po_no} ${msg}` }];
    });

    // ── 6. POST Reject PO (PENDING_APPROVAL → REJECTED) ─────────────────────────
    mock.onPost(/\/purchase-orders\/.+\/reject/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const body = config.data ? JSON.parse(config.data) : {};
        const po = MOCK_POS.find(p => sanitizeId(p.po_id) === id);
        if (!po) return [404, { message: 'PO Not Found' }];
        if (po.status === 'COMPLETED') {
            return [422, { message: 'Cannot reject a COMPLETED PO' }];
        }
        const prevStatus = po.status;
        po.status = 'REJECTED';
        po.reject_reason = body.remark || '';
        if (!po.transactions) po.transactions = [];
        po.transactions.push({
            id: `tx-${Date.now()}`, po_id: po.po_id,
            from_status: prevStatus as POStatus, to_status: 'REJECTED',
            action_by: 'mock-user', action_date: new Date().toISOString(),
            remark: body.remark || ''
        });

        return [200, { success: true, message: `PO ${po.po_no} ไม่อนุมัติเรียบร้อย` }];
    });

    // ── 7. POST GRN Trigger (ISSUED → COMPLETED) ───────────────────────────
    //    Placeholder: real GRN flow will be in grn.handler.ts, but this
    //    endpoint allows the PO to close when goods are fully received.
    mock.onPost(/\/purchase-orders\/.+\/complete/).reply((config: AxiosRequestConfig) => {
        const id = sanitizeId(config.url?.split('/')[2]);
        const po = MOCK_POS.find(p => sanitizeId(p.po_id) === id);
        if (!po) return [404, { message: 'PO Not Found' }];
        if (po.status !== 'ISSUED') {
            return [422, { message: `Cannot complete PO in status: ${po.status}` }];
        }
        po.status = 'COMPLETED';
        return [200, { success: true, message: `PO ${po.po_no} ปิดรายการเรียบร้อย` }];
    });
};
