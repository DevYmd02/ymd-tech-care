import { useState, useEffect, useCallback } from 'react';
import { MasterDataService } from '@/core/api/master-data.service';
import type { ItemListItem, CostCenter, Project, WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { MasterDataId } from '@/modules/procurement/types/pr-types';

export interface MappedOption<T> {
    value: MasterDataId;
    label: string;
    original?: T;
}

export const usePRMasterData = () => {
     const [products, setProducts] = useState<ItemListItem[]>([]);
     const [warehouses, setWarehouses] = useState<MappedOption<WarehouseListItem>[]>([]);
     const [costCenters, setCostCenters] = useState<MappedOption<CostCenter>[]>([]);
     const [projects, setProjects] = useState<MappedOption<Project>[]>([]);
     const [purchaseTaxOptions, setPurchaseTaxOptions] = useState<MappedOption<TaxCode>[]>([]);
    
    // Loading States
    const [isLoading, setIsLoading] = useState(true);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    
    const [error, setError] = useState<Error | null>(null);

    // Initial Fetch (Excluding Products)
    useEffect(() => {
        const fetchMasterData = async () => {
          try {
            setIsLoading(true);
            const [wh, cc, prj, taxCodes] = await Promise.all([
              MasterDataService.getWarehouses(),
              MasterDataService.getCostCenters(),
              MasterDataService.getProjects(),
              TaxService.getTaxCodes()
            ]);
             setWarehouses(wh.map(w => ({
               value: w.warehouse_id,
               label: `${w.warehouse_code} - ${w.warehouse_name}`,
               original: w
             })));
             
             setCostCenters(cc.map(item => ({
               value: item.cost_center_id,
               label: `${item.cost_center_code} - ${item.cost_center_name}`,
               original: item
             })));
             
             setProjects(prj.map(p => ({
               value: p.project_id,
               label: `${p.project_code} - ${p.project_name}`,
               original: p
             })));
             
             // ⚠️ Purchase Context Filter: PR is a PURCHASE document
             const filtered = taxCodes.filter(
               t => (t.tax_type === 'PURCHASE' || t.tax_type === 'EXEMPT') && t.is_active
             );
             setPurchaseTaxOptions(filtered.map(t => ({
               value: t.tax_id,
               label: `${t.tax_code} (${t.tax_rate}%)`,
               original: t
             })));
          } catch (err) {
            console.error('Failed to fetch master data:', err);
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
            console.error('Failed to search products:', err);
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
        isLoading,
        isSearchingProducts,
        searchProducts,
        error
    };
};
