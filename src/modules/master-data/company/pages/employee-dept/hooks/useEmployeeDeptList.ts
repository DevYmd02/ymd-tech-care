/**
 * @file useEmployeeDeptList.ts
 * @description Hook for managing EmployeeDept list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { EmployeeDeptService } from '@company/services/org-section.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function useEmployeeDeptList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['employee-depts', filters],
        queryFn: () => EmployeeDeptService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    return {
        ...query,
        depts: query.data?.items || [],
        totalCount: query.data?.total || 0,
    };
}
