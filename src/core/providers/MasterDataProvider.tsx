import React, { useMemo, useCallback } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { 
    useUnits, 
    useBranches, 
    useWarehouses, 
    useEmployees, 
    useDepartments,
    useVendors
} from '@/modules/master-data/hooks/useMasterData';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { 
    MasterDataContext, 
    type MasterDataContextType,
    UnitsContext,
    BranchesContext,
    WarehousesContext,
    EmployeesContext,
    DepartmentsContext,
    MasterDataLoadingContext,
    MasterDataRefetchContext
} from '@core/contexts/MasterDataContext';

import { normalizeListResponse } from '@/shared/utils/apiUtils';

// =============================================================================
// ATOMIC DATA PROVIDERS
// =============================================================================

/** Helper to extract array from various query response shapes */
const extractList = (data: unknown): Record<string, unknown>[] => {
    return normalizeListResponse<Record<string, unknown>>(data).items;
};

const UnitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useUnits(isAuthenticated);
    const units = useMemo(() => extractList(data), [data]);

    React.useEffect(() => {
        if (units.length > 0) masterDataCache.set('units', units);
    }, [units]);

    return <UnitsContext.Provider value={units}>{children}</UnitsContext.Provider>;
};

const BranchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useBranches(isAuthenticated);
    const branches = useMemo(() => extractList(data), [data]);

    React.useEffect(() => {
        if (branches.length > 0) masterDataCache.set('branches', branches);
    }, [branches]);

    return <BranchesContext.Provider value={branches}>{children}</BranchesContext.Provider>;
};

const WarehousesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useWarehouses(isAuthenticated);
    const warehouses = useMemo(() => extractList(data), [data]);

    React.useEffect(() => {
        if (warehouses.length > 0) masterDataCache.set('warehouses', warehouses);
    }, [warehouses]);

    return <WarehousesContext.Provider value={warehouses}>{children}</WarehousesContext.Provider>;
};

const EmployeesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useEmployees(isAuthenticated);
    const employees = useMemo(() => extractList(data), [data]);

    React.useEffect(() => {
        if (employees.length > 0) masterDataCache.set('employees', employees);
    }, [employees]);

    return <EmployeesContext.Provider value={employees}>{children}</EmployeesContext.Provider>;
};

const DepartmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useDepartments(isAuthenticated);
    const departments = useMemo(() => extractList(data), [data]);

    React.useEffect(() => {
        if (departments.length > 0) masterDataCache.set('departments', departments);
    }, [departments]);

    return <DepartmentsContext.Provider value={departments}>{children}</DepartmentsContext.Provider>;
};

const VendorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useVendors(isAuthenticated);
    const vendors = useMemo(() => extractList(data), [data]);

    React.useEffect(() => {
        if (vendors.length > 0) {
            vendors.forEach(v => {
                if (v.vendor_id) masterDataCache.setVendor(Number(v.vendor_id), String(v.vendor_name || ''));
            });
        }
    }, [vendors]);

    return <>{children}</>; // Vendors don't have a dedicated legacy context yet, just populating singleton
};

// =============================================================================
// MAIN COMPOSER PROVIDER
// =============================================================================

/**
 * Legacy Support Provider to maintain MasterDataContext.
 * This bundles atomic context values into one object for backward compatibility.
 * @deprecated Use individual hooks (useUnits, useBranches, etc.) instead.
 */
const LegacyMasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const units = React.useContext(UnitsContext);
    const branches = React.useContext(BranchesContext);
    const warehouses = React.useContext(WarehousesContext);
    const employees = React.useContext(EmployeesContext);
    const departments = React.useContext(DepartmentsContext);
    const isFetching = React.useContext(MasterDataLoadingContext);
    const refetchAll = React.useContext(MasterDataRefetchContext);

    const legacyValue = useMemo<MasterDataContextType>(() => ({
        units,
        branches,
        warehouses,
        employees,
        departments,
        isLoading: isFetching,
        refetchAll
    }), [units, branches, warehouses, employees, departments, isFetching, refetchAll]);

    return (
        <MasterDataContext.Provider value={legacyValue}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    
    // 🎯 FIX: Avoid short-circuiting hook calls to prevent "Conditional Hook Call" warnings
    const fetchingMaster = useIsFetching({ queryKey: ['master'] }) > 0;
    const fetchingBranches = useIsFetching({ queryKey: ['master-branches'] }) > 0;
    const fetchingUnits = useIsFetching({ queryKey: ['master-units'] }) > 0;
    const isFetching = fetchingMaster || fetchingBranches || fetchingUnits;
    
    // Global Refetch Handler
    const refetchAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['master'] });
        queryClient.invalidateQueries({ queryKey: ['master-branches'] });
        queryClient.invalidateQueries({ queryKey: ['master-units'] });
        queryClient.invalidateQueries({ queryKey: ['master-warehouses'] });
        queryClient.invalidateQueries({ queryKey: ['master-employees'] });
        queryClient.invalidateQueries({ queryKey: ['master-departments'] });
    }, [queryClient]);

    return (
        <MasterDataRefetchContext.Provider value={refetchAll}>
            <MasterDataLoadingContext.Provider value={isFetching}>
                <UnitsProvider>
                    <BranchesProvider>
                        <WarehousesProvider>
                            <EmployeesProvider>
                                <DepartmentsProvider>
                                    <VendorsProvider>
                                        <LegacyMasterDataProvider>
                                            {children}
                                        </LegacyMasterDataProvider>
                                    </VendorsProvider>
                                </DepartmentsProvider>
                            </EmployeesProvider>
                        </WarehousesProvider>
                    </BranchesProvider>
                </UnitsProvider>
            </MasterDataLoadingContext.Provider>
        </MasterDataRefetchContext.Provider>
    );
};


