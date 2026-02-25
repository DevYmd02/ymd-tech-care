import type { PurchaseReturn, PrtItem, PRTStatus } from '@/modules/procurement/types';
import { sanitizeId } from '@/core/api/mockUtils';

export const MOCK_PRT_ITEMS: PrtItem[] = [
    { id: 'item-1', code: 'ITM-001', name: 'คอมพิวเตอร์ Notebook Dell Inspiron', uom: 'PCS', price: 25000 },
    { id: 'item-2', code: 'ITM-002', name: 'เมาส์ไร้สาย Logistics', uom: 'PCS', price: 590 },
    { id: 'item-3', code: 'ITM-003', name: 'คีย์บอร์ด Mechanical', uom: 'PCS', price: 3200 },
];

export const MOCK_PRT_DATA: PurchaseReturn[] = [
    {
        prt_id: '1',
        prt_no: 'PRT2024-001',
        prt_date: '2024-01-20',
        vendor_id: 'v1',
        vendor_name: 'บริษัท ABC จำกัด',
        vendor_code: 'vendor-001',
        ref_grn_id: 'g1',
        ref_grn_no: 'GRN2024-001',
        currency_id: 'THB',
        exchange_rate: 1,
        rate_date: '2024-01-20',
        is_multicurrency: false,
        total_qty: 10,
        total_amount: 250000.00,
        status: 'POSTED' as PRTStatus,
        created_by: 'สมชาย ใจดี',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        items: []
    },
    {
        prt_id: '2',
        prt_no: 'PRT2024-002',
        prt_date: '2024-01-21',
        vendor_id: 'v2',
        vendor_name: 'บริษัท XYZ จำกัด',
        vendor_code: 'vendor-002',
        ref_grn_id: 'g2',
        ref_grn_no: 'GRN2024-005',
        total_qty: 5,
        total_amount: 125000.00,
        status: 'DRAFT' as PRTStatus,
        created_by: 'สมหญิง รักดี',
        created_at: '2024-01-21T14:30:00Z',
        updated_at: '2024-01-21T14:30:00Z',
        items: []
    },
    {
        prt_id: '3',
        prt_no: 'PRT2024-003',
        prt_date: '2024-01-22',
        vendor_id: 'v3',
        vendor_name: 'ห้างหุ้นส่วน DEF',
        vendor_code: 'vendor-003',
        ref_grn_id: 'g3',
        ref_grn_no: '-',
        total_qty: 15,
        total_amount: 75000.00,
        status: 'CANCELLED' as PRTStatus,
        created_by: 'วิชัย มากการ',
        created_at: '2024-01-22T09:15:00Z',
        updated_at: '2024-01-22T16:00:00Z',
        items: []
    },
    {
        prt_id: '4',
        prt_no: 'PRT2024-004',
        prt_date: '2024-01-23',
        vendor_id: 'v1',
        vendor_name: 'บริษัท ABC จำกัด',
        vendor_code: 'vendor-001',
        ref_grn_id: 'g4',
        ref_grn_no: 'GRN2024-012',
        total_qty: 2,
        total_amount: 5000.00,
        status: 'DRAFT' as PRTStatus,
        created_by: 'สมชาย ใจดี',
        created_at: '2024-01-23T11:45:00Z',
        updated_at: '2024-01-23T11:45:00Z',
        items: []
    }
].map(item => ({
    ...item,
    prt_id: sanitizeId(item.prt_id),
    vendor_id: sanitizeId(item.vendor_id),
    ref_grn_id: sanitizeId(item.ref_grn_id),
}));
