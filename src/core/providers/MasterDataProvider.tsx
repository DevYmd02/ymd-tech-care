import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@core/api/api';
import { logger } from '@utils';
import { MasterDataContext, type MasterDataContextType } from '@core/contexts/MasterDataContext';

/**
 * @file MasterDataProvider.tsx
 * @description Centralized provider for frequently used Master Data (Units, Branches, Warehouses)
 * @purpose Implements "Pre-flight" caching strategy to prevent redundant API calls across components.
 */

export const MasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Fetch Units (UOM)
    const { data: units = [], isLoading: loadingUnits, refetch: refetchUnits } = useQuery({
        queryKey: ['master', 'units'],
        queryFn: async () => {
            try {
                const res = await api.get<Record<string, unknown>[]>('/unit');
                return Array.isArray(res) ? res : [];
            } catch (err) {
                logger.error('MasterDataProvider: Failed to fetch units', err);
                return [];
            }
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });

    // 2. Fetch Branches
    const { data: branches = [], isLoading: loadingBranches, refetch: refetchBranches } = useQuery({
        queryKey: ['master', 'branches'],
        queryFn: async () => {
            try {
                const res = await api.get<unknown>('/org-branches');
                const data = (res as Record<string, unknown>)?.data || res;
                return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
            } catch (err) {
                logger.error('MasterDataProvider: Failed to fetch branches', err);
                return [];
            }
        },
        staleTime: 30 * 60 * 1000,
    });

    // 3. Fetch Warehouses
    const { data: warehouses = [], isLoading: loadingWarehouses, refetch: refetchWarehouses } = useQuery({
        queryKey: ['master', 'warehouses'],
        queryFn: async () => {
            try {
                const res = await api.get<unknown>('/warehouse');
                const data = (res as Record<string, unknown>)?.data || res;
                return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
            } catch (err) {
                logger.error('MasterDataProvider: Failed to fetch warehouses', err);
                return [];
            }
        },
        staleTime: 30 * 60 * 1000,
    });

    const isLoading = loadingUnits || loadingBranches || loadingWarehouses;

    const refetchAll = useCallback(() => {
        refetchUnits();
        refetchBranches();
        refetchWarehouses();
    }, [refetchUnits, refetchBranches, refetchWarehouses]);

    const value = useMemo<MasterDataContextType>(() => ({
        units,
        branches,
        warehouses,
        isLoading,
        refetchAll
    }), [units, branches, warehouses, isLoading, refetchAll]);

    return (
        <MasterDataContext.Provider value={value}>
            {children}
        </MasterDataContext.Provider>
    );
};
