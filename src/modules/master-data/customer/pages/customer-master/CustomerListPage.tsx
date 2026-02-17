/**
 * @file CustomerListPage.tsx
 * @description หน้ารายการข้อมูลลูกค้า (Customer Master)
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Users, Plus, Search, Edit2, Trash2, MoreHorizontal, X } from 'lucide-react';
import { 
    PageListLayout, 
    SmartTable, 
    FilterField,
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@ui';
import { useTableFilters, useDebounce, useConfirmation } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import { CustomerService } from '@customer/services/customer.service';
import { CustomerStatusBadge } from '@customer/pages/customer-master/components/CustomerStatusBadge';
import { CustomerFormModal } from '@customer/pages/customer-master/CustomerFormModal';
import type { CustomerMaster, CustomerStatus } from '@customer/types/customer-types';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'สถานะทั้งหมด' },
  { value: 'ACTIVE', label: 'ใช้งาน' },
  { value: 'INACTIVE', label: 'ไม่ใช้งาน' },
  { value: 'SUSPENDED', label: 'ระงับชั่วคราว' },
];

export default function CustomerListPage() {
  const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<CustomerStatus>({
    defaultStatus: 'ALL',
    customParamKeys: {
      search: 'customer_code',
      search2: 'customer_name_th',
      status: 'status'
    }
  });

  const { confirm } = useConfirmation();
  const debouncedFilters = useDebounce(filters, 500);

  // Data Fetching - Properly typed without 'as unknown'
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', debouncedFilters],
    queryFn: () => CustomerService.getList(debouncedFilters),
    placeholderData: keepPreviousData,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = useCallback((id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, code: string) => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบข้อมูล',
      description: `คุณต้องการลบข้อมูลลูกค้า ${code} ใช่หรือไม่?`,
      confirmText: 'ลบข้อมูล',
      variant: 'danger',
    });

    if (isConfirmed) {
      await CustomerService.delete(id);
      refetch();
    }
  }, [confirm, refetch]);

  // Columns
  const columnHelper = createColumnHelper<CustomerMaster>();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'index',
      header: () => <div className="text-center w-full">ลำดับ</div>,
      cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
      size: 60,
    }),
    columnHelper.accessor('customer_code', {
      header: 'รหัสลูกค้า',
      cell: (info) => <span className="font-bold text-blue-600 dark:text-blue-400">{info.getValue()}</span>,
      size: 150,
    }),
    columnHelper.accessor('customer_name_th', {
      header: 'ชื่อลูกค้า',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>
            <span className="text-xs text-gray-500">{row.customer_name_en}</span>
          </div>
        );
      },
      size: 300,
    }),
    columnHelper.accessor('tax_id', {
      header: 'เลขที่ผู้เสียภาษี',
      cell: (info) => <span className="text-gray-600 dark:text-gray-400">{info.getValue() || '-'}</span>,
      size: 150,
    }),
    columnHelper.accessor('credit_limit', {
      header: () => <div className="text-right w-full">วงเงิน (บาท)</div>,
      cell: (info) => <div className="text-right font-medium">{info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>,
      size: 120,
    }),
    columnHelper.accessor('credit_days', {
      header: () => <div className="text-right w-full">เครดิต (วัน)</div>,
      cell: (info) => <div className="text-right">{info.getValue()} วัน</div>,
      size: 100,
    }),
    columnHelper.accessor('payment_method', {
      header: 'วิธีชำระ',
      size: 120,
    }),
    columnHelper.accessor('status', {
      header: () => <div className="text-center w-full">สถานะ</div>,
      cell: (info) => (
        <div className="flex justify-center">
          <CustomerStatusBadge status={info.getValue()} />
        </div>
      ),
      size: 120,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center w-full">จัดการ</div>,
      size: 80,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full outline-none">
              <MoreHorizontal size={18} className="text-gray-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>พิกัดจัดการ</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(row.original.customer_id)}>
                <Edit2 className="mr-2 h-4 w-4" /> แก้ไขข้อมูล
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(row.original.customer_id, row.original.customer_code)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> ลบข้อมูล
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
  ], [filters.page, filters.limit, handleEdit, handleDelete, columnHelper]);

  return (
    <PageListLayout
      title="ข้อมูลลูกค้า"
      subtitle="Customer Master Data"
      icon={Users}
      accentColor="indigo"
      totalCount={data?.total}
      totalCountLoading={isLoading}
      searchForm={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <FilterField
            label="รหัสลูกค้า"
            value={filters.search}
            onChange={(val: string) => setFilters({ search: val })}
            placeholder="รหัสลูกค้า..."
          />
          <FilterField
            label="ชื่อลูกค้า"
            value={filters.search2}
            onChange={(val: string) => setFilters({ search2: val })}
            placeholder="ชื่อลูกค้า..."
          />
          <FilterField
            label="สถานะ"
            type="select"
            value={filters.status}
            onChange={(val: string) => setFilters({ status: val as CustomerStatus })}
            options={STATUS_OPTIONS}
          />
          <div className="lg:col-span-1 xl:col-span-2 flex justify-end gap-2">
            <button 
              onClick={resetFilters} 
              className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <X size={16} />
              ล้างค่า
            </button>
            <button onClick={() => refetch()} className="h-10 px-6 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700">
              <Search size={18} /> ค้นหา
            </button>
            <button onClick={handleCreate} className="h-10 px-6 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700">
              <Plus size={18} /> เพิ่มลูกค้า
            </button>
          </div>
        </div>
      }
    >
      <SmartTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
            pageIndex: filters.page,
            pageSize: filters.limit,
            totalCount: data?.total ?? 0,
            onPageChange: handlePageChange,
            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
        }}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        rowIdField="customer_id"
        className="flex-1"
      />

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedId(null);
        }}
        id={selectedId || undefined}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedId(null);
        }}
      />
    </PageListLayout>
  );
}
