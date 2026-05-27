import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    useBranches, useUoms, useWarehouses, useLocations,
    useCurrencies, useTaxCodes, useDepartments, useProjects,
    useSaleAreas, useEmployees
} from '@master-data/hooks/useMasterData';
import { MasterDataService } from '@master-data';
import { CustomerService } from '@customer/customer-master/services/customer.service';

export const useReservationMasterData = (isOpen: boolean) => {
    // ✅ Shared-cache global hooks — queryKeys consistent with MasterDataProvider
    const { data: branches = [] } = useBranches(isOpen);
    const { data: currencies = [] } = useCurrencies(isOpen);
    const { data: taxCodes = [] } = useTaxCodes(isOpen);
    const { data: departments = [] } = useDepartments(isOpen);
    const { data: projects = [] } = useProjects(isOpen);
    const { data: saleAreas = [] } = useSaleAreas(isOpen);
    const { data: allEmployees = [] } = useEmployees(isOpen);
    const { data: uomResponse } = useUoms(isOpen);
    const { data: warehouseResponse } = useWarehouses(isOpen);
    const { data: locationResponse } = useLocations(isOpen, 1000);

    // Custom queries (no global hook available)
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 1000 }),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });
    const customers = customerResponse?.data || [];

    // Price Level Names
    const { data: priceLevelNames = [] } = useQuery({
        queryKey: ['master-price-level-names'],
        queryFn: MasterDataService.getPriceLevelNames,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Derived values
    const employees = useMemo(() => 
        allEmployees.filter(emp => emp.emp_type?.toString().trim() === 'S'),
    [allEmployees]);

    const uoms = useMemo(() => uomResponse?.items || [], [uomResponse]);
    const warehouses = useMemo(() => warehouseResponse?.items || [], [warehouseResponse]);
    const locations = useMemo(() => locationResponse?.items || [], [locationResponse]);

    const isMasterDataReady = useMemo(() => {
        if (!isOpen) return true;
        return (
            branches.length > 0 &&
            taxCodes.length > 0 &&
            uoms.length > 0 &&
            currencies.length > 0 &&
            warehouses.length > 0 &&
            locations.length > 0
        );
    }, [isOpen, branches.length, taxCodes.length, uoms.length, currencies.length, warehouses.length, locations.length]);

    return {
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        saleAreas,
        employees,
        uoms,
        warehouses,
        locations,
        priceLevelNames,
        isMasterDataReady
    };
};
