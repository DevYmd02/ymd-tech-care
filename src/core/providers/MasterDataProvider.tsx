import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@core/api/api';
import { logger } from '@utils';
import { MasterDataContext, type MasterDataContextType } from '@core/contexts/MasterDataContext';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { useEffect } from 'react';

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
                const res = await api.get<unknown>('/uom');
                const list = (res as Record<string, unknown>)?.items || (res as Record<string, unknown>)?.data || (Array.isArray(res) ? res : []);
                return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
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

    // 4. Fetch Employees
    const { data: employees = [], isLoading: loadingEmployees, refetch: refetchEmployees } = useQuery({
        queryKey: ['master', 'employees'],
        queryFn: async () => {
            try {
                const res = await api.get<unknown>('/employees');
                const list = (res as Record<string, unknown>)?.items || (res as Record<string, unknown>)?.data || (Array.isArray(res) ? res : []);
                return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
            } catch (err) {
                logger.error('MasterDataProvider: Failed to fetch employees', err);
                return [];
            }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes (shorter TTL as employees might change more often)
    });

    // 5. Fetch Departments
    const { data: departments = [], isLoading: loadingDepartments, refetch: refetchDepartments } = useQuery({
        queryKey: ['master', 'departments'],
        queryFn: async () => {
            try {
                const res = await api.get<unknown>('/department');
                const list = (res as Record<string, unknown>)?.items || (res as Record<string, unknown>)?.data || (Array.isArray(res) ? res : []);
                return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
            } catch (err) {
                logger.error('MasterDataProvider: Failed to fetch departments', err);
                return [];
            }
        },
        staleTime: 30 * 60 * 1000,
    });

    const isLoading = loadingUnits || loadingBranches || loadingWarehouses || loadingEmployees || loadingDepartments;

    // Sync with global singleton cache for services
    useEffect(() => { if (units.length) masterDataCache.set('units', units); }, [units]);
    useEffect(() => { if (branches.length) masterDataCache.set('branches', branches); }, [branches]);
    useEffect(() => { if (warehouses.length) masterDataCache.set('warehouses', warehouses); }, [warehouses]);
    useEffect(() => { if (employees.length) masterDataCache.set('employees', employees); }, [employees]);
    useEffect(() => { if (departments.length) masterDataCache.set('departments', departments); }, [departments]);

    const refetchAll = useCallback(() => {
        refetchUnits();
        refetchBranches();
        refetchWarehouses();
        refetchEmployees();
        refetchDepartments();
    }, [refetchUnits, refetchBranches, refetchWarehouses, refetchEmployees, refetchDepartments]);

    const value = useMemo<MasterDataContextType>(() => ({
        units,
        branches,
        warehouses,
        employees,
        departments,
        isLoading,
        refetchAll
    }), [units, branches, warehouses, employees, departments, isLoading, refetchAll]);

    return (
        <MasterDataContext.Provider value={value}>
            {children}
        </MasterDataContext.Provider>
    );
};
