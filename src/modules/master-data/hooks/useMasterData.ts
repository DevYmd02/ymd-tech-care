import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '../services/master-data.service';
import { UOMService } from '@inventory/services/uom.service';
import { WarehouseService } from '@inventory/services/warehouse.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import { SaleAreaService } from '@sales-master/pages/area/services/area.service';
import { VendorService } from '@master-data/vendor/services/vendor.service';
import type { 
    BranchListItem, 
    WarehouseListItem, 
    UOMListItem, 
    Currency, 
    DepartmentListItem 
} from '../types/master-data-types';
import type { TaxCode } from '../tax/types/tax-types';
import type { EmployeeListItem } from '../company/types/employee.types';
import type { ListResponse } from '@/shared/types/api.types';

// Caching Constants for Master Data
const MASTER_DATA_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const MASTER_DATA_GC_TIME = 30 * 60 * 1000;    // 30 minutes

/**
 * Hook to fetch all branches
 */
export function useBranches(enabled = true) {
    return useQuery<BranchListItem[]>({
        queryKey: ['master-branches'],
        queryFn: () => MasterDataService.getBranches(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all Units of Measure (UOMs)
 * Locked limit = 1000 and static queryKey to prevent unnecessary cache misses (fixes LOW 2)
 */
export function useUoms(enabled = true) {
    return useQuery<ListResponse<UOMListItem>>({
        queryKey: ['master-uoms'],
        queryFn: () => UOMService.getAll({ limit: 1000 }),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all units (Deprecated - please transition to useUoms in new code)
 */
export function useUnits(enabled = true) {
    return useUoms(enabled);
}

/**
 * Hook to fetch all warehouses
 */
export function useWarehouses(enabled = true) {
    return useQuery<ListResponse<WarehouseListItem>>({
        queryKey: ['master-warehouses'],
        queryFn: () => WarehouseService.getAll(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all locations
 */
export function useLocations(enabled = true, limit = 1000) {
    return useQuery({
        queryKey: ['master-locations'],
        queryFn: () => LocationService.getAll({ limit }),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all currencies
 */
export function useCurrencies(enabled = true) {
    return useQuery<Currency[]>({
        queryKey: ['master-currencies'],
        queryFn: () => MasterDataService.getCurrencies(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all tax codes
 */
export function useTaxCodes(enabled = true) {
    return useQuery<TaxCode[]>({
        queryKey: ['master-tax-codes'],
        queryFn: () => TaxCodeService.getTaxCodes(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all departments
 */
export function useDepartments(enabled = true) {
    return useQuery<DepartmentListItem[]>({
        queryKey: ['master-departments'],
        queryFn: () => MasterDataService.getDepartments(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all projects
 */
export function useProjects(enabled = true) {
    return useQuery({
        queryKey: ['master-projects'],
        queryFn: () => MasterDataService.getProjects(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all sale areas
 */
export function useSaleAreas(enabled = true) {
    return useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => SaleAreaService.getList(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}
/**
 * Hook to fetch all employees
 */
export function useEmployees(enabled = true) {
    return useQuery<EmployeeListItem[]>({
        queryKey: ['master-employees'],
        queryFn: () => MasterDataService.getEmployees(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}

/**
 * Hook to fetch all vendors (List)
 */
export function useVendors(enabled = true) {
    return useQuery({
        queryKey: ['master-vendors'],
        queryFn: () => VendorService.getList(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });
}
