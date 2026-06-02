import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// 1. Define shapes for the authorization matrices
export interface RolePermissionRow {
    role: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    approve: boolean;
    post: boolean;
    void: boolean;
    export: boolean;
    admin: boolean;
}

export interface ModuleAccessRow {
    role: string;
    sales: boolean;
    procurement: boolean;
    inventory: boolean;
    itGovernance: boolean;
    masterData: boolean;
}

export interface MasterDataAccessRow {
    role: string;
    companyEmployee: boolean;
    vendor: boolean;
    customer: boolean;
    inventoryMaster: boolean;
    financeMaster: boolean;
}

interface PermissionContextType {
    // States
    permissionMatrix: RolePermissionRow[];
    moduleAccessMatrix: ModuleAccessRow[];
    masterDataAccessMatrix: MasterDataAccessRow[];
    activeRole: string;
    
    // Setters & Evaluators
    setActiveRole: (role: string) => void;
    hasPermission: (action: 'view' | 'create' | 'edit' | 'approve' | 'post' | 'void' | 'export' | 'admin') => boolean;
    hasModuleAccess: (moduleKey: 'sales' | 'procurement' | 'inventory' | 'itGovernance' | 'masterData') => boolean;
    hasMasterDataAccess: (subMenuKey: 'companyEmployee' | 'vendor' | 'customer' | 'inventoryMaster' | 'financeMaster') => boolean;
    
    // Updates
    updatePermission: (roleName: string, action: keyof Omit<RolePermissionRow, 'role'>, value: boolean) => void;
    updateModulePermission: (roleName: string, moduleKey: keyof Omit<ModuleAccessRow, 'role'>, value: boolean) => void;
    updateMasterDataPermission: (roleName: string, subMenuKey: keyof Omit<MasterDataAccessRow, 'role'>, value: boolean) => void;
    
    // Commits & Reset
    savePermissions: (updatedMatrix: RolePermissionRow[]) => void;
    saveModulePermissions: (updatedMatrix: ModuleAccessRow[]) => void;
    saveMasterDataPermissions: (updatedMatrix: MasterDataAccessRow[]) => void;
    resetPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
    ACTIONS: 'erp_permissions_matrix',
    MODULES: 'erp_module_access_matrix',
    MASTER_DATA: 'erp_master_data_access_matrix'
};

// ====================================================================================
// DEFAULT SYSTEM PRESETS (IT Security Policy compliant)
// ====================================================================================

