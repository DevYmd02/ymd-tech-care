import { useQuery } from '@tanstack/react-query';
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
    UnitListItem,
    TaxCodeListItem
} from '@/modules/master-data/inventory/types/product-types';

export function useMasterData(enabled: boolean = true) {
    const { data: itemTypes = [] } = useQuery({
        queryKey: ['master-item-types'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-type');
            const data = await response.json();
            return (data.items || data || []) as ItemTypeListItem[]; 
        },
        enabled
    });

    const { data: itemGroups = [] } = useQuery({
        queryKey: ['master-item-groups'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-group');
            const data = await response.json();
            return (data.items || data || []) as ItemGroupListItem[]; 
        },
        enabled
    });

    const { data: itemBrands = [] } = useQuery({
        queryKey: ['master-item-brands'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-brand');
            const data = await response.json();
            return (data.items || data || []) as ItemBrandListItem[];
        },
        enabled
    });

    const { data: itemPatterns = [] } = useQuery({
        queryKey: ['master-item-patterns'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-pattern');
            const data = await response.json();
            return (data.items || data || []) as ItemPatternListItem[];
        },
        enabled
    });

    const { data: itemDesigns = [] } = useQuery({
        queryKey: ['master-item-designs'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-design');
            const data = await response.json();
            return (data.items || data || []) as ItemDesignListItem[];
        },
        enabled
    });

    const { data: itemGrades = [] } = useQuery({
        queryKey: ['master-item-grades'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-grade');
            const data = await response.json();
            return (data.items || data || []) as ItemGradeListItem[];
        },
        enabled
    });

    const { data: itemClasses = [] } = useQuery({
        queryKey: ['master-item-classes'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-class');
            const data = await response.json();
            return (data.items || data || []) as ItemClassListItem[];
        },
        enabled
    });

    const { data: itemSizes = [] } = useQuery({
        queryKey: ['master-item-sizes'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-size');
            const data = await response.json();
            return (data.items || data || []) as ItemSizeListItem[];
        },
        enabled
    });

    const { data: itemColors = [] } = useQuery({
        queryKey: ['master-item-colors'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/item-color');
            const data = await response.json();
            return (data.items || data || []) as ItemColorListItem[];
        },
        enabled
    });

    
    const { data: uom = [] } = useQuery({
        queryKey: ['uom'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3000/api/uom');
            const data = await res.json();
            return (data.items || data || []) as UnitListItem[];
        },
        enabled
    });

    const { data: taxCodes = [] } = useQuery({
        queryKey: ['tax-codes'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3000/api/tax-code');
            const data = await res.json();
            return (data.items || data || []) as TaxCodeListItem[];
        },
        enabled
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