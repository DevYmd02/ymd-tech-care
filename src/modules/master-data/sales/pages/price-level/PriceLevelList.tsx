/**
 * @file PriceLevelList.tsx
 * @description List page for Price Level Master Data — with Tab UI
 *   Tab 1: กำหนดราคาสินค้า (/multi-price-item)
 *   Tab 2: ชื่อระดับราคา (/item-price-level-name)
 */

import { useState, useMemo } from 'react';
import { Edit2, Trash2, DollarSign, Tag } from 'lucide-react';
import PriceLevelFormModal from './PriceLevelFormModal';
import PriceLevelNameFormModal from '@sales-master/pages/price-level-name/PriceLevelNameFormModal';
import { usePriceLevel } from './hooks/usePriceLevel';
import { usePriceLevelName } from '@sales-master/pages/price-level-name/hooks/usePriceLevelName';
import type { PriceLevel } from './types/price-level.types';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

type ActiveTab = 'price-level' | 'level-name';

export default function PriceLevelList() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('price-level');

    // ==================== HOOK: TAB 1 — Price Level ====================
    const {
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
    } = usePriceLevel(activeTab === 'price-level');

    // ==================== HOOK: TAB 2 — Level Name ====================
    const {
        filteredData: nameFilteredData,
        paginatedData: namePaginatedData,
        isLoading: nameLoading,
        isModalOpen: nameModalOpen,
        editingId: nameEditingId,
        search: nameSearch,
        setSearch: setNameSearch,
        page: namePage,
        limit: nameLimit,
        setLimit: setNameLimit,
        fetchData: nameFetchData,
        handleEdit: nameHandleEdit,
        handleModalClose: nameHandleModalClose,
        handlePageChange: nameHandlePageChange,
        resetFilters: nameResetFilters,
    } = usePriceLevelName(activeTab === 'level-name');

    // ==================== FILTER CONFIG (Tab 1) ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters & string>[] = useMemo(() => [
        { name: 'search', label: 'รหัสสินค้า', type: 'text', placeholder: 'ค้นหารหัสสินค้า...' },
        { name: 'search2', label: 'ชื่อสินค้า', type: 'text', placeholder: 'ค้นหาชื่อสินค้า...' },
        { name: 'search3', label: 'หน่วยนับ', type: 'text', placeholder: 'ค้นหาหน่วยนับ...' },
    ], []);

    // ==================== TABLE COLUMNS (Tab 1) ====================
    const columns = useMemo<ColumnDef<PriceLevel>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
            meta: { sticky: 'left' }
        },
        {
            accessorKey: 'item_code',
            header: 'รหัสสินค้า',
            size: 130,
            meta: { sticky: 'left' },
            cell: ({ getValue }) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {getValue() as string || '-'}
                </span>
            ),
        },
        { 
            accessorKey: 'item_name', 
            header: 'ชื่อสินค้า', 
            size: 220,
            meta: { sticky: 'left' }
        },
        { 
            accessorKey: 'uom_name', 
            header: 'หน่วยนับ', 
            size: 90,
            meta: { sticky: 'left' }
        },
        {
            accessorKey: 'item_from_qty',
            header: 'จำนวนเริ่มต้น',
            size: 110,
            meta: { sticky: 'left' },
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(),
        },
        {
            accessorKey: 'item_to_qty',
            header: 'ถึงจำนวน',
            size: 100,
            meta: { sticky: 'left' },
            cell: ({ getValue }) => Number(getValue() || 0).toLocaleString(),
        },
        // Price Levels 1-10
        ...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => ({
            accessorKey: `item_price${num}`,
            header: levelNameMap.get(num) ? `ระดับที่ ${num} (${levelNameMap.get(num)})` : `ระดับที่ ${num}`,
            size: 160,
            cell: ({ getValue }: { getValue: () => unknown }) => Number(getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        }))),
        {
            id: 'actions',
            header: 'จัดการ',
            size: 80,
            meta: { 
                sticky: 'right',
                thClassName: 'text-center'
            },
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row.original.multi_price_item_id || row.original.id || row.original.item_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(row.original.multi_price_item_id || row.original.id || row.original.item_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                        title="ลบ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete, levelNameMap]);

    // ==================== TABLE COLUMNS (Tab 2) ====================
    const nameColumns = useMemo<ColumnDef<PriceLevelName>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (namePage - 1) * nameLimit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'code',
            header: 'รหัส',
            size: 120,
            cell: ({ getValue }) => (
                <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                    {getValue() as string || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'level_no',
            header: 'หมายเลขระดับ',
            size: 120,
            cell: ({ getValue }) => (
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                    {getValue() as number}
                </span>
            ),
        },
        {
            accessorKey: 'name',
            header: 'ชื่อระดับราคา',
            size: 300,
            cell: ({ getValue }) => (
                <span className="font-medium text-gray-800 dark:text-gray-200">
                    {getValue() as string || '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 80,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nameHandleEdit(row.original.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="แก้ไข"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>
            ),
        },
    ], [namePage, nameLimit, nameHandleEdit]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <DollarSign className="text-blue-600 dark:text-blue-400" />
                    กำหนดราคาสินค้า (Price Level)
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    จัดการระดับราคาสินค้าตามปริมาณการสั่งซื้อ
                </p>
            </div>

            {/* ==================== TAB BAR ==================== */}
            <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('price-level')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                        activeTab === 'price-level'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/20'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    <DollarSign size={16} />
                    กำหนดราคาสินค้า

                </button>

                <button
                    onClick={() => setActiveTab('level-name')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
                        activeTab === 'level-name'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    <Tag size={16} />
                    ชื่อระดับราคา

                </button>
            </div>

            {/* ==================== TAB 1: PRICE LEVEL ==================== */}
            {activeTab === 'price-level' && (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
                    {/* Filter */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <FilterFormBuilder
                            config={filterConfig}
                            filters={filters}
                            onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                            onSearch={() => handlePageChange(1)}
                            onReset={resetFilters}
                            onCreate={handleCreateNew}
                            createLabel="กำหนดราคาสินค้า"
                            accentColor="blue"
                        />
                    </div>

                    {/* Table */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-gray-700 dark:text-gray-300 font-medium px-1">
                            รายการทั้งหมด ({filteredData.length})
                        </h2>
                        <SmartTable
                            data={paginatedData}
                            columns={columns}
                            isLoading={isLoading}
                            pagination={{
                                pageIndex: filters.page,
                                pageSize: filters.limit,
                                totalCount: filteredData.length,
                                onPageChange: handlePageChange,
                                onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
                            }}
                            rowIdField="multi_price_item_id"
                            stickyColumns={true}
                            stickyBorders={false}
                            className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                        />
                    </div>
                </div>
            )}

            {/* ==================== TAB 2: LEVEL NAME ==================== */}
            {activeTab === 'level-name' && (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
                    {/* Filter + Action */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ค้นหา
                                </label>
                                <input
                                    type="text"
                                    value={nameSearch}
                                    onChange={e => { setNameSearch(e.target.value); nameHandlePageChange(1); }}
                                    placeholder="ค้นหารหัสหรือชื่อระดับราคา..."
                                    className="w-full h-[42px] px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={nameResetFilters}
                                    className="h-[42px] px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
                                >
                                    ล้างค่า
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-gray-700 dark:text-gray-300 font-medium px-1">
                            รายการทั้งหมด ({nameFilteredData.length})
                        </h2>
                        <SmartTable
                            data={namePaginatedData}
                            columns={nameColumns}
                            isLoading={nameLoading}
                            pagination={{
                                pageIndex: namePage,
                                pageSize: nameLimit,
                                totalCount: nameFilteredData.length,
                                onPageChange: nameHandlePageChange,
                                onPageSizeChange: (size) => { setNameLimit(size); nameHandlePageChange(1); },
                            }}
                            rowIdField="id"
                            className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                        />
                    </div>
                </div>
            )}

            {/* ==================== MODALS ==================== */}
            <PriceLevelFormModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={() => { handleModalClose(); fetchData(); }}
            />

            <PriceLevelNameFormModal
                isOpen={nameModalOpen}
                onClose={nameHandleModalClose}
                editId={nameEditingId}
                onSuccess={() => { nameHandleModalClose(); nameFetchData(); fetchData(); }}
            />
        </div>
    );
}