const defaultPermissionMatrix: RolePermissionRow[] = [
    { role: 'SYS_ADMIN', view: true, create: true, edit: true, approve: true, post: false, void: true, export: true, admin: true },
    { role: 'CFO', view: true, create: true, edit: false, approve: true, post: false, void: false, export: true, admin: false },
    { role: 'FIN_MANAGER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'AP_OFFICER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'AR_OFFICER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'GL_ACCOUNTANT', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'CASHIER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'PROCUREMENT_OFFICER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'WAREHOUSE_OFFICER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'PRODUCTION_PLANNER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'SALES_OFFICER', view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'TAX_COMPLIANCE', view: true, create: true, edit: true, approve: false, post: true, void: false, export: true, admin: false },
    { role: 'INTERNAL_AUDITOR', view: true, create: false, edit: false, approve: false, post: false, void: false, export: true, admin: false },
];

const defaultModuleAccessMatrix: ModuleAccessRow[] = [
    { role: 'SYS_ADMIN', sales: true, procurement: true, inventory: true, itGovernance: true, masterData: true },
    { role: 'CFO', sales: true, procurement: true, inventory: true, itGovernance: false, masterData: true },
    { role: 'FIN_MANAGER', sales: true, procurement: true, inventory: true, itGovernance: false, masterData: true },
    { role: 'AP_OFFICER', sales: false, procurement: true, inventory: true, itGovernance: false, masterData: true },
    { role: 'AR_OFFICER', sales: true, procurement: false, inventory: true, itGovernance: false, masterData: true },
    { role: 'GL_ACCOUNTANT', sales: true, procurement: true, inventory: true, itGovernance: false, masterData: true },
    { role: 'CASHIER', sales: false, procurement: false, inventory: false, itGovernance: false, masterData: true },
    { role: 'PROCUREMENT_OFFICER', sales: false, procurement: true, inventory: false, itGovernance: false, masterData: true },
    { role: 'WAREHOUSE_OFFICER', sales: false, procurement: false, inventory: true, itGovernance: false, masterData: true },
    { role: 'PRODUCTION_PLANNER', sales: false, procurement: false, inventory: true, itGovernance: false, masterData: true },
    { role: 'SALES_OFFICER', sales: true, procurement: false, inventory: false, itGovernance: false, masterData: true },
    { role: 'TAX_COMPLIANCE', sales: true, procurement: true, inventory: false, itGovernance: false, masterData: true },
    { role: 'INTERNAL_AUDITOR', sales: true, procurement: true, inventory: true, itGovernance: false, masterData: true },
];

const defaultMasterDataAccessMatrix: MasterDataAccessRow[] = [
    { role: 'SYS_ADMIN', companyEmployee: true, vendor: true, customer: true, inventoryMaster: true, financeMaster: true },
    { role: 'CFO', companyEmployee: true, vendor: true, customer: true, inventoryMaster: true, financeMaster: true },
    { role: 'FIN_MANAGER', companyEmployee: false, vendor: true, customer: true, inventoryMaster: true, financeMaster: true },
    { role: 'AP_OFFICER', companyEmployee: false, vendor: true, customer: false, inventoryMaster: false, financeMaster: true },
    { role: 'AR_OFFICER', companyEmployee: false, vendor: false, customer: true, inventoryMaster: false, financeMaster: true },
    { role: 'GL_ACCOUNTANT', companyEmployee: false, vendor: true, customer: true, inventoryMaster: true, financeMaster: true },
    { role: 'CASHIER', companyEmployee: false, vendor: false, customer: false, inventoryMaster: false, financeMaster: true },
    { role: 'PROCUREMENT_OFFICER', companyEmployee: false, vendor: true, customer: false, inventoryMaster: true, financeMaster: false },
    { role: 'WAREHOUSE_OFFICER', companyEmployee: false, vendor: true, customer: false, inventoryMaster: true, financeMaster: false },
    { role: 'PRODUCTION_PLANNER', companyEmployee: false, vendor: false, customer: false, inventoryMaster: true, financeMaster: false },
    { role: 'SALES_OFFICER', companyEmployee: false, vendor: false, customer: true, inventoryMaster: true, financeMaster: false },
    { role: 'TAX_COMPLIANCE', companyEmployee: false, vendor: true, customer: true, inventoryMaster: false, financeMaster: true },
    { role: 'INTERNAL_AUDITOR', companyEmployee: true, vendor: true, customer: true, inventoryMaster: true, financeMaster: true },
];

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    
    // Core Matrix States
    const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionRow[]>(defaultPermissionMatrix);
    const [moduleAccessMatrix, setModuleAccessMatrix] = useState<ModuleAccessRow[]>(defaultModuleAccessMatrix);
    const [masterDataAccessMatrix, setMasterDataAccessMatrix] = useState<MasterDataAccessRow[]>(defaultMasterDataAccessMatrix);
    const [activeRole, setActiveRoleState] = useState<string>('SYS_ADMIN');

    // Sync active simulated role with logged-in user profile, if authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            const code = user.username?.toUpperCase() || '';
            if (code.includes('ADMIN') || code.includes('TT002')) {
                setActiveRoleState('SYS_ADMIN');
            } else if (code.includes('CFO')) {
                setActiveRoleState('CFO');
            } else if (code.includes('SALES') || code.includes('TT001')) {
                setActiveRoleState('SALES_OFFICER');
            } else {
                setActiveRoleState('SYS_ADMIN'); // Default to SYS_ADMIN for developer convenience
            }
        }
    }, [user, isAuthenticated]);

    // Load custom configurations from localStorage on mount
    useEffect(() => {
        const savedActions = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIONS);
        const savedModules = localStorage.getItem(LOCAL_STORAGE_KEYS.MODULES);
        const savedMasterData = localStorage.getItem(LOCAL_STORAGE_KEYS.MASTER_DATA);

        if (savedActions) {
            try { setPermissionMatrix(JSON.parse(savedActions)); } catch (e) { console.error(e); }
        }
        if (savedModules) {
            try { setModuleAccessMatrix(JSON.parse(savedModules)); } catch (e) { console.error(e); }
        }
        if (savedMasterData) {
            try { setMasterDataAccessMatrix(JSON.parse(savedMasterData)); } catch (e) { console.error(e); }
        }
    }, []);

    const setActiveRole = (role: string) => {
        setActiveRoleState(role);
    };

    // ====================================================================================
    // PERMISSION EVALUATORS (Typesafe)
    // ====================================================================================
    
    const hasPermission = (action: 'view' | 'create' | 'edit' | 'approve' | 'post' | 'void' | 'export' | 'admin'): boolean => {
        const row = permissionMatrix.find((r) => r.role === activeRole);
        return row ? !!row[action] : false;
    };

    const hasModuleAccess = (moduleKey: 'sales' | 'procurement' | 'inventory' | 'itGovernance' | 'masterData'): boolean => {
        const row = moduleAccessMatrix.find((r) => r.role === activeRole);
        return row ? !!row[moduleKey] : false;
    };

    const hasMasterDataAccess = (subMenuKey: 'companyEmployee' | 'vendor' | 'customer' | 'inventoryMaster' | 'financeMaster'): boolean => {
        const row = masterDataAccessMatrix.find((r) => r.role === activeRole);
        return row ? !!row[subMenuKey] : false;
    };

    // ====================================================================================
    // STATE UPDATE HANDLERS (Local State Only)
    // ====================================================================================

    const updatePermission = (roleName: string, action: keyof Omit<RolePermissionRow, 'role'>, value: boolean) => {
        setPermissionMatrix((prev) =>
            prev.map((row) => (row.role === roleName ? { ...row, [action]: value } : row))
        );
    };

    const updateModulePermission = (roleName: string, moduleKey: keyof Omit<ModuleAccessRow, 'role'>, value: boolean) => {
        setModuleAccessMatrix((prev) =>
            prev.map((row) => (row.role === roleName ? { ...row, [moduleKey]: value } : row))
        );
    };

    const updateMasterDataPermission = (roleName: string, subMenuKey: keyof Omit<MasterDataAccessRow, 'role'>, value: boolean) => {
        setMasterDataAccessMatrix((prev) =>
            prev.map((row) => (row.role === roleName ? { ...row, [subMenuKey]: value } : row))
        );
    };

    // ====================================================================================
    // COMMIT & PERSISTENCE HANDLERS (Saves to LocalStorage)
    // ====================================================================================

    const savePermissions = (updatedMatrix: RolePermissionRow[]) => {
        setPermissionMatrix(updatedMatrix);
        localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIONS, JSON.stringify(updatedMatrix));
    };

    const saveModulePermissions = (updatedMatrix: ModuleAccessRow[]) => {
        setModuleAccessMatrix(updatedMatrix);
        localStorage.setItem(LOCAL_STORAGE_KEYS.MODULES, JSON.stringify(updatedMatrix));
    };

    const saveMasterDataPermissions = (updatedMatrix: MasterDataAccessRow[]) => {
        setMasterDataAccessMatrix(updatedMatrix);
        localStorage.setItem(LOCAL_STORAGE_KEYS.MASTER_DATA, JSON.stringify(updatedMatrix));
    };

    const resetPermissions = () => {
        setPermissionMatrix(defaultPermissionMatrix);
        setModuleAccessMatrix(defaultModuleAccessMatrix);
        setMasterDataAccessMatrix(defaultMasterDataAccessMatrix);
        
        localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIONS);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.MODULES);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.MASTER_DATA);
    };

    const value = {
        permissionMatrix,
        moduleAccessMatrix,
        masterDataAccessMatrix,
        activeRole,
        setActiveRole,
        hasPermission,
        hasModuleAccess,
        hasMasterDataAccess,
        updatePermission,
        updateModulePermission,
        updateMasterDataPermission,
        savePermissions,
        saveModulePermissions,
        saveMasterDataPermissions,
        resetPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermission must be used within a PermissionProvider');
    }
    return context;
};
