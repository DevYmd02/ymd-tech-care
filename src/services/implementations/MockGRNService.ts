import type { IGRNService } from '../interfaces/IGRNService';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload, GRNStatus, GRNLine } from '@/types/grn-types';

// Mock Data Generation
const MOCK_DATA: GRNListItem[] = Array.from({ length: 15 }).map((_, i) => {
    const statuses: GRNStatus[] = ['DRAFT', 'POSTED', 'RETURNED', 'REVERSED'];
    const status = statuses[i % 4];
    return {
        grn_id: `grn-${i + 1}`,
        grn_no: `GRN-202402-${String(i + 1).padStart(3, '0')}`,
        po_id: `po-${i + 1}`,
        po_no: `PO-202401-${String(i + 1).padStart(3, '0')}`,
        received_date: new Date(2024, 1, i + 1).toISOString(),
        warehouse_id: 'wh-01',
        warehouse_name: 'Main Warehouse',
        received_by: 'user-01',
        received_by_name: 'Admin User',
        status: status,
        remark: i % 3 === 0 ? 'Late delivery' : '',
        item_count: Math.floor(Math.random() * 10) + 1,
        vendor_name: `Vendor ${i + 1}`, // Added missing required property if any
        grand_total: 1000 * (i + 1), // Added potential missing property
    };
});

export class MockGRNService implements IGRNService {
    private grnLines: GRNLine[] = []; // Store lines separately
    async getList(params?: GRNListParams): Promise<GRNListResponse> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let data = [...MOCK_DATA];

        if (params?.grn_no) {
            data = data.filter(d => d.grn_no.toLowerCase().includes(params.grn_no!.toLowerCase()));
        }

        if (params?.status && params.status !== 'ALL') {
            data = data.filter(d => d.status === params.status);
        }

        const page = params?.page || 1;
        const limit = params?.limit || 10;
        // const start = (page - 1) * limit;
        // const end = start + limit;

        return {
            data: data, // Return ALL data, no slicing
            total: data.length,
            page,
            limit
        };
    }

    async getById(id: string): Promise<GRNListItem | null> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_DATA.find(d => d.grn_id === id) || null;
    }

    async getSummaryCounts(): Promise<GRNSummaryCounts> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            DRAFT: MOCK_DATA.filter(d => d.status === 'DRAFT').length,
            POSTED: MOCK_DATA.filter(d => d.status === 'POSTED').length,
            REVERSED: MOCK_DATA.filter(d => d.status === 'REVERSED').length,
            RETURNED: MOCK_DATA.filter(d => d.status === 'RETURNED').length,
        };
    }

    async create(payload: CreateGRNPayload): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const grnId = `grn-${Date.now()}`;
        const grnNo = `GRN-${new Date().getFullYear()}-${String(MOCK_DATA.length + 1).padStart(3, '0')}`;

        // 1. Create Header
        const newGRN: GRNListItem = {
            grn_id: grnId,
            grn_no: grnNo,
            po_id: payload.po_id,
            po_no: `PO-REF-${payload.po_id}`, // Mock
            received_date: payload.received_date,
            warehouse_id: payload.warehouse_id,
            warehouse_name: 'Warehouse (Mock)',
            received_by: 'user-001',
            received_by_name: 'Admin User',
            status: 'DRAFT', // Default to DRAFT
            remark: payload.remark,
            item_count: payload.items.length,
            total_amount: 0 // Would calculate from lines if we had price
        };

        // 2. Loop Items
        const newLines: GRNLine[] = payload.items.map((item, index) => ({
            grn_line_id: `grn-line-${Date.now()}-${index}`,
            grn_id: grnId,
            item_code: item.item_id, // Mock lookup
            item_name: `Item ${item.item_id}`, // Mock lookup
            ordered_qty: 0, // Need to fetch PO line to know this in real app
            receiving_qty: item.receiving_qty,
            accepted_qty: item.accepted_qty,
            rejected_qty: item.rejected_qty,
            uom: 'Unit', // Mock
        }));

        // 3. Save
        this.grnLines.push(...newLines);
        // In a real Mock class we should probably modify MOCK_DATA which IS the state for getList/getById
        // But MOCK_DATA here is a const array. The previous implementation just resolved.
        // I will push to MOCK_DATA to make it slightly more stateful if MOCK_DATA was mutable, 
        // but MOCK_DATA is const. I will just log it as per previous implementation instruction "Save to mock arrays"
        // Wait, MOCK_DATA is const but the array contents are mutable? actually `const MOCK_DATA = [...]`.
        // I cannot reassign MOCK_DATA, but I can push to it.
        MOCK_DATA.unshift(newGRN);

        console.log('[MockGRNService] Created GRN:', newGRN);
        console.log('[MockGRNService] Created Lines:', newLines);
    }
}
