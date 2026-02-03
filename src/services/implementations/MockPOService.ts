/**
 * @file MockPOService.ts
 * @description Mock implementation for Purchase Order (PO) Service
 * @refactored Enforce immutable state management with structuredClone
 */

import type { IPOService } from '../interfaces/IPOService';
import type { POListParams, POListResponse, POListItem, CreatePOPayload, POLine } from '../../types/po-types';

const MOCK_POS: POListItem[] = [
    {
        po_id: 'po-001',
        po_no: 'PO2024-001',
        po_date: '2024-01-22',
        pr_id: 'pr-001',
        pr_no: 'PR2024-001',
        vendor_id: 'v-001',
        vendor_name: 'บริษัท ABC จำกัด',
        branch_id: 'br-001',
        status: 'DRAFT',
        currency_code: 'THB',
        exchange_rate: 1,
        payment_term_days: 30,
        subtotal: 100000,
        tax_amount: 7000,
        total_amount: 107000.00,
        created_by: 'u-001',
        item_count: 3
    },
    {
        po_id: 'po-002',
        po_no: 'PO2024-002',
        po_date: '2024-01-23',
        pr_id: 'pr-002',
        pr_no: 'PR2024-002',
        vendor_id: 'v-002',
        vendor_name: 'บริษัท XYZ จำกัด',
        branch_id: 'br-001',
        status: 'APPROVED',
        currency_code: 'THB',
        exchange_rate: 1,
        payment_term_days: 30,
        subtotal: 250000,
        tax_amount: 17500,
        total_amount: 267500.00,
        created_by: 'u-001',
        item_count: 5
    },
    {
        po_id: 'po-003',
        po_no: 'PO2024-003',
        po_date: '2024-01-24',
        pr_id: 'pr-003',
        pr_no: 'PR2024-003',
        vendor_id: 'v-003',
        vendor_name: 'ห้างหุ้นส่วน DEF',
        branch_id: 'br-001',
        status: 'ISSUED',
        currency_code: 'THB',
        exchange_rate: 1,
        payment_term_days: 45,
        subtotal: 150000,
        tax_amount: 10500,
        total_amount: 160500.00,
        created_by: 'u-002',
        item_count: 4
    }
];

export class MockPOService implements IPOService {
    private pos: POListItem[];
    private poLines: POLine[] = []; // Store lines separately to simulate DB

    constructor() {
        this.pos = structuredClone(MOCK_POS);
    }

    async getList(params?: POListParams): Promise<POListResponse> {
        // No delay for instant loading

        let data = this.pos; // Reference to internal state

        if (params?.status && params.status !== 'ALL') {
            data = data.filter(item => item.status === params.status);
        }

        if (params?.po_no) {
            const term = params.po_no.toLowerCase();
            data = data.filter(item => item.po_no.toLowerCase().includes(term));
        }
        
        if (params?.pr_no) {
            const term = params.pr_no.toLowerCase();
            data = data.filter(item => item.pr_no && item.pr_no.toLowerCase().includes(term));
        }

        if (params?.vendor_name) {
            const term = params.vendor_name.toLowerCase();
            data = data.filter(item => item.vendor_name && item.vendor_name.toLowerCase().includes(term));
        }

        // Pagination logic
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = data.slice(startIndex, endIndex);

        return {
            data: structuredClone(paginatedData), // Return deep copy
            total: data.length,
            page,
            limit
        };
    }

    async getById(id: string): Promise<POListItem | null> {
        const item = this.pos.find(p => p.po_id === id);
        return item ? structuredClone(item) : null;
    }

    async create(payload: CreatePOPayload): Promise<void> {
       const poId = `po-${Date.now()}`;
       const poNo = `PO${new Date().getFullYear()}-${String(this.pos.length + 1).padStart(3, '0')}`;

       // 1. Create Header
       const newPO: POListItem = {
           po_id: poId,
           po_no: poNo,
           po_date: payload.order_date,
           pr_id: payload.ref_pr_id || '', 
           pr_no: payload.ref_pr_id ? `PR-${payload.ref_pr_id}` : '',
           vendor_id: payload.vendor_id,
           vendor_name: 'Vendor Name (Mock)',
           branch_id: '1',
           status: 'DRAFT',
           currency_code: 'THB',
           exchange_rate: 1,
           payment_term_days: payload.payment_term ? parseInt(payload.payment_term) : 30, // Map string to int if possible
           subtotal: payload.subtotal || 0,
           tax_amount: payload.tax_amount || 0,
           total_amount: payload.total_amount || 0,
           created_by: 'user-1',
           created_at: new Date().toISOString(),
           valid_until: payload.delivery_date, // Map delivery_date
           remarks: payload.remarks || '',
           item_count: payload.items.length
       } as POListItem; // Cast to satisfy POListItem if needed, though structure should match

       // 2. Loop Items -> Create Lines (Batch)
       const newLines: POLine[] = payload.items.map((item, index) => ({
           po_line_id: `pol-${Date.now()}-${index}`,
           po_id: poId,
           item_id: item.item_id,
           item_code: item.item_id, // Mock: use id as code
           qty_ordered: item.qty,
           qty_received: 0,
           unit_price: item.unit_price,
           discount_amount: item.discount || 0,
           line_total: (item.qty * item.unit_price) - (item.discount || 0),
           uom_id: 'uom-1', // Mock
           required_receipt_type: 'GOODS'
       }));

       // 3. Save to "DB"
       this.poLines.push(...newLines);
       this.pos.unshift(newPO);
       
       console.log('[MockPOService] Created PO:', newPO);
       console.log('[MockPOService] Created Lines:', newLines);
    }
}
