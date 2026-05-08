import { createContext, useContext } from 'react';

/** 
 * @deprecated Use specialized React Query hooks from '@/modules/master-data/hooks/useMasterData' instead.
 * These provide better loading states, error handling, and caching.
 */
export interface MasterDataContextType {
    units: Record<string, unknown>[];
    branches: Record<string, unknown>[];
    warehouses: Record<string, unknown>[];
    employees: Record<string, unknown>[];
    departments: Record<string, unknown>[];
    isLoading: boolean;
    refetchAll: () => void;
}

// 1. Specialized Contexts (Internal Atomic Contexts)
export const UnitsContext = createContext<Record<string, unknown>[]>([]);
export const BranchesContext = createContext<Record<string, unknown>[]>([]);
export const WarehousesContext = createContext<Record<string, unknown>[]>([]);
export const EmployeesContext = createContext<Record<string, unknown>[]>([]);
export const DepartmentsContext = createContext<Record<string, unknown>[]>([]);
export const MasterDataLoadingContext = createContext<boolean>(false);
export const MasterDataRefetchContext = createContext<() => void>(() => {});

// 2. Legacy/Full Context (Backward Compatibility)
export const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

// 3. Context Hooks (Renamed to avoid collision with React Query hooks)
/** @deprecated Use useUnits() from '@/modules/master-data/hooks/useMasterData' instead. */
export const useUnitsContext = () => useContext(UnitsContext);
/** @deprecated Use useBranches() from '@/modules/master-data/hooks/useMasterData' instead. */
export const useBranchesContext = () => useContext(BranchesContext);
/** @deprecated Use useWarehouses() from '@/modules/master-data/hooks/useMasterData' instead. */
export const useWarehousesContext = () => useContext(WarehousesContext);
/** @deprecated Use useEmployees() from '@/modules/master-data/hooks/useMasterData' instead. */
export const useEmployeesContext = () => useContext(EmployeesContext);
/** @deprecated Use useDepartments() from '@/modules/master-data/hooks/useMasterData' instead. */
export const useDepartmentsContext = () => useContext(DepartmentsContext);
/** @deprecated Use useIsFetching() from '@tanstack/react-query' or the 'isLoading' property from RQ hooks. */
export const useMasterDataLoading = () => useContext(MasterDataLoadingContext);
/** @deprecated Use invalidateQueries directly via useQueryClient. */
export const useMasterDataRefetch = () => useContext(MasterDataRefetchContext);

// 4. Combined Hook (Legacy Monolithic Hook)
/** 
 * @deprecated This hook is monolithic and causes unnecessary re-renders. 
 * Please migrate to individual React Query hooks like useUnits(), useBranches(), etc.
 */
export function useMasterData() {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterData must be used within a MasterDataProvider');
    }
    return context;
}
