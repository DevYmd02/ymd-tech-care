import React, { useMemo, useCallback } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { 
    useUnits, 
    useBranches, 
    useWarehouses, 
    useEmployees, 
    useDepartments 
} from '@/modules/master-data/hooks/useMasterData';
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

// =============================================================================
// ATOMIC DATA PROVIDERS
// =============================================================================

/** Helper to extract array from various query response shapes */
const extractList = (data: unknown) => {
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>; // Specific cast for safe property access
    if (d?.items && Array.isArray(d.items)) return d.items;
    if (d?.data && Array.isArray(d.data)) return d.data;
    return [];
};

const UnitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useUnits(isAuthenticated);
    const units = useMemo(() => extractList(data), [data]);
    return <UnitsContext.Provider value={units}>{children}</UnitsContext.Provider>;
};

const BranchesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useBranches(isAuthenticated);
    const branches = useMemo(() => extractList(data), [data]);
    return <BranchesContext.Provider value={branches}>{children}</BranchesContext.Provider>;
};

const WarehousesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useWarehouses(isAuthenticated);
    const warehouses = useMemo(() => extractList(data), [data]);
    return <WarehousesContext.Provider value={warehouses}>{children}</WarehousesContext.Provider>;
};

const EmployeesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useEmployees(isAuthenticated);
    const employees = useMemo(() => extractList(data), [data]);
    return <EmployeesContext.Provider value={employees}>{children}</EmployeesContext.Provider>;
};

const DepartmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data } = useDepartments(isAuthenticated);
    const departments = useMemo(() => extractList(data), [data]);
    return <DepartmentsContext.Provider value={departments}>{children}</DepartmentsContext.Provider>;
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
                                    <LegacyMasterDataProvider>
                                        {children}
                                    </LegacyMasterDataProvider>
                                </DepartmentsProvider>
                            </EmployeesProvider>
                        </WarehousesProvider>
                    </BranchesProvider>
                </UnitsProvider>
            </MasterDataLoadingContext.Provider>
        </MasterDataRefetchContext.Provider>
    );
};


