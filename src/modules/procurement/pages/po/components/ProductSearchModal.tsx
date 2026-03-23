/**
 * @file ProductSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกสินค้า (Product) - Local copy for PO Form
 * 
 * @refactored 2026-01-22: Decoupled mock data from UI
 * - ProductSearchModalBase: Pure/Dumb component ที่รับ data ผ่าน props
 * - ProductSearchModal: Smart wrapper ที่ใช้ MOCK_PRODUCTS (ไม่รั่วใน production)
 */

import React from 'react';
import { SearchModal, type ColumnDef } from '@ui';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';

// Re-export type for consumers
export type Product = ItemListItem;

// ====================================================================================
// COLUMN CONFIGURATION (Shared)
// ====================================================================================

const productColumns: ColumnDef<ItemListItem>[] = [
    { key: 'action', header: 'เลือก', width: '100px', align: 'center' },
    {
        key: 'item_code', header: 'รหัสสินค้า', width: '120px', render: (p: ItemListItem) => (
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.item_code}</span>
        )
    },
    {
        key: 'item_name', header: 'ชื่อสินค้า', width: '1fr', render: (p: ItemListItem) => (
            <span className="text-sm text-gray-700 dark:text-gray-300">{p.item_name}</span>
        )
    },
    {
        key: 'unit_name', header: 'หน่วย', width: '120px', render: (p: ItemListItem) => (
            <span className="text-xs text-gray-600 dark:text-gray-400">{p.uom_name || p.unit_name || p.base_uom_name || '-'}</span>
        )
    },
    {
        key: 'standard_cost', header: 'ราคามาตรฐาน', width: '140px', align: 'right', render: (p: ItemListItem) => (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {(Number(p.standard_cost) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
        )
    },
];

// ====================================================================================
// BASE COMPONENT - Pure/Dumb Component (Receives data via props)
// ====================================================================================

export interface ProductSearchModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ItemListItem) => void;
    data: ItemListItem[];
    title?: string;
    subtitle?: string;
    emptyText?: string;
    isLoading?: boolean;
    onSearchChange?: (term: string) => void;
}

export const ProductSearchModalBase: React.FC<ProductSearchModalBaseProps> = ({
    isOpen,
    onClose,
    onSelect,
    data,
    title = 'ค้นหาสินค้า',
    subtitle = 'กรอกข้อมูลเพื่อค้นหาสินค้าในระบบ',
    emptyText = 'ไม่พบสินค้าในระบบ',
    isLoading = false,
    onSearchChange
}) => {
    return (
        <SearchModal<ItemListItem>
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            title={title}
            subtitle={subtitle}
            searchLabel="รหัสสินค้าหรือชื่อสินค้า"
            searchPlaceholder="รหัสสินค้าหรือชื่อสินค้า"
            accentColor="blue"
            data={data}
            columns={productColumns}
            filterFn={(p: ItemListItem, term: string) =>
                p.item_code.toLowerCase().includes(term) ||
                p.item_name.toLowerCase().includes(term)
            }
            getKey={(p: ItemListItem) => p.item_id || p.item_code}
            emptyText={emptyText}
            isLoading={isLoading}
            onSearchChange={onSearchChange}
        />
    );
};

// ====================================================================================
// SMART WRAPPER
// ====================================================================================

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ItemListItem) => void;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { data: response, isLoading } = useQuery({
        queryKey: ['items-lookup', debouncedSearch],
        queryFn: () => ItemMasterService.getAll({ q: debouncedSearch, limit: 20 }),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
    });

    const products = response?.items || [];

    return (
        <ProductSearchModalBase
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            data={products}
            isLoading={isLoading}
            onSearchChange={setSearchTerm}
        />
    );
};
