import type {
    ItemGroup, Brand, Pattern, Design, Grade, Model, Size, Color, Location, Shelf, LotNo
} from '../types/inventory-master.types';

// ====================================================================================
// MOCK DATA FACTORY
// ====================================================================================

interface SimpleMockItem {
    code: string;
    nameTh: string;
    nameEn: string;
}

function createMockData<T>(prefix: string, items: SimpleMockItem[]): T[] {
    return items.map((item) => ({
        id: `${prefix}-${item.code}`,
        [`${prefix.toLowerCase()}_id`]: `${prefix}-${item.code}`,
        code: item.code,
        name_th: item.nameTh,
        name_en: item.nameEn,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })) as T[];
}

export const MOCK_ITEM_GROUPS = createMockData<ItemGroup>('IGRP', [
    { code: 'FIN', nameTh: 'สินค้าสำเร็จรูป', nameEn: 'Finished Goods' },
    { code: 'RAW', nameTh: 'วัตถุดิบ', nameEn: 'Raw Materials' },
    { code: 'PKG', nameTh: 'บรรจุภัณฑ์', nameEn: 'Packaging' },
    { code: 'SVC', nameTh: 'บริการ', nameEn: 'Services' },
]);

export const MOCK_BRANDS = createMockData<Brand>('BRD', [
    { code: 'SAMSUNG', nameTh: 'ซัมซุง', nameEn: 'Samsung' },
    { code: 'LG', nameTh: 'แอลจี', nameEn: 'LG' },
    { code: 'SONY', nameTh: 'โซนี่', nameEn: 'Sony' },
    { code: 'APPLE', nameTh: 'แอปเปิ้ล', nameEn: 'Apple' },
]);

export const MOCK_PATTERNS = createMockData<Pattern>('PTN', [
    { code: 'SOLID', nameTh: 'ลายเรียบ', nameEn: 'Solid' },
    { code: 'STRIPE', nameTh: 'ลายทาง', nameEn: 'Stripe' },
    { code: 'FLORAL', nameTh: 'ลายดอกไม้', nameEn: 'Floral' },
    { code: 'GEOMETRIC', nameTh: 'ลายเรขาคณิต', nameEn: 'Geometric' },
]);

export const MOCK_DESIGNS = createMockData<Design>('DSN', [
    { code: 'MODERN', nameTh: 'โมเดิร์น', nameEn: 'Modern' },
    { code: 'CLASSIC', nameTh: 'คลาสสิก', nameEn: 'Classic' },
    { code: 'MINIMALIST', nameTh: 'มินิมอล', nameEn: 'Minimalist' },
    { code: 'VINTAGE', nameTh: 'วินเทจ', nameEn: 'Vintage' },
]);

export const MOCK_GRADES = createMockData<Grade>('GRD', [
    { code: 'A', nameTh: 'เกรด A (พรีเมียม)', nameEn: 'Grade A (Premium)' },
    { code: 'B', nameTh: 'เกรด B (มาตรฐาน)', nameEn: 'Grade B (Standard)' },
    { code: 'C', nameTh: 'เกรด C (ประหยัด)', nameEn: 'Grade C (Economy)' },
    { code: 'D', nameTh: 'เกรด D (ลดราคา)', nameEn: 'Grade D (Clearance)' },
]);

export const MOCK_MODELS = createMockData<Model>('MDL', [
    { code: 'STD-2024', nameTh: 'รุ่นมาตรฐาน 2024', nameEn: 'Standard 2024' },
    { code: 'PRO-2024', nameTh: 'รุ่นโปร 2024', nameEn: 'Pro 2024' },
    { code: 'LTD-2024', nameTh: 'รุ่นลิมิเต็ด 2024', nameEn: 'Limited 2024' },
]);

export const MOCK_SIZES = createMockData<Size>('SZ', [
    { code: 'XS', nameTh: 'เล็กพิเศษ', nameEn: 'Extra Small' },
    { code: 'S', nameTh: 'เล็ก', nameEn: 'Small' },
    { code: 'M', nameTh: 'กลาง', nameEn: 'Medium' },
    { code: 'L', nameTh: 'ใหญ่', nameEn: 'Large' },
    { code: 'XL', nameTh: 'ใหญ่พิเศษ', nameEn: 'Extra Large' },
]);

export const MOCK_COLORS: Color[] = [
    { id: 'CLR-RED', color_id: 'CLR-RED', code: 'RED', name_th: 'แดง', name_en: 'Red', hex_code: '#FF0000', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'CLR-BLUE', color_id: 'CLR-BLUE', code: 'BLUE', name_th: 'น้ำเงิน', name_en: 'Blue', hex_code: '#0000FF', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'CLR-GREEN', color_id: 'CLR-GREEN', code: 'GREEN', name_th: 'เขียว', name_en: 'Green', hex_code: '#00FF00', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'CLR-BLACK', color_id: 'CLR-BLACK', code: 'BLACK', name_th: 'ดำ', name_en: 'Black', hex_code: '#000000', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'CLR-WHITE', color_id: 'CLR-WHITE', code: 'WHITE', name_th: 'ขาว', name_en: 'White', hex_code: '#FFFFFF', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const MOCK_LOCATIONS = createMockData<Location>('LOC', [
    { code: 'ZONE-A', nameTh: 'โซน A (คลังใหญ่)', nameEn: 'Zone A (Main Warehouse)' },
    { code: 'ZONE-B', nameTh: 'โซน B (คลังรอง)', nameEn: 'Zone B (Secondary)' },
    { code: 'ZONE-C', nameTh: 'โซน C (คลังชั่วคราว)', nameEn: 'Zone C (Temporary)' },
]);

export const MOCK_SHELVES = createMockData<Shelf>('SHF', [
    { code: 'SHF-A1', nameTh: 'ชั้น A1', nameEn: 'Shelf A1' },
    { code: 'SHF-A2', nameTh: 'ชั้น A2', nameEn: 'Shelf A2' },
    { code: 'SHF-B1', nameTh: 'ชั้น B1', nameEn: 'Shelf B1' },
    { code: 'SHF-B2', nameTh: 'ชั้น B2', nameEn: 'Shelf B2' },
]);

export const MOCK_LOT_NUMBERS = createMockData<LotNo>('LOT', [
    { code: 'LOT-2024-001', nameTh: 'ล็อต 2024-001', nameEn: 'Lot 2024-001' },
    { code: 'LOT-2024-002', nameTh: 'ล็อต 2024-002', nameEn: 'Lot 2024-002' },
    { code: 'LOT-2024-003', nameTh: 'ล็อต 2024-003', nameEn: 'Lot 2024-003' },
]);
