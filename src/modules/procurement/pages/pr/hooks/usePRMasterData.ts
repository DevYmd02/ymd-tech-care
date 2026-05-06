import { useMemo, useCallback, useState } from 'react';
import { useWarehouses, useProjects, useTaxCodes, useCurrencies, useUnits } from '@/modules/master-data/hooks/useMasterData';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import type { ItemListItem, CostCenter, Project, WarehouseListItem, UnitListItem, Currency } from '@/modules/master-data/types/master-data-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { logger } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';

export interface MappedOption<T> {
    value: number | string;
    label: string;
    original?: T;
}

export const usePRMasterData = (enabled = true) => {
    // 1. Core Shared Hooks (Cached)
    const { data: warehouseRes, isLoading: isLoadingWH } = useWarehouses(enabled);
    const { data: projectsRes,  isLoading: isLoadingPrj } = useProjects(enabled);
    const { data: taxCodesRes,  isLoading: isLoadingTax } = useTaxCodes(enabled);
    const { data: unitsRes,     isLoading: isLoadingUnits } = useUnits(enabled);
    const { data: currenciesRes,isLoading: isLoadingCurr } = useCurrencies(enabled);

    // 2. Specialized Master Data
    const { data: costCentersRes, isLoading: isLoadingCC } = useQuery({
        queryKey: ['master-cost-centers'],
        queryFn: MasterDataService.getCostCenters,
        enabled
    });

    // 3. Items (We use a simple query for initial items, search function for dynamic)
    const { data: itemsRes, isLoading: isLoadingItems } = useQuery({
        queryKey: ['master-items-initial'],
        queryFn: () => MasterDataService.getItems(),
        enabled
    });

    const [products, setProducts] = useState<ItemListItem[]>([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    // Extraction Helper
    const extractArray = <T>(res: any): T[] => {
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (res?.items && Array.isArray(res.items)) return res.items;
        return [];
    };

    // Mapped Results
    const warehouses = useMemo(() => {
        const whArray = extractArray<WarehouseListItem>(warehouseRes);
        return whArray.map(w => ({
            value: Number(w.warehouse_id),
            label: `${w.warehouse_code} - ${w.warehouse_name}`,
            original: w
        }));
    }, [warehouseRes]);

    const costCenters = useMemo(() => extractArray<CostCenter>(costCentersRes), [costCentersRes]);
    const projects = useMemo(() => extractArray<Project>(projectsRes), [projectsRes]);
    const masterItems = useMemo(() => extractArray<ItemListItem>(itemsRes), [itemsRes]);
    const masterUnits = useMemo(() => extractArray<UnitListItem>(unitsRes), [unitsRes]);
    const currencies = useMemo(() => extractArray<Currency>(currenciesRes), [currenciesRes]);

    const purchaseTaxOptions = useMemo(() => {
        const taxArray = extractArray<TaxCode>(taxCodesRes);
        const filtered = taxArray.filter((t: TaxCode) => {
            if (t.is_active === undefined || t.is_active === null) return true;
            if (typeof t.is_active === 'boolean') return t.is_active;
            return String(t.is_active).toUpperCase() === 'Y' || String(t.is_active) === '1' || String(t.is_active).toLowerCase() === 'true';
        });
        return filtered.map((t: TaxCode) => ({
            value: Number(t.tax_code_id || t.tax_id),
            label: t.tax_code,
            original: t
        }));
    }, [taxCodesRes]);

    const searchProducts = useCallback(async (query: string, vendorId?: number | string) => {
        try {
            setIsSearchingProducts(true);
            const items = await MasterDataService.getItems(query, vendorId);
            setProducts(items);
        } catch (err) {
            logger.error('[usePRMasterData] Failed to search products:', err);
        } finally {
            setIsSearchingProducts(false);
        }
    }, []);

    return {
        products,
        warehouses,
        costCenters,
        projects,
        purchaseTaxOptions,
        currencies,
        masterItems,
        masterUnits,
        isLoading: isLoadingWH || isLoadingPrj || isLoadingTax || isLoadingUnits || isLoadingCurr || isLoadingCC || isLoadingItems,
        isSearchingProducts,
        searchProducts,
        error: null
    };
};