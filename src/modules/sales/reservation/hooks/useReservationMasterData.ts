import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '@master-data';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { UnitService } from '@inventory/services/unit.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import { WarehouseService } from '@inventory/services/warehouse.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { SaleAreaService } from '@sales-master/pages/area/services/area.service';
import type { Currency } from '@master-data/types/master-data-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';

export const useReservationMasterData = (isOpen: boolean) => {
    // Branches
    const { data: branches = [] } = useQuery({
        queryKey: ['master-branches'],
        queryFn: MasterDataService.getBranches,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Currencies
    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Customers
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 1000 }),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });
    const customers = customerResponse?.data || [];

    // Tax Codes
    const { data: taxCodes = [] } = useQuery<TaxCode[]>({
        queryKey: ['master-tax-codes'],
        queryFn: TaxCodeService.getTaxCodes,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Departments
    const { data: departments = [] } = useQuery({
        queryKey: ['master-departments'],
        queryFn: MasterDataService.getDepartments,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Projects
    const { data: projects = [] } = useQuery({
        queryKey: ['master-projects'],
        queryFn: MasterDataService.getProjects,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Sale Areas
    const { data: saleAreas = [] } = useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => SaleAreaService.getList(),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    // Employees
    const { data: allEmployees = [] } = useQuery({
        queryKey: ['master-employees'],
        queryFn: MasterDataService.getEmployees,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const employees = useMemo(() => 
        allEmployees.filter(emp => emp.emp_type?.toString().trim() === 'S'),
    [allEmployees]);

    // Units (UOMs)
    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });
    const uoms = useMemo(() => uomResponse?.items || [], [uomResponse]);

    // Warehouses
    const { data: warehouseResponse } = useQuery({
        queryKey: ['master-warehouses'],
        queryFn: () => WarehouseService.getAll(),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });
    const warehouses = useMemo(() => warehouseResponse?.items || [], [warehouseResponse]);

    // Locations
    const { data: locationResponse } = useQuery({
        queryKey: ['master-locations'],
        queryFn: () => LocationService.getAll({ limit: 1000 }),
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });
    const locations = useMemo(() => locationResponse?.items || [], [locationResponse]);

    // Price Level Names
    const { data: priceLevelNames = [] } = useQuery({
        queryKey: ['master-price-level-names'],
        queryFn: MasterDataService.getPriceLevelNames,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const isMasterDataReady = useMemo(() => {
        if (!isOpen) return true;
        return (
            branches.length > 0 &&
            taxCodes.length > 0 &&
            uoms.length > 0 &&
            currencies.length > 0
        );
    }, [isOpen, branches.length, taxCodes.length, uoms.length, currencies.length]);

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
