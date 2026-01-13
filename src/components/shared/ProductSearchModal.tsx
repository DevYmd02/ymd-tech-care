/**
 * @file ProductSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกสินค้า (Product)
 * @usage เรียกใช้งานจาก PRItemTable.tsx เมื่อกดปุ่มค้นหาในแต่ละแถว
 * @refactored ใช้ SearchModal component เพื่อลด duplicate code
 */

import React from 'react';
import { SearchModal, type ColumnDef } from './SearchModal';
import { MOCK_PRODUCTS, type Product } from '../../mocks/products';

// Re-export Product type for consumers
export type { Product } from '../../mocks/products';

/** Props ของ ProductSearchModal */
interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
}

// ====================================================================================
// COLUMN CONFIGURATION
// ====================================================================================

const productColumns: ColumnDef<Product>[] = [
    { key: 'action', header: 'เลือก', width: '100px', align: 'center' },
    {
        key: 'code', header: 'รหัสสินค้า', width: '100px', render: (p) => (
            <span className="text-sm font-bold text-gray-800">{p.code}</span>
        )
    },
    {
        key: 'name', header: 'ชื่อสินค้า', width: '1fr', render: (p) => (
            <span className="text-sm text-gray-700">{p.name}</span>
        )
    },
    {
        key: 'detail', header: 'รายละเอียด', width: '1fr', render: (p) => (
            <span className="text-xs text-gray-500">{p.detail}</span>
        )
    },
];

// ====================================================================================
// COMPONENT - ProductSearchModal
// ====================================================================================

export const ProductSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    return (
        <SearchModal<Product>
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            title="ค้นหาสินค้า"
            subtitle="กรอกข้อมูลเพื่อค้นหาสินค้าในระบบ"
            searchLabel="รหัสสินค้าหรือชื่อสินค้า"
            searchPlaceholder="รหัสสินค้าหรือชื่อสินค้า"
            accentColor="blue"
            data={MOCK_PRODUCTS}
            columns={productColumns}
            filterFn={(p, term) =>
                p.code.toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term)
            }
            getKey={(p) => p.code}
            emptyText="ไม่พบสินค้าที่ค้นหา"
        />
    );
};
