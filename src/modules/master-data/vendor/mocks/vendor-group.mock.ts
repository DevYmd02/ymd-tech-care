import type { VendorGroupMaster } from '../types/vendor-types';
import type { ListResponse } from '@/shared/types/common-api.types';

const data: VendorGroupMaster[] = [
    {
        vendor_group_id: 1,
        id: 1,
        vendor_group_code: 'VGRP-FUR',
        code: 'VGRP-FUR',
        vendor_group_name: 'กลุ่มเฟอร์นิเจอร์',
        name_th: 'กลุ่มเฟอร์นิเจอร์',
        vendor_group_name_en: 'Furniture Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_group_id: 2,
        id: 2,
        vendor_group_code: 'VGRP-STA',
        code: 'VGRP-STA',
        vendor_group_name: 'กลุ่มเครื่องเขียน',
        name_th: 'กลุ่มเครื่องเขียน',
        vendor_group_name_en: 'Stationery Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_group_id: 3,
        id: 3,
        vendor_group_code: 'VGRP-IT',
        code: 'VGRP-IT',
        vendor_group_name: 'กลุ่มคอมพิวเตอร์',
        name_th: 'กลุ่มคอมพิวเตอร์',
        vendor_group_name_en: 'Computer Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        vendor_group_id: 4,
        id: 4,
        vendor_group_code: 'VGRP-CON',
        code: 'VGRP-CON',
        vendor_group_name: 'กลุ่มวัสดุก่อสร้าง',
        name_th: 'กลุ่มวัสดุก่อสร้าง',
        vendor_group_name_en: 'Construction Materials Group',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const MOCK_VENDOR_GROUPS: ListResponse<VendorGroupMaster> = {
    items: data,
    total: data.length,
    page: 1,
    limit: 10
};
