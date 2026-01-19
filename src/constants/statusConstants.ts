/**
 * @file statusConstants.ts
 * @description Constants สำหรับ Status Colors และ Labels
 * @usage Import จากไฟล์นี้แทนการ import จาก StatusBadge.tsx
 */

// ====================================================================================
// PR STATUS
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
// RFQ STATUS
// ====================================================================================

export const RFQ_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-pink-100 text-pink-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

export const RFQ_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'ร่าง',
  SENT: 'ส่งแล้ว',
  IN_PROGRESS: 'กำลังดำเนินการ',
  CLOSED: 'ปิดแล้ว',
  CANCELLED: 'ยกเลิก',
};
