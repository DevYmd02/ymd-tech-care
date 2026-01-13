/**
 * @file dateUtils.ts
 * @description Utility functions สำหรับจัดการวันที่
 * @usage ใช้ทั่วทั้งโปรเจ็คสำหรับ format วันที่เป็นภาษาไทย
 */

// ====================================================================================
// CONSTANTS
// ====================================================================================

/** ชื่อเดือนภาษาไทยแบบย่อ */
export const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** ชื่อเดือนภาษาไทยแบบเต็ม */
export const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// ====================================================================================
// FUNCTIONS
// ====================================================================================

/**
 * แปลงวันที่ ISO (YYYY-MM-DD) เป็นรูปแบบไทย (พ.ศ.)
 * @param isoDate - วันที่รูปแบบ ISO เช่น "2026-01-15"
 * @returns วันที่รูปแบบไทย เช่น "15 ม.ค. 2569"
 */
export function formatThaiDate(isoDate: string): string {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day} ${month} ${year}`;
}

/**
 * แปลง datetime string เป็นรูปแบบสั้น
 * @param dateTimeStr - วันเวลารูปแบบ "YYYY-MM-DD HH:mm"
 * @returns วันเวลาสั้น เช่น "15 ม.ค. 14:30"
 */
export function formatDateTime(dateTimeStr: string): string {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const date = new Date(datePart);
    return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${timePart}`;
}

/**
 * แปลงวันที่เป็นรูปแบบเต็ม พ.ศ.
 * @param isoDate - วันที่รูปแบบ ISO
 * @returns วันที่เต็ม เช่น "15 มกราคม 2569"
 */
export function formatThaiDateFull(isoDate: string): string {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = THAI_MONTHS_FULL[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
}
