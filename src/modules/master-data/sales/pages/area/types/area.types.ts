/**
 * @file area.types.ts
 * @description Sales Area types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SaleAreaMaster extends BaseMasterData {
    sale_area_id: string; // UUID
    sale_area_code: string;
    sale_area_name: string;
    sale_area_nameeng: string;
    is_active: boolean;
}

export interface SaleAreaFormData {
    saleAreaCode: string;
    saleAreaName: string;
    saleAreaNameEng: string;
    isActive: boolean;
}

export type SaleAreaListItem = SaleAreaMaster;
