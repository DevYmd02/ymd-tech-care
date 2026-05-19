/**
 * @file master-data-cache.ts
 * @description A simple singleton cache for Master Data to be used by Services and non-React code.
 * This is populated by the MasterDataProvider.
 */

import { logger } from './common-utils';

export interface BranchRecord {
    branch_id: number;
    branch_name: string;
    name?: string;
    [key: string]: unknown;
}

export interface EmployeeRecord {
    employee_id: number;
    employee_fullname?: string;
    employee_firstname_th?: string;
    employee_lastname_th?: string;
    [key: string]: unknown;
}

export interface DepartmentRecord {
    dept_id: number;
    dept_name: string;
    name?: string;
    department_name?: string;
    [key: string]: unknown;
}

export interface VendorRecord {
    vendor_id: number;
    vendor_name: string;
    name?: string;
    [key: string]: unknown;
}

export interface CustomerRecord {
    customer_id: number;
    customer_name: string;
    name?: string;
    [key: string]: unknown;
}

export interface UomRecord {
    uom_id: number;
    uom_name: string;
    [key: string]: unknown;
}

export interface WarehouseRecord {
    warehouse_id: number;
    warehouse_name: string;
    [key: string]: unknown;
}

export interface PRRecord {
    pr_id: number;
    pr_no: string;
    [key: string]: unknown;
}

export interface MasterCache {
    units: UomRecord[];
    branches: BranchRecord[];
    warehouses: WarehouseRecord[];
    employees: EmployeeRecord[];
    departments: DepartmentRecord[];
    vendors: VendorRecord[];
    customers: CustomerRecord[];
    prs: PRRecord[];
}

const CACHE_KEY = 'erp_master_data_cache';

const ID_FIELD_MAP: Record<keyof MasterCache, string> = {
    units: 'uom_id',
    branches: 'branch_id',
    warehouses: 'warehouse_id',
    employees: 'employee_id',
    departments: 'dept_id',
    vendors: 'vendor_id',
    customers: 'customer_id',
    prs: 'pr_id'
};

const loadFromSession = (): MasterCache => {
    logger.time('masterDataCache [loadFromSession]');
    const defaultCache: MasterCache = {
        units: [],
        branches: [],
        warehouses: [],
        employees: [],
        departments: [],
        vendors: [],
        customers: [],
        prs: []
    };
    try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            const loaded = {
                ...defaultCache,
                ...parsed
            };
            logger.timeEnd('masterDataCache [loadFromSession]');
            return loaded;
        }
    } catch (e) {
        logger.error('[master-data-cache] Failed to load from session', e);
    }
    logger.timeEnd('masterDataCache [loadFromSession]');
    return defaultCache;
};

const cache: MasterCache = loadFromSession();

const saveToSession = () => {
    logger.time('masterDataCache [saveToSession]');
    try {
        const slimCache: Partial<MasterCache> = {};
        (Object.keys(cache) as (keyof MasterCache)[]).forEach(key => {
            if (key !== 'customers' && key !== 'vendors') {
                const data = cache[key];
                (slimCache as Record<string, unknown>)[key] = data;
            }
        });
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(slimCache));
    } catch (e) {
        logger.warn('[master-data-cache] Failed to save to session', e);
    }
    logger.timeEnd('masterDataCache [saveToSession]');
};

export const masterDataCache = {
    set: <K extends keyof MasterCache>(key: K, data: MasterCache[K]) => {
        cache[key] = data;
        saveToSession();
    },
    get: (key: keyof MasterCache) => cache[key],
    
    // Helper to find in any collection by various ID keys
    findById: (key: keyof MasterCache, id: number | string | undefined | null) => {
        if (!id) return null;
        const list = cache[key];
        const idStr = String(id);
        const specificIdKey = ID_FIELD_MAP[key];
        
        return list.find(item => {
            const itemRecord = item as Record<string, unknown>;
            return String(itemRecord[specificIdKey]) === idStr || String(itemRecord.id) === idStr;
        }) || null;
    },

    // Specific lookup helpers for common fields
    getBranchName: (id: number | string | undefined | null) => {
        const branch = masterDataCache.findById('branches', id);
        return branch ? String(branch.branch_name || branch.name || branch.name_th || '') : null;
    },

    getEmployeeName: (id: number | string | undefined | null) => {
        const emp = masterDataCache.findById('employees', id);
        if (!emp) return null;
        return String(emp.employee_fullname || emp.employee_name || 
               `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim() || '');
    },

    getDepartmentName: (id: number | string | undefined | null) => {
        const dept = masterDataCache.findById('departments', id);
        return dept ? String(dept.dept_name || dept.name || dept.name_th || dept.department_name || '') : null;
    },

    getVendorName: (id: number | string | undefined | null) => {
        const vendor = masterDataCache.findById('vendors', id);
        return vendor ? String(vendor.vendor_name || vendor.name || vendor.name_th || '') : null;
    },

    getCustomerName: (id: number | string | undefined | null) => {
        const cust = masterDataCache.findById('customers', id);
        return cust ? String(cust.customer_name || cust.name || cust.name_th || '') : null;
    },

    getPRNo: (id: number | string | undefined | null) => {
        const pr = masterDataCache.findById('prs', id);
        return pr ? String(pr.pr_no || pr.no || '') : null;
    },

    upsert: (key: keyof MasterCache, item: Record<string, unknown>) => {
        const list = cache[key];
        const specificIdKey = ID_FIELD_MAP[key];
        const itemId = String(item[specificIdKey] ?? item.id ?? '');
        
        if (!itemId) return;
        
        const index = list.findIndex(existing => {
            const existingRecord = existing as Record<string, unknown>;
            return String(existingRecord[specificIdKey]) === itemId || String(existingRecord.id) === itemId;
        });
        
        if (index !== -1) {
            (list as unknown as Record<string, unknown>[])[index] = item;
        } else {
            (list as unknown as Record<string, unknown>[]).push(item);
        }
        
        saveToSession();
    },

    clear: () => {
        Object.keys(cache).forEach(key => {
            cache[key as keyof MasterCache] = [];
        });
        sessionStorage.removeItem(CACHE_KEY);
    }
};
