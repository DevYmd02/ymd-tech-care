/**
 * @file numberUtils.ts
 * @description Utility สำหรับจัดการและจัดรูปแบบตัวเลข
 */

/**
 * จัดรูปแบบตัวเลขให้มี comma และทศนิยม 2 ตำแหน่ง
 * @param value ตัวเลขที่ต้องการ format (number หรือ string)
 * @returns string เช่น "1,234.56" หรือ "-" ถ้าไม่มีค่า
 */
export const formatNumber = (value?: number | string | null): string => {
    if (value === undefined || value === null || value === '') return '-';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';

    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};
