/**
 * @file sale-target.types.ts
 * @description Types for Sale Target (Employee Target) Master Data aligned with backend schema.
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SaleTargetMaster extends BaseMasterData {
    id: number;
    emp_id: string; // UUID from Employee
    employee_code?: string;
    employee_name?: string;
    period_id: string; // UUID (Period)
    target_name?: string; // Period name (optional display)
    period_target: string; // Backend expects string for Money
    amount: number; // For table display compatibility
    list_no: number;
    is_active: boolean;
}

export interface SaleTargetFormData {
    emp_id: string; // UUID
    list_no: number;
    period_id: string; // UUID (Period)
    period_target: string; // String for Money (e.g., "55555.55")
}

export interface SaleTargetFilters {
    page: number;
    limit: number;
    search: string; // employee_code or name
    status: 'ACTIVE' | 'INACTIVE' | 'ALL';
}
