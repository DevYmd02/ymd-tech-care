import { useState, useEffect, useCallback } from 'react';
import { MasterDataService } from '@/core/api/master-data.service';
import type { ItemListItem, CostCenter, Project, WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';

export const usePRMasterData = () => {
    const [products, setProducts] = useState<ItemListItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [purchaseTaxOptions, setPurchaseTaxOptions] = useState<TaxCode[]>([]);
    
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
            setWarehouses(wh);
            setCostCenters(cc);
            setProjects(prj);
            
            // ⚠️ Purchase Context Filter: PR is a PURCHASE document
            // Only show PURCHASE (ภาษีซื้อ) and EXEMPT (ยกเว้น) tax types
            // Exclude SALES (ภาษีขาย) to prevent accounting errors
            const filtered = taxCodes.filter(
              t => (t.tax_type === 'PURCHASE' || t.tax_type === 'EXEMPT') && t.is_active
            );
            setPurchaseTaxOptions(filtered);
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
