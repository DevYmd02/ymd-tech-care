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
}

const cache: MasterCache = {
    units: [],
    branches: [],
    warehouses: [],
    employees: [],
    departments: []
};

export const masterDataCache = {
    set: (key: keyof MasterCache, data: Record<string, unknown>[]) => {
        cache[key] = data;
    },
    get: (key: keyof MasterCache) => cache[key],
    
    // Helper to find in any collection by various ID keys
    findById: (key: keyof MasterCache, id: number | string | undefined | null) => {
        if (!id) return null;
        const list = cache[key];
        const idStr = String(id);
        
        return list.find(item => {
            const itemId = String(item.id || item[`${key.slice(0, -1)}_id`] || item.branch_id || item.employee_id || item.department_id || item.warehouse_id || item.unit_id);
            return itemId === idStr;
        }) || null;
    },

    // Specific lookup helpers for common fields
    getBranchName: (id: number | string | undefined | null) => {
        const branch = masterDataCache.findById('branches', id);
        return branch ? (branch.branch_name || branch.name || branch.name_th) : null;
    },

    getEmployeeName: (id: number | string | undefined | null) => {
        const emp = masterDataCache.findById('employees', id);
        if (!emp) return null;
        return emp.employee_fullname || emp.employee_name || 
               `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim();
    },

    getDepartmentName: (id: number | string | undefined | null) => {
        const dept = masterDataCache.findById('departments', id);
        return dept ? (dept.dept_name || dept.name || dept.name_th || dept.department_name) : null;
    }
};
