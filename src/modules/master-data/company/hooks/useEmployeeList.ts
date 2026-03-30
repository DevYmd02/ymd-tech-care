/**
 * @file useEmployeeList.ts
 * @description Hook for managing Employee list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { OrgEmployeeService } from '../services/employee.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function useEmployeeList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['employees', filters],
        queryFn: () => OrgEmployeeService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    return {
        ...query,
        employees: query.data?.items || [],
        totalCount: query.data?.total || 0,
    };
}
