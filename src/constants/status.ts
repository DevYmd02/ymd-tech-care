/**
 * @file status.ts
 * @description Constants สำหรับสถานะต่างๆ ในระบบ
 * @usage import { PR_STATUS } from '@/constants/status';
 */

// ====================================================================================
// PR STATUS
// ====================================================================================

export const PR_STATUS = {
    PENDING: 'รออนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    CANCELLED: 'ยกเลิก',
} as const;

export type PRStatus = typeof PR_STATUS[keyof typeof PR_STATUS];

// ====================================================================================
// DOCUMENT STATUS (General)
// ====================================================================================

export const DOC_STATUS = {
    DRAFT: 'ร่าง',
    PENDING: 'รออนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    CANCELLED: 'ยกเลิก',
    COMPLETED: 'เสร็จสิ้น',
} as const;

export type DocStatus = typeof DOC_STATUS[keyof typeof DOC_STATUS];

// ====================================================================================
// STATUS COLORS (สำหรับ UI)
// ====================================================================================

export const STATUS_COLORS: Record<string, string> = {
    'รออนุมัติ': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'อนุมัติแล้ว': 'bg-green-100 text-green-700 border-green-200',
    'ยกเลิก': 'bg-gray-100 text-gray-700 border-gray-200',
    'ร่าง': 'bg-blue-100 text-blue-700 border-blue-200',
    'เสร็จสิ้น': 'bg-purple-100 text-purple-700 border-purple-200',
};
