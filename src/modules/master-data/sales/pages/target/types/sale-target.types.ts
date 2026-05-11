/**
 * @file sale-target.types.ts
 * @description Types for Sale Target (Employee Target) Master Data aligned with backend schema.
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SaleTargetMaster extends BaseMasterData {
    id: number;
    target_id?: number; // Integer ID from Backend (Primary Key)
    emp_id: number; // Integer ID from Employee
    employee_code?: string;
    employee_name?: string;
    period_id: number; // Integer ID (Period)
    target_name?: string; // Period name (optional display)
    period_target: number; // Backend expects number
    amount: number; // For table display compatibility
    list_no: number;
    is_active: boolean;
}

export interface SaleTargetFormData {
    emp_id: number; // Integer
    list_no: number;
    period_id: number; // Integer
    period_target: number; // Number
}

export interface SaleTargetFilters {
    page: number;
    limit: number;
    search: string; // employee_code or name
    status: 'ACTIVE' | 'INACTIVE' | 'ALL';
}
