/**
 * @file qtMocks.ts
 * @description Mock Data สำหรับ Quotation Module (QT)
 */

import type { QTListItem } from '../types/qt-types';

export const MOCK_QUOTATIONS: QTListItem[] = [
    {
        quotation_id: 'qt-001',
        quotation_no: 'QT-V001-2024-001',
        qc_id: 'qc-001', // Mock QC Link
        rfq_no: 'RFQ2024-002', // UI Display
        vendor_id: 'v-001',
        vendor_code: 'V001',
        vendor_name: 'บริษัท เอบีซี จำกัด',
        quotation_date: '2024-01-16',
        valid_until: '2024-01-30',
        payment_term_days: 30,
        lead_time_days: 7,
        total_amount: 125000.00,
        currency_code: 'THB',
        exchange_rate: 1.0,
        status: 'SUBMITTED', // ได้รับแล้ว (Received)
    },
    {
        quotation_id: 'qt-002',
        quotation_no: 'QT-V002-2024-001',
        qc_id: 'qc-001',
        rfq_no: 'RFQ2024-002',
        vendor_id: 'v-002',
        vendor_code: 'V002',
        vendor_name: 'หจก ดีอีเอฟ จำกัด',
        quotation_date: '2024-01-17',
        valid_until: '2024-01-31',
        payment_term_days: 45,
        lead_time_days: 10,
        total_amount: 118500.00,
        currency_code: 'THB',
        exchange_rate: 1.0,
        status: 'SUBMITTED', // ได้รับแล้ว
    },
    {
        quotation_id: 'qt-003',
        quotation_no: 'QT-V003-2024-001',
        qc_id: 'qc-002',
        rfq_no: 'RFQ2024-003',
        vendor_id: 'v-003',
        vendor_code: 'V003',
        vendor_name: 'บจก ทดสอบ จำกัด',
        quotation_date: '2024-01-18',
        valid_until: '2024-01-28',
        payment_term_days: 30,
        lead_time_days: 5,
        total_amount: 98750.00,
        currency_code: 'THB',
        exchange_rate: 1.0,
        status: 'SUBMITTED', // ได้รับแล้ว
    },
    {
        quotation_id: 'qt-004',
        quotation_no: 'QT-V004-2024-001',
        qc_id: 'qc-003',
        rfq_no: 'RFQ2024-004',
        vendor_id: 'v-004',
        vendor_code: 'V004',
        vendor_name: 'ห้างหุ้นส่วนจำกัด',
        quotation_date: '2024-01-15',
        valid_until: '2024-02-02',
        payment_term_days: 60,
        lead_time_days: 14,
        total_amount: 210000.00,
        currency_code: 'THB',
        exchange_rate: 1.0,
        status: 'SELECTED', // เทียบราคาแล้ว (Compared/Selected)
    }
];
