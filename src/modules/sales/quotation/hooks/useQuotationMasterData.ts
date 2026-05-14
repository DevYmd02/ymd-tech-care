import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '@master-data';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { UOMService } from '@inventory/services/uom.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import type { Currency } from '@master-data/types/master-data-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';

const MASTER_STALE = 1000 * 60 * 30; // 30 mins
const REF_STALE = 1000 * 60 * 10;    // 10 mins

export function useQuotationMasterData(isOpen: boolean) {
    const { data: branches = [] } = useQuery({
        queryKey: ['master-branches'],
        queryFn: MasterDataService.getBranches,
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 100 }),
        enabled: isOpen,
        staleTime: REF_STALE,
    });
    const customers = customerResponse?.data || [];

    const { data: taxCodes = [] } = useQuery<TaxCode[]>({
        queryKey: ['master-tax-codes'],
        queryFn: TaxCodeService.getTaxCodes,
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['master-departments'],
        queryFn: MasterDataService.getDepartments,
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['master-projects'],
        queryFn: MasterDataService.getProjects,
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: saleAreas = [] } = useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => MasterDataService.getSaleAreas(),
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: allEmployees = [] } = useQuery({
        queryKey: ['master-employees'],
        queryFn: () => MasterDataService.getEmployees(),
        enabled: isOpen,
        staleTime: REF_STALE,
    });

    const employees = useMemo(() => 
        allEmployees.filter(emp => emp.emp_type?.toString().trim() === 'S'),
    [allEmployees]);
    
    const { data: priceLevelNames = [] } = useQuery({
        queryKey: ['master-price-level-names'],
        queryFn: () => MasterDataService.getPriceLevelNames(),
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });

    const { data: uomResponse, isLoading: isLoadingUoms } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UOMService.getAll({ limit: 1000 }),
        enabled: isOpen,
        staleTime: MASTER_STALE,
    });
    const uoms = useMemo(() => uomResponse?.items || [], [uomResponse]);

    // Optimize Readiness Check: Use isLoading status instead of .length > 0
    // This prevents hanging if a master data list is legitimately empty.
    const isMasterDataReady = !isLoadingUoms; 

    return {
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        saleAreas,
        employees,
        priceLevelNames,
        uoms,
        isMasterDataReady
    };
}
