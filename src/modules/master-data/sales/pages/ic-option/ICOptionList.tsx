import { useMemo, useCallback } from 'react';
import { Settings } from 'lucide-react';
import ICOptionFormModal from './ICOptionFormModal';
import { useICOption } from './hooks/useICOption';
import type { ICOption } from './types/ic-option.types';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import type { ColumnDef } from '@tanstack/react-table';

export default function ICOptionList() {
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
        handleModalClose
    } = useICOption();

    // ==================== PRICE SOURCE MAPPING ====================
    const priceSourceMap = useMemo(() => {
        return new Map<number, string>([
            [0, 'ไม่มีการกำหนด'],
            [1, 'ราคาสินค้า Price List'],
            [2, 'ราคาสินค้า Price Level'],
            [3, 'ราคา Promotion'],
            [4, 'ราคาตามระยะเวลาเครดิต'],
            [5, 'ราคาขายหลังสุด'],
            [6, 'ราคาขายหลังสุดตามลูกค้า'],
        ]);
    }, []);

    const renderPriceSource = useCallback((val: string | number | null | undefined) => {
        const id = Number(val || 0);
        return (
            <span className={`px-2 py-0.5 text-xs rounded border ${id === 0 ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'}`}>
                {priceSourceMap.get(id) || `ระบุ (${id})`}
            </span>
        );
    }, [priceSourceMap]);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters & string>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'ค้นหา', 
            type: 'text', 
            placeholder: 'ค้นหาด้วยรหัสสาขา/Aging...' 
        },
    ], []);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<ICOption>[]>(() => [
        {
            id: 'sequence',
            header: 'ลำดับ',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 60,
        },
        {
            accessorKey: 'branch_code',
            header: 'รหัสสาขา',
            size: 150,
            cell: ({ row }) => {
                const code = row.original.branch_code;
                const name = row.original.branch_name;
                const id = row.original.branch_id;
                
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {code ? `${code} (${name || '-'})` : `ID: ${id}`}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'aging_expire',
            header: 'Aging สินค้ามีอายุ',
            size: 150,
        },
        {
            accessorKey: 'set_price1',
            header: 'ที่มาของราคา 1',
            size: 150,
            cell: ({ getValue }) => renderPriceSource(getValue() as number),
        },
        {
            accessorKey: 'set_price2',
            header: 'ที่มาของราคา 2',
            size: 150,
            cell: ({ getValue }) => renderPriceSource(getValue() as number),
        },
        {
            accessorKey: 'check_deficit',
            header: 'ตรวจสอบติดลบ',
            size: 120,
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getValue() === 'Y' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {getValue() === 'Y' ? 'เปิดใช้งาน' : 'ปิด'}
                </span>
            ),
        },
        {
            accessorKey: 'check_standcost',
            header: 'เช็คราคามาตรฐาน',
            size: 130,
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getValue() === 'Y' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {getValue() === 'Y' ? 'เปิดใช้งาน' : 'ปิด'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'จัดการ',
            size: 80,
            cell: ({ row }) => {
                const id = row.original.ic_option_id;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => id && handleEdit(id)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800"
                            title="ตั้งค่า"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                );
            },
        },
    ], [filters.page, filters.limit, handleEdit, renderPriceSource]);

    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Settings className="text-indigo-600" />
                        ตั้งค่าโมดูลสินค้าคงคลัง (IC Option Settings)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการตั้งค่าเงื่อนไขการทำงานและราคาขายเริ่มต้นแยกตามแต่ละสาขา
                    </p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มการตั้งค่าราคา"
                    accentColor="indigo"
                />
            </div>

            {/* Data Table */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                        รายการทั้งหมด ({filteredData.length})
                    </h2>
                </div>

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
                    rowIdField="ic_option_id"
                    className="shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl"
                />
            </div>

            {/* Modal */}
            <ICOptionFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
                onSuccess={() => {
                    handleModalClose();
                    fetchData();
                }}
            />
        </div>
    );
}
