/**
 * @file project-types.ts
 * @description Project and Cost Center types
 */

// ====================================================================================
// COST CENTER - ศูนย์ต้นทุน
// ====================================================================================

export interface CostCenter {
    id: number;
    cost_center_id: number;
    cost_center_code: string;
    cost_center_name: string;
    description?: string;
    budget_amount: number;
    manager_name: string;
    is_active: boolean;
}

// ====================================================================================
// PROJECT - โครงการ
// ====================================================================================

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface Project {
    id: number;
    project_id: number;
    project_code: string;
    project_name: string;
    description?: string;
    cost_center_id: number;
    budget_amount: number;
    start_date: string;
    end_date: string;
    status: ProjectStatus;
    is_active: boolean;
}
