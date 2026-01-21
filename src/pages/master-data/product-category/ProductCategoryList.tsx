/**
 * @file ProductCategoryList.refactored.tsx
 * @description Refactored Product Category List using Generic Components (Proof of Concept)
 * @note This demonstrates the elimination of code duplication using GenericMasterDataList
 */

import { useState } from 'react';
import { Tag } from 'lucide-react';
import { GenericMasterDataList } from '../../../components/master-data';
import { useGenericMasterDataList } from '../../../hooks/useGenericMasterDataList';
import { ProductCategoryFormModal } from './ProductCategoryFormModal';
import { mockProductCategories } from '../../../__mocks__/masterDataMocks';
import { ActiveStatusBadge } from '../../../components/shared';
import type { ProductCategoryListItem } from '../../../types/master-data-types';
import type { GenericMasterDataListConfig } from '../../../types/generic-master-data-types';

/**
 * Configuration for Product Category List
 */
const productCategoryListConfig: GenericMasterDataListConfig<ProductCategoryListItem> = {
    title: 'กำหนดรหัสหมวดสินค้า',
    subtitle: 'จัดการข้อมูลหมวดสินค้าทั้งหมด',
    icon: Tag,
    createButtonText: 'เพิ่มหมวดสินค้าใหม่',
    searchPlaceholder: 'ค้นหารหัสหรือชื่อหมวด...',
    emptyMessage: 'ไม่พบข้อมูลหมวดสินค้า',
    deleteConfirmMessage: 'คุณต้องการลบข้อมูลหมวดสินค้านี้หรือไม่?',
    columns: [
        {
            header: 'รหัสหมวด',
            accessor: (item) => (
                <span className="whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
                    {item.category_code}
                </span>
            ),
        },
        {
            header: 'ชื่อหมวด',
            accessor: (item) => (
                <span className="text-gray-900 dark:text-white">{item.category_name}</span>
            ),
        },
        {
            header: 'ชื่อหมวด (EN)',
            accessor: (item) => (
                <span className="text-gray-500 dark:text-gray-400">
                    {item.category_name_en || '-'}
                </span>
            ),
            hideOnMobile: true,
        },
        {
            header: 'สถานะ',
            accessor: (item) => <ActiveStatusBadge isActive={item.is_active} />,
            className: 'text-center',
        },
    ],
};

/**
 * Refactored Product Category List Component
 * Uses GenericMasterDataList to eliminate code duplication
 */
export default function ProductCategoryListRefactored() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Use the generic hook for list management
    const listState = useGenericMasterDataList<ProductCategoryListItem>({
        fetchData: async () => {
            // Simulate API call with delay
            await new Promise((resolve) => setTimeout(resolve, 300));
            return mockProductCategories;
        },
        searchFields: ['category_code', 'category_name'],
        initialRowsPerPage: 10,
    });

    // CRUD Handlers
    const handleCreate = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        console.log('Delete category:', id);
        // After delete, refresh the list
        listState.refresh();
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        // Refresh data after modal closes
        listState.refresh();
    };

    return (
        <>
            <GenericMasterDataList
                config={productCategoryListConfig}
                items={listState.items}
                isLoading={listState.isLoading}
                searchTerm={listState.searchTerm}
                statusFilter={listState.statusFilter}
                currentPage={listState.currentPage}
                rowsPerPage={listState.rowsPerPage}
                totalItems={listState.totalItems}
                onSearchChange={listState.onSearchChange}
                onStatusFilterChange={listState.onStatusFilterChange}
                onPageChange={listState.onPageChange}
                onRowsPerPageChange={listState.onRowsPerPageChange}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={listState.onRefresh}
                getItemId={(item) => item.category_id}
            />

            <ProductCategoryFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                editId={editingId}
            />
        </>
    );
}
