/**
 * @file position.types.ts
 * @description Position (ตำแหน่ง) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface PositionMaster extends Partial<BaseMasterData> {
    position_id: number;
    position_code: string;
    position_name: string;
    position_nameeng?: string;
}


export interface PositionFormData {
    positionCode: string;
    positionName: string;
    positionNameEn: string;
    isActive: boolean;
}

export interface PositionPayload {
    position_code: string;
    position_name: string;
    position_nameeng: string;
    is_active: boolean;
}

export type PositionListItem = PositionMaster;

