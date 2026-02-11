import { useState, useEffect } from 'react';
import { MasterDataService } from '@/core/api/master-data.service';
import type { ItemListItem, CostCenter, Project } from '@/modules/master-data/types/master-data-types';

export const usePRMasterData = () => {
    const [products, setProducts] = useState<ItemListItem[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchMasterData = async () => {
          try {
            setIsLoading(true);
            const [items, cc, prj] = await Promise.all([
              MasterDataService.getItems(),
              MasterDataService.getCostCenters(),
              MasterDataService.getProjects()
            ]);
            setProducts(items);
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

    return {
        products,
        costCenters,
        projects,
        isLoading,
        error
    };
};
