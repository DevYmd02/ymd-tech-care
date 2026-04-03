/**
 * @file useEmployeeGroupList.ts
 * @description Hook for managing EmployeeGroup list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { EmployeeGroupService } from '@company/services/employee-group.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function useEmployeeGroupList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['employee-groups', filters],
        queryFn: () => EmployeeGroupService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    return {
        ...query,
        groups: query.data?.items || [],
        totalCount: query.data?.total || 0,
    };
}
