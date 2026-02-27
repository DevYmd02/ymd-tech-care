/**
 * @file statusConstants.ts
 * @description Unified Status Constants สำหรับทั้งระบบ
 * @usage import { PR_STATUS_COLORS, PR_STATUS_LABELS } from '@/constants/statusConstants';
 */

// ====================================================================================
// PR STATUS - Purchase Requisition
// ====================================================================================

export const PR_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IN_APPROVAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
  PARTIALLY_CONVERTED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  CONVERTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  CLOSED: 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
};

export const PR_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'ร่าง',
  SUBMITTED: 'ส่งแล้ว',
  IN_APPROVAL: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
  CANCELLED: 'ยกเลิก',
  PARTIALLY_CONVERTED: 'แปลงบางส่วน',
  CONVERTED: 'แปลงแล้ว',
  CLOSED: 'ปิด',
};

// ====================================================================================
// RFQ STATUS - Request for Quotation
// ====================================================================================

export const RFQ_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  SENT: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  CLOSED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
};

export const RFQ_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'แบบร่าง',
  SENT: 'ส่งแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  CLOSED: 'ปิดแล้ว',
  CANCELLED: 'ยกเลิก',
};

// Note: VQ Status constants are now managed within StatusBadge.tsx config or vq-types.ts

// ====================================================================================
// QC STATUS - Quotation Comparison
// ====================================================================================

export const QC_STATUS_COLORS: Record<string, string> = {
  WAITING_FOR_PO: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  PO_CREATED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export const QC_STATUS_LABELS: Record<string, string> = {
  WAITING_FOR_PO: 'รอเปิดใบสั่งซื้อ',
  PO_CREATED: 'เปิดใบสั่งซื้อแล้ว',
};

// ====================================================================================
// LEGACY CONSTANTS - For backward compatibility (from status.ts)
// ====================================================================================

/** @deprecated ใช้ PR_STATUS_LABELS แทน */
export const PR_STATUS = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  CANCELLED: 'ยกเลิก',
} as const;

export type PRStatus = typeof PR_STATUS[keyof typeof PR_STATUS];

/** Document Status ทั่วไป */
export const DOC_STATUS = {
  DRAFT: 'ร่าง',
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  CANCELLED: 'ยกเลิก',
  COMPLETED: 'เสร็จสิ้น',
} as const;

export type DocStatus = typeof DOC_STATUS[keyof typeof DOC_STATUS];

/** @deprecated ใช้ PR_STATUS_COLORS หรือ RFQ_STATUS_COLORS แทน */
export const STATUS_COLORS: Record<string, string> = {
  'รออนุมัติ': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'อนุมัติแล้ว': 'bg-green-100 text-green-700 border-green-200',
  'ยกเลิก': 'bg-gray-100 text-gray-700 border-gray-200',
  'ร่าง': 'bg-blue-100 text-blue-700 border-blue-200',
  'เสร็จสิ้น': 'bg-purple-100 text-purple-700 border-purple-200',
};
