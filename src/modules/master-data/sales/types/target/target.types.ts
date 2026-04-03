/**
 * @file target.types.ts
 * @description Sales Target types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SalesTargetMaster extends BaseMasterData {
    id: number;
    target_id: number;
    target_code: string;
    target_name: string;
    amount: number;
    year: number;
    period: number;
}

export interface SalesTargetFormData {
    targetCode: string;
    targetName: string;
    amount: number;
    year: number;
    period: number;
    isActive: boolean;
}

export type SalesTargetListItem = SalesTargetMaster;
