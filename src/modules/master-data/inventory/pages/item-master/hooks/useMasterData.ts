import { useQuery } from '@tanstack/react-query';
import api from '@/core/api/api';
import type { 
    ItemTypeListItem, 
    ItemGroupListItem, 
    ItemBrandListItem, 
    ItemPatternListItem,
    ItemDesignListItem,
    ItemGradeListItem,
    ItemClassListItem,
    ItemSizeListItem,
    ItemColorListItem,
    UOMListItem,
    TaxCodeListItem
} from '@/modules/master-data/inventory/types/product-types';

// Caching Constants for Master Data
const MASTER_DATA_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const MASTER_DATA_GC_TIME = 30 * 60 * 1000;    // 30 minutes

export function useMasterData(enabled: boolean = true) {
    const { data: itemTypes = [] } = useQuery({
        queryKey: ['master-item-types'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-type');
            const data = response as { items?: ItemTypeListItem[]; data?: ItemTypeListItem[] } | ItemTypeListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemGroups = [] } = useQuery({
        queryKey: ['master-item-groups'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-group');
            const data = response as { items?: ItemGroupListItem[]; data?: ItemGroupListItem[] } | ItemGroupListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemBrands = [] } = useQuery({
        queryKey: ['master-item-brands'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-brand');
            const data = response as { items?: ItemBrandListItem[]; data?: ItemBrandListItem[] } | ItemBrandListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemPatterns = [] } = useQuery({
        queryKey: ['master-item-patterns'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-pattern');
            const data = response as { items?: ItemPatternListItem[]; data?: ItemPatternListItem[] } | ItemPatternListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemDesigns = [] } = useQuery({
        queryKey: ['master-item-designs'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-design');
            const data = response as { items?: ItemDesignListItem[]; data?: ItemDesignListItem[] } | ItemDesignListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemGrades = [] } = useQuery({
        queryKey: ['master-item-grades'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-grade');
            const data = response as { items?: ItemGradeListItem[]; data?: ItemGradeListItem[] } | ItemGradeListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemClasses = [] } = useQuery({
        queryKey: ['master-item-classes'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-class');
            const data = response as { items?: ItemClassListItem[]; data?: ItemClassListItem[] } | ItemClassListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemSizes = [] } = useQuery({
        queryKey: ['master-item-sizes'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-size');
            const data = response as { items?: ItemSizeListItem[]; data?: ItemSizeListItem[] } | ItemSizeListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: itemColors = [] } = useQuery({
        queryKey: ['master-item-colors'],
        queryFn: async () => {
            const response = await api.get<unknown>('/item-color');
            const data = response as { items?: ItemColorListItem[]; data?: ItemColorListItem[] } | ItemColorListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: uom = [] } = useQuery({
        queryKey: ['uom'],
        queryFn: async () => {
            const response = await api.get<unknown>('/uom');
            const data = response as { items?: UOMListItem[]; data?: UOMListItem[] } | UOMListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    const { data: taxCodes = [] } = useQuery({
        queryKey: ['tax-codes'],
        queryFn: async () => {
            const response = await api.get<unknown>('/tax-code');
            const data = response as { items?: TaxCodeListItem[]; data?: TaxCodeListItem[] } | TaxCodeListItem[];
            return Array.isArray(data) ? data : data.items || data.data || [];
        },
        enabled,
        staleTime: MASTER_DATA_STALE_TIME,
        gcTime: MASTER_DATA_GC_TIME,
    });

    return { 
        itemTypes, 
        itemGroups, 
        itemBrands, 
        itemPatterns, 
        itemDesigns, 
        itemGrades, 
        itemClasses, 
        itemSizes, 
        itemColors,
        uom,
        taxCodes
     };
}