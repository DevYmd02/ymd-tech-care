/**
 * @file vq.constants.ts
 * @description Constants for Vendor Quotation (VQ) module
 */

// 1. VQ Statuses (สำหรับ Tab 1)
export const VQ_STATUS_MAP: Record<string, { label: string; color: string }> = {
    ALL: { label: 'ทั้งหมด', color: 'default' },
    DRAFT: { label: 'แบบร่าง', color: 'neutral' },
    RECORDED: { label: 'บันทึกราคาแล้ว', color: 'success' },
    DECLINED: { label: 'ผู้ขายปฏิเสธ', color: 'error' },
    EXPIRED: { label: 'หมดอายุ', color: 'warning' },
    CANCELLED: { label: 'ยกเลิก', color: 'error' },
};

// 2. RFQ Vendor Statuses (สำหรับ Tab 2 และ 3)
export const RFQ_VENDOR_STATUS_MAP: Record<string, { label: string; color: string }> = {
    ALL: { label: 'ทั้งหมด', color: 'default' },
    NEW: { label: 'รอส่งอีเมล', color: 'default' },
    WAITING: { label: 'รอคิวส่ง', color: 'processing' },
    SENT: { label: 'ส่ง RFQ แล้ว', color: 'warning' },
    PENDING: { label: 'รอผู้ขายตอบกลับ', color: 'warning' },
};
