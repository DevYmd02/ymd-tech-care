/**
 * @file useJobList.ts
 * @description Hook for managing Job list with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { JobService } from '@company/services/org-job.service';
import type { TableFilters } from '@/shared/hooks/useTableFilters';

export function useJobList(filters: Partial<TableFilters>) {
    const query = useQuery({
        queryKey: ['jobs', filters],
        queryFn: () => JobService.getList(filters),
        placeholderData: (previousData) => previousData,
    });

    return {
        ...query,
        jobs: query.data?.items || [],
        totalCount: query.data?.total || 0,
    };
}
