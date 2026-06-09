import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useWarehouses, useProjects, useTaxCodes, useCurrencies, useUnits } from '@/modules/master-data/hooks/useMasterData';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import type { ItemListItem, CostCenter, Project, WarehouseListItem, UOMListItem, Currency } from '@/modules/master-data/types/master-data-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { logger } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';

// Caching Constants for Master Data (Standardized from useMasterData.ts)
const MASTER_DATA_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const MASTER_DATA_GC_TIME = 30 * 60 * 1000;    // 30 minutes

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
        queryFn: () => MasterDataService.getCostCenters(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    // 3. Items (We use a simple query for initial items, search function for dynamic)
    const { data: itemsRes, isLoading: isLoadingItems } = useQuery({
        queryKey: ['master-items-initial'],
        queryFn: () => MasterDataService.getItems(),
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const [products, setProducts] = useState<ItemListItem[]>([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    // Extraction Helper
    const extractArray = <T>(res: unknown): T[] => {
        if (Array.isArray(res)) return res as T[];
        const r = res as { data?: T[]; items?: T[] } | null;
        if (r?.data && Array.isArray(r.data)) return r.data;
        if (r?.items && Array.isArray(r.items)) return r.items;
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
    const units = useMemo(() => extractArray<UOMListItem>(unitsRes), [unitsRes]);
    const currencies = useMemo(() => extractArray<Currency>(currenciesRes), [currenciesRes]);

    const purchaseTaxOptions = useMemo(() => {
        const taxArray = extractArray<TaxCode>(taxCodesRes);
        return taxArray.map(tax => ({
            label: `${tax.tax_code} - ${tax.tax_name} (${tax.tax_rate}%)`,
            value: String(tax.tax_code_id),
            rate: Number(tax.tax_rate),
            original: tax
        }));
    }, [taxCodesRes]);

    const searchControllerRef = useRef<AbortController | null>(null);
    const searchProducts = useCallback(async (query: string, vendorId?: number | string) => {
        if (searchControllerRef.current) {
            searchControllerRef.current.abort();
        }
        searchControllerRef.current = new AbortController();

        try {
            setIsSearchingProducts(true);
            const items = await MasterDataService.getItems(query, vendorId, { signal: searchControllerRef.current.signal });
            setProducts(items);
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            logger.error('[usePRMasterData] Failed to search products:', err);
        } finally {
            setIsSearchingProducts(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            searchControllerRef.current?.abort();
            searchControllerRef.current = null;
        };
    }, []);

    return {
        warehouses,
        costCenters,
        projects,
        masterItems,
        purchaseTaxOptions,
        currencies,
        masterUoms: units,
        products,
        isSearchingProducts,
        searchProducts,
        isLoading: isLoadingWH || isLoadingPrj || isLoadingTax || isLoadingUnits || isLoadingCurr || isLoadingCC || isLoadingItems
    };
};