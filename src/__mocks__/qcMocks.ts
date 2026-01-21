/**
 * @file qcMocks.ts
 * @description Mock Data สำหรับ Quotation Comparison (QC)
 */

import type { QCListItem } from '../types/qc-types';

export const MOCK_QC_LIST: QCListItem[] = [
    {
        qc_id: 'qc-001',
        qc_no: 'QC2024-001',
        pr_id: 'pr-001',
        pr_no: 'PR2024-001',
        created_at: '2024-01-20',
        status: 'DRAFT',
        vendor_count: 3,
        lowest_bidder_name: 'บริษัท ABC จำกัด',
        lowest_bid_amount: 42000.00
    },
    {
        qc_id: 'qc-002',
        qc_no: 'QC2024-002',
        pr_id: 'pr-002',
        pr_no: 'PR2024-002',
        created_at: '2024-01-21',
        status: 'SUBMITTED',
        vendor_count: 4,
        lowest_bidder_name: 'บริษัท XYZ จำกัด',
        lowest_bid_amount: 118000.00
    },
    {
        qc_id: 'qc-003',
        qc_no: 'QC2024-003',
        pr_id: 'pr-003',
        pr_no: 'PR2024-003',
        created_at: '2024-01-22',
        status: 'APPROVED',
        vendor_count: 3,
        lowest_bidder_name: 'ห้างหุ้นส่วน DEF',
        lowest_bid_amount: 75000.00
    },
    {
        qc_id: 'qc-004',
        qc_no: 'QC2024-004',
        pr_id: 'pr-004',
        pr_no: 'PR2024-004',
        created_at: '2024-01-23',
        status: 'DRAFT',
        vendor_count: 2,
        lowest_bidder_name: 'บริษัท GHI จำกัด',
        lowest_bid_amount: 29500.00
    }
];
