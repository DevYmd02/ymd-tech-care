/**
 * @file master-data-cache.ts
 * @description A simple singleton cache for Master Data to be used by Services and non-React code.
 * This is populated by the MasterDataProvider.
 */

export interface MasterCache {
    units: Record<string, unknown>[];
    branches: Record<string, unknown>[];
    warehouses: Record<string, unknown>[];
    employees: Record<string, unknown>[];
    departments: Record<string, unknown>[];
    vendors: Record<string, unknown>[];
    customers: Record<string, unknown>[];
    prs: Record<string, unknown>[];
}

const CACHE_KEY = 'erp_master_data_cache';

const loadFromSession = (): MasterCache => {
    try {
        const stored = sessionStorage.getItem(CACHE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('[master-data-cache] Failed to load from session', e);
    }
    return {
        units: [],
        branches: [],
        warehouses: [],
        employees: [],
        departments: [],
        vendors: [],
        customers: [],
        prs: []
    };
};

const cache: MasterCache = loadFromSession();

const saveToSession = () => {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('[master-data-cache] Failed to save to session', e);
    }
};

export const masterDataCache = {
    set: (key: keyof MasterCache, data: Record<string, unknown>[]) => {
        cache[key] = data;
        saveToSession();
    },
    get: (key: keyof MasterCache) => cache[key],
    
    // Helper to find in any collection by various ID keys
    findById: (key: keyof MasterCache, id: number | string | undefined | null) => {
        if (!id) return null;
        const list = cache[key];
        const idStr = String(id);
        
        // 🎯 Improved Search Logic:
        // 1. Try key-specific ID first (e.g. branch_id for 'branches')
        // 2. Fallback to generic 'id'
        // 3. Last resort: greedy search (for backward compatibility)
        const specificIdKey = `${key.slice(0, -1)}_id`; // units -> unit_id, branches -> branch_id
        
        return list.find(item => {
            if (String(item[specificIdKey]) === idStr) return true;
            if (String(item.id) === idStr) return true;
            
            // Legacy greedy fallback
            const greedyId = String(
                item[`${key.slice(0, -1)}_id`] || 
                item.branch_id || 
                item.employee_id || 
                item.department_id || 
                item.warehouse_id || 
                item.uom_id ||
                item.pr_id ||
                item.vendor_id ||
                item.customer_id
            );
            return greedyId === idStr;
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

    setVendor: (id: number, name: string) => {
        const existing = masterDataCache.findById('vendors', id);
        if (!existing) {
            cache.vendors.push({ vendor_id: id, vendor_name: name });
            saveToSession();
        }
    },

    setPR: (id: number, no: string) => {
        const existing = masterDataCache.findById('prs', id);
        if (!existing) {
            cache.prs.push({ pr_id: id, pr_no: no });
            saveToSession();
        }
    },

    clear: () => {
        Object.keys(cache).forEach(key => {
            cache[key as keyof MasterCache] = [];
        });
        sessionStorage.removeItem(CACHE_KEY);
    }
};
