/**
 * @file prList.ts
 * @description Mock Data สำหรับรายการใบขอซื้อ (Purchase Requisition)
 * @usage import { MOCK_PR_LIST, PRItem, ApproverInfo } from '@/mocks/prList';
 */

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/** ข้อมูลผู้อนุมัติ */
export interface ApproverInfo {
    name: string;
    position: string;
    approvedAt?: string;
    remark?: string;
}

/** โครงสร้างข้อมูลใบขอซื้อ */
export interface PRItem {
    id: number;
    doc_no: string;
    date: string;
    requester: string;
    requesterPosition: string;
    department: string;
    status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
    itemCount: number;
    totalAmount: number;
    pendingApprover?: ApproverInfo;  // ผู้ที่ต้องอนุมัติ (ถ้ารออนุมัติ)
    approver?: ApproverInfo;          // ผู้ที่อนุมัติแล้ว
}

// ====================================================================================
// MOCK DATA - ข้อมูลจำลองรายการใบขอซื้อ
// ====================================================================================

export const MOCK_PR_LIST: PRItem[] = [
    {
        id: 1,
        doc_no: 'PR2026-001',
        date: '2026-01-15',
        requester: 'สมชาย ใจดี',
        requesterPosition: 'พนักงาน',
        department: 'IT',
        status: 'รออนุมัติ',
        itemCount: 3,
        totalAmount: 45000,
        pendingApprover: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ' }
    },
    {
        id: 2,
        doc_no: 'PR2026-002',
        date: '2026-01-16',
        requester: 'สมหญิง รักงาน',
        requesterPosition: 'พนักงาน',
        department: 'จัดซื้อ',
        status: 'อนุมัติแล้ว',
        itemCount: 5,
        totalAmount: 125000,
        approver: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ', approvedAt: '2026-01-16 14:30' }
    },
    {
        id: 3,
        doc_no: 'PR2026-003',
        date: '2026-01-17',
        requester: 'วิชัย มากการ',
        requesterPosition: 'หัวหน้างาน',
        department: 'ผลิต',
        status: 'รออนุมัติ',
        itemCount: 4,
        totalAmount: 78500,
        pendingApprover: { name: 'สมศรี ใจกว้าง', position: 'ผจก.ฝ่ายผลิต' }
    },
    {
        id: 4,
        doc_no: 'PR2026-004',
        date: '2026-01-18',
        requester: 'สมจิต สีดาวเรือง',
        requesterPosition: 'พนักงาน',
        department: 'บัญชี',
        status: 'รออนุมัติ',
        itemCount: 2,
        totalAmount: 32000,
        pendingApprover: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ' }
    },
    {
        id: 5,
        doc_no: 'PR2026-005',
        date: '2026-01-19',
        requester: 'ประยุทธ ชยัน',
        requesterPosition: 'หัวหน้างาน',
        department: 'คลัง',
        status: 'อนุมัติแล้ว',
        itemCount: 8,
        totalAmount: 250000,
        approver: { name: 'กฤษณ์ บุญมาก', position: 'MD', approvedAt: '2026-01-19 09:15' }
    },
    {
        id: 6,
        doc_no: 'PR2026-006',
        date: '2026-01-20',
        requester: 'นาง รักษ์ดี',
        requesterPosition: 'พนักงาน',
        department: 'ฝ่ายขาย',
        status: 'รออนุมัติ',
        itemCount: 2,
        totalAmount: 15000,
        pendingApprover: { name: 'สุดา ขายเก่ง', position: 'ผจก.ฝ่ายขาย' }
    },
    {
        id: 7,
        doc_no: 'PR2026-007',
        date: '2026-01-21',
        requester: 'วีระ สมบูรณ์',
        requesterPosition: 'พนักงาน',
        department: 'QC',
        status: 'อนุมัติแล้ว',
        itemCount: 6,
        totalAmount: 89000,
        approver: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ', approvedAt: '2026-01-21 16:45' }
    },
    {
        id: 8,
        doc_no: 'PR2026-008',
        date: '2026-01-22',
        requester: 'นิภา สายบุญเลิศ',
        requesterPosition: 'หัวหน้างาน',
        department: 'HR',
        status: 'รออนุมัติ',
        itemCount: 3,
        totalAmount: 43500,
        pendingApprover: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ' }
    },
    {
        id: 9,
        doc_no: 'PR2026-009',
        date: '2026-01-23',
        requester: 'สมศักดิ์ แสงทอง',
        requesterPosition: 'พนักงาน',
        department: 'IT',
        status: 'ยกเลิก',
        itemCount: 2,
        totalAmount: 28000,
    },
];
