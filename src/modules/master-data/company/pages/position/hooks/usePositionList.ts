/**
 * @file usePositionList.ts
 * @description Hook for managing Position list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { PositionService } from '@company/services/position.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function usePositionList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['positions', filters],
        queryFn: () => PositionService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    return {
        ...query,
        positions: query.data?.items || [],
        totalCount: query.data?.total || 0,
    };
}
