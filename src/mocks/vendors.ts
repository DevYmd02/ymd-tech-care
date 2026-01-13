/**
 * @file vendors.ts
 * @description Centralized mock data สำหรับ Vendor (ผู้ขาย)
 * @purpose รวมข้อมูล mock ไว้ที่เดียวเพื่อง่ายต่อการจัดการและเปลี่ยนเป็น API
 */

export interface Vendor {
    code: string;
    name: string;
    address: string;
    contact?: string;
    phone?: string;
    taxId?: string;
}

export const MOCK_VENDORS: Vendor[] = [
    { code: 'V001', name: 'บริษัท ไอทีซัพพลาย จำกัด', address: '123 ถ.พระราม4 คลองเตย กทม.', contact: 'คุณสมชาย', phone: '02-123-4567', taxId: '0105562012345' },
    { code: 'V002', name: 'บริษัท ออฟฟิศเมท จำกัด', address: '456 ถ.สุขุมวิท วัฒนา กทม.', contact: 'คุณสมหญิง', phone: '02-234-5678', taxId: '0105562012346' },
    { code: 'V003', name: 'บริษัท เทคโนโลยี โซลูชั่น จำกัด', address: '789 ถ.รัชดาภิเษก ห้วยขวาง กทม.', contact: 'คุณวิชัย', phone: '02-345-6789', taxId: '0105562012347' },
    { code: 'V004', name: 'บริษัท สเตชันเนอรี่ พลัส จำกัด', address: '321 ถ.ลาดพร้าว วังทองหลาง กทม.', contact: 'คุณนิดา', phone: '02-456-7890', taxId: '0105562012348' },
    { code: 'V005', name: 'บริษัท ฟอร์นิเจอร์ เวิลด์ จำกัด', address: '654 ถ.งามวงศ์วาน จตุจักร กทม.', contact: 'คุณประยุทธ', phone: '02-567-8901', taxId: '0105562012349' },
    { code: 'V006', name: 'บริษัท อิเล็กทรอนิกส์ ดีพอ จำกัด', address: '987 ถ.พระราม9 ห้วยขวาง กทม.', contact: 'คุณสมศักดิ์', phone: '02-678-9012', taxId: '0105562012350' },
    { code: 'V007', name: 'บริษัท ดูลแอร์ เทคโนโลยี จำกัด', address: '147 ถ.บรมราชชนนี ตลิ่งชัน กทม.', contact: 'คุณวีระ', phone: '02-789-0123', taxId: '0105562012351' },
    { code: 'V008', name: 'บริษัท เปเปอร์ โปร จำกัด', address: '258 ถ.เพชรบุรี ราชเทวี กทม.', contact: 'คุณนิภา', phone: '02-890-1234', taxId: '0105562012352' },
];
