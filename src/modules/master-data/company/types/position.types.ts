/**
 * @file position.types.ts
 * @description Position (ตำแหน่ง) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface PositionMaster extends BaseMasterData {
    id: number;
    position_id: number;
    position_code: string;
    position_name: string;
    position_name_en?: string;
}

export interface PositionFormData {
    positionCode: string;
    positionName: string;
    positionNameEn: string;
    isActive: boolean;
}

export type PositionListItem = PositionMaster;
