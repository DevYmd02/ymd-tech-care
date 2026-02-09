import type { VendorTypeMaster } from '../types/vendor-types';
import type { ListResponse } from '@/shared/types/common-api.types';

const data: VendorTypeMaster[] = [
    {
        vendor_type_id: 'VTYPE-MFG',
        id: 'VTYPE-MFG',
        vendor_type_code: 'VTYPE-MFG',
        code: 'VTYPE-MFG',
        vendor_type_name: 'ผู้ผลิตเฟอร์นิเจอร์',
        name_th: 'ผู้ผลิตเฟอร์นิเจอร์',
        vendor_type_name_en: 'Furniture Manufacturer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_type_id: 'VTYPE-DIS',
        id: 'VTYPE-DIS',
        vendor_type_code: 'VTYPE-DIS',
        code: 'VTYPE-DIS',
        vendor_type_name: 'ผู้จัดจำหน่ายเครื่องเขียน',
        name_th: 'ผู้จัดจำหน่ายเครื่องเขียน',
        vendor_type_name_en: 'Stationery Distributor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_type_id: 'VTYPE-IT',
        id: 'VTYPE-IT',
        vendor_type_code: 'VTYPE-IT',
        code: 'VTYPE-IT',
        vendor_type_name: 'ผู้จัดจำหน่าย IT',
        name_th: 'ผู้จัดจำหน่าย IT',
        vendor_type_name_en: 'IT Distributor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_type_id: 'VTYPE-RET',
        id: 'VTYPE-RET',
        vendor_type_code: 'VTYPE-RET',
        code: 'VTYPE-RET',
        vendor_type_name: 'ร้านค้าปลีก',
        name_th: 'ร้านค้าปลีก',
        vendor_type_name_en: 'Retailer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const MOCK_VENDOR_TYPES: ListResponse<VendorTypeMaster> = {
    items: data,
    total: data.length,
    page: 1,
    limit: 10
};
