/**
 * @file sale-period.types.ts
 * @description Types for Sale Period Master Data
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SalePeriodMaster extends BaseMasterData {
    period_id: number; // Integer ID
    begin_date: string;
    end_date: string;
    period_target: number; // Backend expects number
    close_status: boolean;
}

export interface SalePeriodFormData {
    begin_date: string;
    end_date: string;
    period_target: string;
    close_status: boolean;
}

export type SalePeriodListItem = SalePeriodMaster;

export interface SalePeriodFilters {
    page: number;
    limit: number;
    search: string; // target_code
    search2?: string; // name (optional)
    status: 'ACTIVE' | 'INACTIVE' | 'ALL';
}
