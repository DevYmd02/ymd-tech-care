import { useQuery } from '@tanstack/react-query';
import { WarehouseService } from '../services/warehouse.service';

/**
 * @file useWarehouseList.ts
 * @description Custom Hook for fetching the list of warehouses
 * @purpose Encapsulates useQuery logic for reusability and centralizes query keys
 */

export const warehouseKeys = {
  all: ['warehouses'] as const,
};

export interface UseWarehouseListOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useWarehouseList(options: UseWarehouseListOptions = {}) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  return useQuery({
    queryKey: warehouseKeys.all,
    queryFn: () => WarehouseService.getAll(),
    enabled,
    staleTime,
  });
}
