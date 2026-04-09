/**
 * @file standard-cost.types.ts
 * @description Types for Standard Cost Master Data
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// MASTER DATA TYPES (API)
// ====================================================================================

export interface StandardCostHeader extends BaseMasterData {
    cost_id: number; // uuid (PK)
    cost_code: string; // varchar(25)
    cost_name: string; // varchar(255)
    start_date: string; // date
    expire_date: string; // date
    remarks: string; // text
    is_active: boolean; // boolean
    item_brand_id: number | null; // FK
    item_id: number | null; // FK
    permit_emp_id: number | null; // FK
    save_emp_id: number | null; // FK
    docu_date: string; // date
    
    // Join Helpers (from API if available or manually handled)
    item_brand_name?: string;
    item_name?: string;
    save_emp_name?: string;
    permit_emp_name?: string;
}

export interface StandardCostLine {
    cost_line_id: number; // PK
    cost_id: number; // FK
    remarks: string | null;
    item_id: number; // FK
    item_name: string;
    uom_id: number; // FK
    standard_buy_price: number;
    standard_cost: number;
    
    // Join Helpers
    item_code?: string;
    uom_name?: string;
}

// ====================================================================================
// FORM DATA TYPES (UI)
// ====================================================================================

export interface StandardCostFormData {
    costId?: number;
    costCode: string;
    costName: string;
    startDate: string;
    expireDate: string;
    remarks: string;
    isActive: boolean;
    itemBrandId: number | null;
    itemId: number | null; // Header level item
    permitEmpId: number | null;
    saveEmpId: number | null;
    docuDate: string;
    
    // UI Helpers
    itemBrandName?: string;
    itemName?: string;
    saveEmpName?: string;
    permitEmpName?: string;
    
    // Transaction Lines
    lines: StandardCostLineFormData[];
}

export interface StandardCostLineFormData {
    costLineId?: number;
    itemId: number;
    itemCode: string;
    itemName: string;
    uomId: number;
    uomName: string;
    standardBuyPrice: number;
    standardCost: number;
    remarks: string;
}

export interface StandardCostFilter {
    search: string;
    page: number;
    limit: number;
}
