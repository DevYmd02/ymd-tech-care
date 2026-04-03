/**
 * @file sale-target.types.ts
 * @description Types for Sale Target (Employee Target) Master Data
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SaleTargetMaster extends BaseMasterData {
    id: number;
    employee_id: string; // UUID
    employee_code: string;
    employee_name: string;
    target_id: string; // UUID (Period)
    target_name: string; // Period name
    amount: number;
    is_active: boolean;
}

export interface SaleTargetFormData {
    employeeId: string; // UUID
    targetId: string; // UUID (Period)
    amount: number;
}

export interface SaleTargetFilters {
    page: number;
    limit: number;
    search: string; // employee_code or name
    status: 'ACTIVE' | 'INACTIVE' | 'ALL';
}
