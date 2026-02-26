import { useState, useEffect, useCallback } from 'react';
import { MasterDataService } from '@/modules/master-data';
import type { ItemListItem, CostCenter, Project, WarehouseListItem, UnitListItem } from '@/modules/master-data/types/master-data-types';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { logger } from '@/shared/utils/logger';

export interface MappedOption<T> {
    value: string;
    label: string;
    original?: T;
}

export const usePRMasterData = () => {
     const [products, setProducts] = useState<ItemListItem[]>([]);
     const [warehouses, setWarehouses] = useState<MappedOption<WarehouseListItem>[]>([]);
     const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
     const [projects, setProjects] = useState<Project[]>([]);
     const [purchaseTaxOptions, setPurchaseTaxOptions] = useState<MappedOption<TaxCode>[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    
    // Add master arrays for hydration
    const [masterItems, setMasterItems] = useState<ItemListItem[]>([]);
    const [masterUnits, setMasterUnits] = useState<UnitListItem[]>([]);
    
    const [error, setError] = useState<Error | null>(null);

    // Initial Fetch (Excluding Products)
    useEffect(() => {
        const fetchMasterData = async () => {
          try {
            setIsLoading(true);
            
            // INDEPENDENT FETCHING - Failures won't chain-react!
            const results = await Promise.allSettled([
              MasterDataService.getWarehouses(),
              MasterDataService.getCostCenters(),
              MasterDataService.getProjects(),
              TaxCodeService.getTaxCodes(),
              MasterDataService.getItems(),
              MasterDataService.getUnits()
            ]);

            const wh = results[0].status === 'fulfilled' ? results[0].value : [];
            const cc = results[1].status === 'fulfilled' ? results[1].value : [];
            const prj = results[2].status === 'fulfilled' ? results[2].value : [];
            const taxCodes = results[3].status === 'fulfilled' ? results[3].value : [];
            const itemsResult = results[4].status === 'fulfilled' ? results[4].value : [];
            const unitsResult = results[5].status === 'fulfilled' ? results[5].value : [];

            if (results[3].status === 'rejected') {
              logger.error('[usePRMasterData] Tax fetch error:', results[3].reason);
            }

            logger.info('[usePRMasterData] Unwrapped Cost Centers count:', Array.isArray(cc) ? cc.length : 0);
            logger.info('[usePRMasterData] Unwrapped Projects count:', Array.isArray(prj) ? prj.length : 0);

             setWarehouses((wh || []).map(w => ({
               value: w.warehouse_id,
               label: `${w.warehouse_code} - ${w.warehouse_name}`,
               original: w
             })));
             
             // Extract array cleanly if the API returned an object wrapped in { data: [] }
             const extractArray = <T>(res: T[] | { data?: T[]; items?: T[] } | undefined | null): T[] => {
               if (Array.isArray(res)) return res;
               if (res !== null && typeof res === 'object') {
                 if ('data' in res && Array.isArray(res.data)) return res.data;
                 if ('items' in res && Array.isArray(res.items)) return res.items;
               }
               return [];
             };
             
             setCostCenters(extractArray(cc));
             setProjects(extractArray(prj));
             setMasterItems(extractArray(itemsResult));
             setMasterUnits(extractArray(unitsResult));
             
             // Tax Filter: Default to active when is_active is not provided by API
             const taxArray = extractArray(taxCodes);
             const filtered = taxArray.filter(
               (t: TaxCode) => {
                 // If is_active is not provided by the API, default to active
                 if (t.is_active === undefined || t.is_active === null) return true;
                 if (typeof t.is_active === 'boolean') return t.is_active;
                 return String(t.is_active).toUpperCase() === 'Y' || String(t.is_active) === '1' || String(t.is_active).toLowerCase() === 'true';
               }
             );
             setPurchaseTaxOptions(filtered.map((t: TaxCode) => ({
               value: String(t.tax_code_id || t.tax_id),
               label: `${t.tax_code} (${t.tax_rate}%)`,
               original: t
             })));
          } catch (err) {
            logger.error('[usePRMasterData] Failed to fetch master data:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch master data'));
          } finally {
            setIsLoading(false);
          }
        };
        fetchMasterData();
      }, []);

    // Product Search Function
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
        masterItems,
        masterUnits,
        isLoading,
        isSearchingProducts,
        searchProducts,
        error
    };
};