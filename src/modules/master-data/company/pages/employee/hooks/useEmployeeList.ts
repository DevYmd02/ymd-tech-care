/**
 * @file useEmployeeList.ts
 * @description Hook for managing Employee list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { OrgEmployeeService } from '@company/services/employee.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function useEmployeeList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['employees', filters],
        queryFn: () => OrgEmployeeService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    const data = query.data;
    const employees = Array.isArray(data) ? data : (data?.items || []);
    const totalCount = Array.isArray(data) ? data.length : (data?.total || 0);

    return {
        ...query,
        employees,
        totalCount,
    };
}
