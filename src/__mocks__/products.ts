/**
 * @file products.ts
 * @description Centralized mock data สำหรับ Product (สินค้า)
 * @purpose รวมข้อมูล mock ไว้ที่เดียวเพื่อง่ายต่อการจัดการและเปลี่ยนเป็น API
 * 
 * @note Mock data จะถูก export เฉพาะใน DEV mode เท่านั้น
 */

/** true = Development mode, false = Production mode */
const IS_DEV = import.meta.env.DEV;

export interface Product {
    code: string;
    name: string;
    detail: string;
    warehouse: string;
    location: string;
    unit: string;
    price: number;
    category?: string;
}

const _mockProducts: Product[] = [
    { code: 'A001', name: 'เครื่องพิมพ์ HP LaserJet', detail: 'เครื่องพิมพ์เลเซอร์ ขาว-ดำ', warehouse: 'WH', location: 'A1', unit: 'เครื่อง', price: 8500, category: 'IT Equipment' },
    { code: 'A002', name: 'กระดาษ A4', detail: 'กระดาษถ่ายเอกสาร 80 แกรม', warehouse: 'WH', location: 'R1', unit: 'รีม', price: 120, category: 'Stationery' },
    { code: 'A003', name: 'หมึกพิมพ์ HP 12A', detail: 'หมึกโทนเนอร์สีดำ', warehouse: 'WH', location: 'A2', unit: 'ตลับ', price: 2500, category: 'IT Supplies' },
    { code: 'B001', name: 'คอมพิวเตอร์ Dell', detail: 'PC Desktop Core i5', warehouse: 'Main', location: 'C1', unit: 'เครื่อง', price: 15900, category: 'IT Equipment' },
    { code: 'B002', name: 'จอมอนิเตอร์ 24"', detail: 'จอ LED Full HD', warehouse: 'Main', location: 'C2', unit: 'เครื่อง', price: 4500, category: 'IT Equipment' },
    { code: 'C001', name: 'โต๊ะทำงาน', detail: 'โต๊ะไม้ขนาด 120x60 ซม.', warehouse: 'FUR', location: 'F1', unit: 'ตัว', price: 3200, category: 'Furniture' },
    { code: 'C002', name: 'เก้าอี้สำนักงาน', detail: 'เก้าอี้หนังปรับระดับได้', warehouse: 'FUR', location: 'F2', unit: 'ตัว', price: 1800, category: 'Furniture' },
    { code: 'D001', name: 'ปากกาลูกลื่น', detail: 'ปากกาสีน้ำเงิน 0.5 มม.', warehouse: 'OFF', location: 'S1', unit: 'ด้าม', price: 15, category: 'Stationery' },
    { code: 'D002', name: 'สมุดโน้ต A4', detail: 'สมุด 100 แผ่น', warehouse: 'OFF', location: 'S2', unit: 'เล่ม', price: 45, category: 'Stationery' },
    { code: 'E001', name: 'เครื่องปรับอากาศ 18000 BTU', detail: 'แอร์ติดผนัง Inverter', warehouse: 'WH', location: 'E1', unit: 'เครื่อง', price: 18900, category: 'Appliance' },
];

/** Mock data สำหรับ Product List - เฉพาะ DEV mode */
export const MOCK_PRODUCTS: Product[] = IS_DEV ? _mockProducts : [];
