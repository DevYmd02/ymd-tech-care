import { useQueries } from '@tanstack/react-query';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { useMemo } from 'react';

/**
 * Hook to batch fetch Vendor Names for a list ofIDs using useQueries.
 * This aggregates multiple single-id fetches in parallel with caching.
 * 
 * @param vendorIds Array of unique vendor IDs in the current view
 * @returns { isLoading, vendorMap }
 */
export const useVendorsBatchQuery = (vendorIds: number[]) => {
    // Multi-query execution
    const queries = useQueries({
        queries: vendorIds.map((id) => ({
            queryKey: ['vendor', id],
            queryFn: () => VendorService.getById(id),
            staleTime: 10 * 60 * 1000, // 10 minutes cache
            enabled: !!id,
        })),
    });

    const isLoading = queries.some((q) => q.isLoading);

    // Build lookup dictionary: Record<vendor_id, vendor_name>
    const vendorMap = useMemo(() => {
        const map: Record<string, string> = {};
        queries.forEach((q) => {
            if (q.data) {
                const id = q.data.vendor_id || q.data.id;
                if (id) {
                    map[String(id)] = q.data.vendor_name;
                }
            }
        });
        return map;
    }, [queries]);

    return {
        isLoading,
        vendorMap,
    };
};
