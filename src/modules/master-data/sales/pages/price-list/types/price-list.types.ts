/**
 * @file price-list.types.ts
 * @description Price List types for Master Data
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// MASTER DATA TYPES (API)
// ====================================================================================

export interface PriceListHeader extends BaseMasterData {
    price_list_header_id: string | number; // [FIX] Found in logs
    price_list_id?: string; // uuid
    price_list_no: string; // varchar(30)
    price_list_name: string; // varchar(200)
    price_list_date: string; // datetime
    is_active: boolean;
    begin_date: string | null; // datetime
    end_date: string | null; // datetime
    branch_id: string; // uuid
    changed_date: string; // datetime
    customer_group_id: string; // uuid
    customer_id: string; // uuid
    emp_dept_id: string; // uuid
    item_brand_id: string | number; // uuid
    item_id: string; // uuid
    permit_emp_id: string; // uuid
    remark: string; // varchar(255)
    save_emp_id: string; // uuid
    price_list_flag: '+' | '-' | 'A' | 'S' | null; // char(1) [UPDATED] Added A, S to match actual API response
    approve_status: 'WAITING' | 'APPROVED' | null; // varchar(20)
    id?: string | number; // [NEW] Backend sometimes uses id instead of price_list_id
    
    // Virtual fields / Joined data (Inferred for UI)
    customer_code?: string;
    customer_name?: string;
    customer_name_th?: string; // [NEW] Common in joined data
    customer_id_code?: string; // [NEW] Fallback for code
    permit_emp_name?: string; // [NEW] Joined from Employee
    save_emp_name?: string;   // [NEW] Joined from Employee
}

export interface PriceListItemLine {
    price_list_item_id: string; // uuid
    price_list_id: string; // uuid
    item_id: string; // uuid
    uom_id: string | null; // uuid
    unit_price: number; // numeric(18,2)
    editflag: string | null; // char(1)
    line_discount: number; // numeric(18,2)
    line_discount_amnt: number; // numeric(18,2)
    line_discount_amount?: string | number; // Added: from API
    line_discount_rate?: string | number; // Added: from API
    unit_price_net: number; // numeric(18,2)
    remark: string; // varchar(255)
    remarks?: string; // [NEW] Backend sometimes uses remarks
    
    // Virtual fields for UI
    item_code?: string;
    item_name?: string;
    uom_name?: string;
}

export interface PriceListMaster extends PriceListHeader {
    price_list_lines: PriceListItemLine[];
    priceListItemLines?: PriceListItemLine[]; // [NEW] Found in logs
    items?: PriceListItemLine[]; // Optional fallback
}

// ====================================================================================
// FORM DATA TYPES (UI)
// ====================================================================================

export interface PriceListItemFormData {
    priceListItemId?: string;
    itemId: string;
    uomId: string | null;
    unitPrice: number;
    lineDiscount: string | number;
    lineDiscountAmnt: number;
    unitPriceNet: number;
    remark: string;
    itemBrandId?: string | number;
    
    // UI Helpers
    itemCode?: string;
    itemName?: string;
    uomName?: string;
}

export interface PriceListFormData {
    priceListNo: string;
    priceListName: string;
    priceListDate: string;
    isActive: boolean;
    beginDate: string | null;
    endDate: string | null;
    branchId: string;
    customerGroupId: string;
    customerId: string;
    itemBrandId?: string | number;
    empDeptId: string;
    itemId: string;
    permitEmpId: string;
    saveEmpId: string; // [NEW] Added for Recorder
    remark: string;
    priceListFlag: '+' | '-' | null;
    customerCode?: string; // [NEW] Display code (e.g. CUST-001)
    customerName?: string; // Helper for UI display
    permitEmpName?: string; // [NEW] Helper for UI display
    saveEmpName?: string; // [NEW] Helper for UI display
    
    items: PriceListItemFormData[];
}

export interface PriceListFilter {
    search: string; // price_list_no or price_list_name
    status: 'ACTIVE' | 'INACTIVE' | 'ALL';
    page: number;
    limit: number;
}
