/**
 * @file ProductSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกสินค้า (Product)
 * 
 * @refactored 2026-01-22: Decoupled mock data from UI
 * - ProductSearchModalBase: Pure/Dumb component ที่รับ data ผ่าน props
 * - ProductSearchModal: Smart wrapper ที่ใช้ MOCK_PRODUCTS (ไม่รั่วใน production)
 */

import React from 'react';
import { SearchModal, type ColumnDef } from '@ui';
import api from '@/core/api/api';
import type { ProductLookup } from '@/modules/master-data/inventory/mocks/products';

// Re-export Product type for consumers
export type Product = ProductLookup;

// ====================================================================================
// COLUMN CONFIGURATION (Shared)
// ====================================================================================

const productColumns: ColumnDef<ProductLookup>[] = [
    { key: 'action', header: 'เลือก', width: '100px', align: 'center' },
    {
        key: 'item_code', header: 'รหัสสินค้า', width: '120px', render: (p: ProductLookup) => (
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.item_code}</span>
        )
    },
    {
        key: 'item_name', header: 'ชื่อสินค้า', width: '1fr', render: (p: ProductLookup) => (
            <span className="text-sm text-gray-700 dark:text-gray-300">{p.item_name}</span>
        )
    },
    {
        key: 'unit', header: 'หน่วย', width: '120px', render: (p: ProductLookup) => (
            <span className="text-xs text-gray-600 dark:text-gray-400">{p.unit}</span>
        )
    },
    {
        key: 'unit_price', header: 'ราคา/หน่วย', width: '140px', align: 'right', render: (p: ProductLookup) => (
            <span className="text-xs text-gray-500 dark:text-gray-400">{p.unit_price.toLocaleString()}</span>
        )
    },
];

// ====================================================================================
// BASE COMPONENT - Pure/Dumb Component (Receives data via props)
// ====================================================================================

/** Props for ProductSearchModalBase - Dumb Component */
export interface ProductSearchModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ProductLookup) => void;
    /** Product data to display - passed from parent */
    data: ProductLookup[];
    /** Custom title */
    title?: string;
    /** Custom subtitle */
    subtitle?: string;
    /** Custom empty text */
    emptyText?: string;
    /** Loading state */
    isLoading?: boolean;
}

/**
 * ProductSearchModalBase - Pure/Dumb Component
 * 
 * @description รับ data ผ่าน props ไม่ fetch เอง - สามารถ reuse ได้ง่าย
 * @usage ใช้เมื่อต้องการควบคุม data source เอง
 * 
 * @example
 * ```tsx
 * const myProducts = [...];
 * <ProductSearchModalBase 
 *   isOpen={open} 
 *   onClose={close} 
 *   onSelect={handleSelect}
 *   data={myProducts}
 * />
 * ```
 */
export const ProductSearchModalBase: React.FC<ProductSearchModalBaseProps> = ({
    isOpen,
    onClose,
    onSelect,
    data,
    title = 'ค้นหาสินค้า',
    subtitle = 'กรอกข้อมูลเพื่อค้นหาสินค้าในระบบ',
    emptyText = 'ไม่พบสินค้าที่ค้นหา',
    isLoading = false
}) => {
    return (
        <SearchModal<ProductLookup>
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
            filterFn={(p: ProductLookup, term: string) =>
                p.item_code.toLowerCase().includes(term) ||
                p.item_name.toLowerCase().includes(term)
            }
            getKey={(p: ProductLookup) => p.item_code}
            emptyText={emptyText}
            isLoading={isLoading}
        />
    );
};

// ====================================================================================
// SMART WRAPPER - Uses MOCK_PRODUCTS (Backward Compatible)
// ====================================================================================

/** Props for ProductSearchModal - Smart Wrapper */
interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ProductLookup) => void;
}

/**
 * ProductSearchModal - Smart Component (Uses MOCK_PRODUCTS)
 * 
 * @description Wrapper ที่ใช้ MOCK_PRODUCTS (จะไม่รั่วใน production เพราะ tree-shaking)
 * @usage ใช้เมื่อต้องการให้ component ใช้ mock data เอง (backward compatible)
 * 
 * @example
 * ```tsx
 * <ProductSearchModal 
 *   isOpen={open} 
 *   onClose={close} 
 *   onSelect={handleSelect}
 * />
 * ```
 */
export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [products, setProducts] = React.useState<ProductLookup[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                // In a real scenario, we'd have a ProductService.
                // For now, since we want to remove direct mock imports from UI,
                // we'll assume the central interceptor handles '/products'
                const response = await api.get<{ items: ProductLookup[] }>('/products');
                if (isMounted) {
                    setProducts(response.items || []);
                }
            } catch (error) {
                console.error('[ProductSearchModal] Error fetching products:', error);
                if (isMounted) {
                    setProducts([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchProducts();
        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    return (
        <ProductSearchModalBase
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            data={products}
            isLoading={isLoading}
        />
    );
};

