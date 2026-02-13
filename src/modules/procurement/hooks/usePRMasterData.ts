import { useState, useEffect, useCallback } from 'react';
import { MasterDataService } from '@/core/api/master-data.service';
import type { ItemListItem, CostCenter, Project, WarehouseListItem } from '@/modules/master-data/types/master-data-types';

export const usePRMasterData = () => {
    const [products, setProducts] = useState<ItemListItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    
    // Loading States
    const [isLoading, setIsLoading] = useState(true);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    
    const [error, setError] = useState<Error | null>(null);

    // Initial Fetch (Excluding Products)
    useEffect(() => {
        const fetchMasterData = async () => {
          try {
            setIsLoading(true);
            const [wh, cc, prj] = await Promise.all([
              MasterDataService.getWarehouses(),
              MasterDataService.getCostCenters(),
              MasterDataService.getProjects()
            ]);
            setWarehouses(wh);
            setCostCenters(cc);
            setProjects(prj);
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
    const searchProducts = useCallback(async (query: string, vendorId?: string) => {
        try {
            setIsSearchingProducts(true);
            const items = await MasterDataService.getItems(query, vendorId);
            setProducts(items);
        } catch (err) {
            console.error('Failed to search products:', err);
            // Optionally handle error specific to search
        } finally {
            setIsSearchingProducts(false);
        }
    }, []);

    return {
        products,
        warehouses,
        costCenters,
        projects,
        isLoading,
        isSearchingProducts, // Export new state
        searchProducts,      // Export new function
        error
    };
};
