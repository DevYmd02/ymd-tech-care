
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Database } from 'lucide-react';
import { TaxService } from '@/modules/master-data/tax/services/tax.service';
import { TaxCodeFormModal } from '@/modules/master-data/tax/pages/code/TaxCodeFormModal';
import { FilterFormBuilder, type FilterFieldConfig } from '@ui';
import { SmartTable } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { ActiveStatusBadge } from '@ui';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import type { ColumnDef } from '@tanstack/react-table';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'ACTIVE', label: 'ใช้งาน' },
    { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
];

const TAX_TYPE_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'SALES', label: 'ภาษีขาย (VAT Output)' },
    { value: 'PURCHASE', label: 'ภาษีซื้อ (VAT Input)' },
    { value: 'EXEMPT', label: 'ยกเว้นภาษี (Exempt)' },
    { value: 'NONE', label: 'ไม่คิดอะไร' },
];

export default function TaxCodeList() {
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();
    
    // ==================== STATE & FILTERS ====================
    // Mapping:
    // search -> Tax Code
    // search2 -> Tax Name
    // search3 -> Tax Type
    // status -> Status
    const { 
        filters, 
        setFilters, 
        handlePageChange, 
        resetFilters,
        handleSortChange,
        sortConfig 
    } = useTableFilters({
        defaultLimit: 10,
        customParamKeys: {
            search: 'tax_code',
            search2: 'tax_name',
            search3: 'tax_type',
            status: 'status'
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<Extract<keyof typeof filters, string>>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'รหัสภาษี', 
            type: 'text', 
            placeholder: 'ค้นหารหัสภาษี',
            colSpan: 1
        },
        { 
            name: 'search2', 
            label: 'ชื่อภาษี', 
            type: 'text', 
            placeholder: 'ค้นหาชื่อภาษี',
            colSpan: 1
        },
        { 
            name: 'search3', 
            label: 'ประเภทภาษี', 
            type: 'select', 
            options: TAX_TYPE_OPTIONS,
            colSpan: 1
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: STATUS_OPTIONS,
            colSpan: 1
        },
    ], []);

    // ==================== DATA FETCHING ====================
    const { data: response, isLoading } = useQuery({
        queryKey: ['tax-codes', filters],
        queryFn: async () => {
            const result = await TaxService.getTaxCodes();
            let items = result || [];
            
            // Client-side filtering (mock data)
            if (filters.search) {
                const term = filters.search.toLowerCase();
                items = items.filter(u => u.tax_code.toLowerCase().includes(term));
            }
            if (filters.search2) {
                const term = filters.search2.toLowerCase();
                items = items.filter(u => u.tax_name.toLowerCase().includes(term));
            }
            if (filters.search3 && filters.search3 !== 'ALL') {
                items = items.filter(u => u.tax_type === filters.search3);
            }
            if (filters.status && filters.status !== 'ALL') {
                items = items.filter(u => filters.status === 'ACTIVE' ? u.is_active : !u.is_active);
            }
            
            // Sorting (mock)
            if (sortConfig) {
                items.sort((a, b) => {
                    const fieldValA = a[sortConfig.key as keyof TaxCode];
                    const fieldValB = b[sortConfig.key as keyof TaxCode];
                    
                    const valA = fieldValA !== undefined && fieldValA !== null ? String(fieldValA) : '';
                    const valB = fieldValB !== undefined && fieldValB !== null ? String(fieldValB) : '';
                    
                    return sortConfig.direction === 'asc' 
                        ? valA.localeCompare(valB, 'th') 
                        : valB.localeCompare(valA, 'th');
                });
            }

            const total = items.length;
            const start = (filters.page - 1) * filters.limit;
            const paginatedItems = items.slice(start, start + filters.limit);

            return { items: paginatedItems, total };
        },
    });

    // ==================== HANDLERS ====================
    const handleCreate = useCallback(() => {
        setSelectedTaxId(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedTaxId(id);
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'คุณต้องการลบรหัสภาษีนี้หรือไม่?',
            description: 'การลบข้อมูลจะไม่สามารถกู้คืนได้',
            confirmText: 'ลบข้อมูล',
            cancelText: 'ยกเลิก',
            variant: 'danger'
        });

        if (isConfirmed) {
            await TaxService.deleteTaxCode(id);
            queryClient.invalidateQueries({ queryKey: ['tax-codes'] });
        }
    }, [queryClient, confirm]);

    // ==================== TABLE COLUMNS ====================
    const columns = useMemo<ColumnDef<TaxCode>[]>(() => [
        {
            id: 'sequence',
            header: '#',
            accessorFn: (_, index) => (filters.page - 1) * filters.limit + index + 1,
            size: 50,
        },
        {
            accessorKey: 'tax_code',
            header: 'รหัสภาษี',
            cell: ({ getValue, row }) => (
                <span 
                    className="font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => handleEdit(row.original.tax_id)}
                >
                    {getValue() as string}
                </span>
            ),
            size: 150,
        },
        {
            accessorKey: 'tax_name',
            header: 'ชื่อภาษี',
            size: 200,
        },
        {
            accessorKey: 'tax_type',
            header: 'ประเภทภาษี',
            cell: ({ getValue }) => {
                const type = getValue() as string;
                let label = type;
                let colorClass = 'bg-gray-100 text-gray-800';

                switch(type) {
                    case 'SALES': 
                        label = 'ภาษีขาย'; 
                        colorClass = 'bg-green-100 text-green-800';
                        break;
                    case 'PURCHASE': 
                        label = 'ภาษีซื้อ'; 
                        colorClass = 'bg-blue-100 text-blue-800';
                        break;
                    case 'EXEMPT': 
                        label = 'ยกเว้น'; 
                        colorClass = 'bg-yellow-100 text-yellow-800';
                        break;
                    case 'NONE':
                        label = 'ไม่คิดอะไร';
                        break;
                }

                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
                        {label}
                    </span>
                );
            },
            size: 150,
        },
        {
            accessorKey: 'tax_rate',
            header: () => <div className="text-right w-full">อัตราภาษี (%)</div>,
            cell: ({ getValue }) => <div className="text-right">{getValue() as number} %</div>,
            size: 120,
        },
        {
            accessorKey: 'is_active',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: ({ getValue }) => (
                <div className="flex justify-center">
                    <ActiveStatusBadge isActive={getValue() as boolean} />
                </div>
            ),
            size: 100,
        },
        {
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.tax_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="แก้ไข"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.tax_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="ลบ"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
            size: 100,
        },
    ], [filters.page, filters.limit, handleEdit, handleDelete]);

    return (
        <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Database className="text-blue-600" />
                        กำหนดรหัสภาษี (Tax Code Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        จัดการรหัสภาษีและอัตราภาษี
                    </p>
                </div>
            </div>

            {/* Filter Section */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name: string, value: string) => {
                        setFilters({ [name]: value } as Partial<typeof filters>);
                    }}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreate}
                    createLabel="สร้างรหัสภาษีใหม่"
                    accentColor="blue"
                    columns={{ sm: 1, md: 4, lg: 4, xl: 4 }}
                    actionColSpan={{ sm: 'full', md: 4, lg: 4, xl: 4 }}
                    actionAlign="end"
                />
            </div>

            <h2 className="text-gray-700 dark:text-gray-300 font-medium">
                พบข้อมูล {response?.total || 0} รายการ
            </h2>

            <SmartTable
                data={response?.items || []}
                columns={columns}
                isLoading={isLoading}
                pagination={{
                    pageIndex: filters.page,
                    pageSize: filters.limit,
                    totalCount: response?.total || 0,
                    onPageChange: handlePageChange,
                    onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
                }}
                sortConfig={sortConfig}
                onSortChange={handleSortChange}
                rowIdField="tax_id"
                className="shadow-sm border border-gray-200 dark:border-gray-700"
            />

            <TaxCodeFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                taxId={selectedTaxId}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['tax-codes'] });
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}



