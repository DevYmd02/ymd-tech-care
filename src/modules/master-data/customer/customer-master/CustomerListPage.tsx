/**
 * @file CustomerListPage.tsx
 * @description หน้ารายการข้อมูลลูกค้า (Customer Master)
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Users, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { 
    PageListLayout, 
    SmartTable, 
    FilterField,
} from '@ui';
import { useTableFilters, useDebounce, useConfirmation } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { CustomerStatusBadge } from '@customer/customer-master/components/CustomerStatusBadge';
import { CustomerFormModal } from '@customer/customer-master/CustomerFormModal';
import type { CustomerMaster, CustomerStatus } from '@customer/customer-master/types/customer-types';

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
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleCreate = () => {
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = useCallback((id: number) => {
    setSelectedId(id);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number, code: string) => {
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
      size: 120,
    }),
    columnHelper.accessor('customer_name_th', {
      header: 'ชื่อลูกค้า',
      cell: (info) => {
        const row = info.row.original;
        const nameTh = row.customer_name || row.customer_name_th;
        const nameEn = row.customer_nameeng || row.customer_name_en;
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate" title={nameTh}>
              {nameTh}
            </span>
            <span className="text-[10px] text-gray-500 truncate" title={nameEn}>
              {nameEn}
            </span>
          </div>
        );
      },
      size: 250,
    }),
    columnHelper.accessor('tax_id', {
      header: 'เลขผู้เสียภาษี',
      cell: (info) => <span className="text-gray-600 dark:text-gray-400">{info.getValue() || '-'}</span>,
      size: 130,
    }),
    columnHelper.accessor('credit_limit', {
      header: () => <div className="text-right w-full">วงเงิน (บาท)</div>,
      cell: (info) => <div className="text-right font-medium text-emerald-600 dark:text-emerald-400">{(info.getValue() || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>,
      size: 120,
    }),
    columnHelper.accessor('credit_days', {
      header: () => <div className="text-right w-full">เครดิต (วัน)</div>,
      cell: (info) => {
        const row = info.row.original;
        const val = row.credit_term_days ?? row.credit_days;
        return <div className="text-right font-medium">{val !== undefined && val !== null ? `${val} วัน` : '-'}</div>;
      },
      size: 100,
    }),
    columnHelper.accessor('payment_method', {
      header: 'วิธีชำระ',
      cell: (info) => {
        const row = info.row.original;
        return <span>{row.payment_method_default || row.payment_method || '-'}</span>;
      },
      size: 110,
    }),
    columnHelper.accessor('status', {
      header: () => <div className="text-center w-full">สถานะ</div>,
      cell: (info) => (
        <div className="flex justify-center">
          <CustomerStatusBadge 
            status={info.getValue()} 
            isActive={info.row.original.is_active} 
          />
        </div>
      ),
      size: 100,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center w-full">จัดการ</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-1">
          <button 
            onClick={() => handleEdit(row.original.customer_id)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="แก้ไข"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row.original.customer_id, row.original.customer_code)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="ลบ"
          >
            <Trash2 size={16} />
          </button>
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
          <div className="md:col-span-full lg:col-span-full xl:col-span-2 flex flex-wrap justify-end gap-2">
            <button 
              onClick={resetFilters} 
              className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
            >
              <X size={16} />
              ล้างค่า
            </button>
            <button onClick={() => refetch()} className="h-10 px-6 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 whitespace-nowrap">
              <Search size={18} /> ค้นหา
            </button>
            <button onClick={handleCreate} className="h-10 px-6 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 whitespace-nowrap">
              <Plus size={18} /> เพิ่มลูกค้าใหม่
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
          refetch(); // รีเฟรชข้อมูลในตาราง
        }}
      />
    </PageListLayout>
  );
}
