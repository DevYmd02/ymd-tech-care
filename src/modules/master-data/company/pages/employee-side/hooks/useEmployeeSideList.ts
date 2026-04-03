/**
 * @file useEmployeeSideList.ts
 * @description Hook for managing EmployeeSide list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { EmployeeSideService } from '@company/services/employee-side.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function useEmployeeSideList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['employee-sides', filters],
        queryFn: () => EmployeeSideService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    return {
        ...query,
        sides: query.data?.items || [],
        totalCount: query.data?.total || 0,
    };
}
