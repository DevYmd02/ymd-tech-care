/**
 * @file usePriceLevel.ts
 * @description Hook for managing Price Level listing logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PriceLevelService } from '../services/price-level.service';
import type { PriceLevel, ApiPriceLevel } from '../types/price-level.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UOMService } from '@/modules/master-data/inventory/services/uom.service';
import { UOMConversionService } from '@/modules/master-data/inventory/services/uom-conversion.service';
import type { ItemListItem, UOMListItem } from '@/modules/master-data/inventory/types/product-types';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import { PriceLevelNameService } from '@sales-master/pages/price-level-name/services/price-level-name.service';
import { logger } from '@/shared/utils';

export function usePriceLevel(isActive: boolean = true) {
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'item_code',
          search2: 'item_name',
          search3: 'uom_name'
        }
    });

    const [allPriceLevels, setAllPriceLevels] = useState<PriceLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [levelNameMap, setLevelNameMap] = useState<Map<number, string>>(new Map());

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch everything in parallel for performance
            const [priceLevels, itemsResponse, unitsResponse, levelNames] = await Promise.all([
                PriceLevelService.getList(),
                ItemMasterService.getAll({ limit: 1000 }), // Get enough items for mapping
                UOMService.getAll(),
                PriceLevelNameService.getList().catch(() => []), // Fallback to empty array if 404
            ]);

            // Build level name map: level_no -> name
            const nameMap = new Map<number, string>(
                (Array.isArray(levelNames) ? levelNames : []).map(ln => [Number(ln.level_no), ln.name])
            );
            setLevelNameMap(nameMap);

            const itemMap = new Map<number, ItemListItem>((itemsResponse.items || []).map((item: ItemListItem) => [Number(item.item_id), item]));
            const unitMap = new Map<number, UOMListItem>((unitsResponse.items || []).map((unit: UOMListItem) => [Number(unit.uom_id), unit]));

            // Fetch conversions for all unique items in parallel
            const uniqueItemIds = Array.from(
                new Set(
                    priceLevels
                        .map((pl: PriceLevel) => Number(pl.item_id))
                        .filter(id => !isNaN(id) && id > 0)
                )
            );

            const conversionsResponses = await Promise.all(
                uniqueItemIds.map(itemId => 
                    UOMConversionService.getByItemId(itemId).catch(() => ({ items: [] }))
                )
            );

            // Build conversion map: conversion_id -> UOMConversionListItem
            const conversionMap = new Map<number, UOMConversionListItem>();
            conversionsResponses.forEach(res => {
                const items = res?.items || [];
                items.forEach((c) => {
                    if (c && c.conversion_id) {
                        conversionMap.set(Number(c.conversion_id), c);
                    }
                });
            });

            const mappedData = priceLevels.map((pl: PriceLevel) => {
                const rawPl = pl as unknown as ApiPriceLevel;
                const item = itemMap.get(Number(pl.item_id));
                
                const targetUomId = Number(
                    pl.item_uom_id || 
                    rawPl.itemUomId || 
                    pl.uom_id || 
                    rawPl.uomId || 
                    0
                );
                const unit = unitMap.get(targetUomId);
                const conversion = conversionMap.get(targetUomId);
                
                const resolvedUomName = 
                    conversion?.from_unit_name ||
                    pl.item_uom?.from_uom?.uom_name ||
                    rawPl.item_uom?.from_uom?.uom_name ||
                    rawPl.item_uom?.fromUom?.uom_name ||
                    rawPl.item_uom?.fromUom?.uomName ||
                    rawPl.itemUom?.from_uom?.uom_name ||
                    rawPl.itemUom?.fromUom?.uom_name ||
                    rawPl.itemUom?.fromUom?.uomName ||
                    unit?.uom_name ||
                    pl.uom_name ||
                    rawPl.uom_name ||
                    '-';
                
                return {
                    ...pl,
                    item_code: item?.item_code || pl.item_code || '-',
                    item_name: item?.item_name || pl.item_name || '-',
                    item_name_en: item?.item_name_en || pl.item_name_en || '',
                    uom_name: resolvedUomName,
                };
            });

            setAllPriceLevels(mappedData);
        } catch (error: unknown) {
            logger.error('Failed to fetch price levels:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (isActive && !hasFetched) {
            fetchData();
            setHasFetched(true);
        }
    }, [isActive, fetchData, hasFetched]);

    const filteredData = useMemo(() => {
        let result = [...allPriceLevels];

        // Filter by Item Code
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => 
                (item.item_code || '').toLowerCase().includes(term)
            );
        }

        // Filter by Item Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => 
                (item.item_name || '').toLowerCase().includes(term) ||
                (item.item_name_en || '').toLowerCase().includes(term)
            );
        }

        // Filter by UOM Name
        if (filters.search3) {
            const term = filters.search3.toLowerCase();
            result = result.filter(item => 
                (item.uom_name || '').toLowerCase().includes(term)
            );
        }

        // Sort by listno if available, else by item_id
        result.sort((a, b) => (a.listno || 0) - (b.listno || 0));

        return result;
    }, [allPriceLevels, filters]);

    const paginatedData = useMemo(() => {
        const startIndex = (filters.page - 1) * filters.limit;
        return filteredData.slice(startIndex, startIndex + filters.limit);
    }, [filteredData, filters.page, filters.limit]);

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string | number) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback(async (id: string | number) => {
        if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            try {
                const success = await PriceLevelService.delete(id);
                if (success) {
                    fetchData();
                }
            } catch (error: unknown) {
                logger.error('Failed to delete price level:', error);
            }
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    return {
        filters,
        setFilters,
        handlePageChange,
        resetFilters,
        isLoading,
        isModalOpen,
        editingId,
        filteredData,
        paginatedData,
        fetchData,
        handleCreateNew,
        handleEdit,
        handleDelete,
        handleModalClose,
        levelNameMap,
    };
}
