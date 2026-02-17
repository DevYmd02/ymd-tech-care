/**
 * @file BillingGroupListPage.tsx
 */

import { useMemo, useCallback, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CreditCard, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField, ActiveStatusBadge } from '@ui';
import { useTableFilters, useDebounce, useConfirmation } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import { CustomerService } from '@customer/services/customer.service';
import type { CustomerBillingGroup } from '@customer/types/customer-types';

import { BillingGroupFormModal } from './BillingGroupFormModal';

export default function BillingGroupList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters({
    customParamKeys: { search: 'billing_group_code', search2: 'billing_group_name_th' }
  });

  const { confirm } = useConfirmation();
  const debouncedFilters = useDebounce(filters, 500);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer-billing-groups', debouncedFilters],
    queryFn: () => CustomerService.getBillingGroups(debouncedFilters),
    placeholderData: keepPreviousData,
  });

  const handleCreate = () => {
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleDelete = useCallback(async (_: string, code: string) => {
    const isConfirmed = await confirm({
      title: 'ยืนยันการลบข้อมูล',
      description: `คุณต้องการลบกลุ่มวางบิล ${code} ใช่หรือไม่?`,
      confirmText: 'ลบข้อมูล',
      variant: 'danger',
    });

    if (isConfirmed) {
      console.log('Delete', code);
    }
  }, [confirm]);

  const columnHelper = createColumnHelper<CustomerBillingGroup>();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'index',
      header: () => <div className="text-center w-full">ลำดับ</div>,
      cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
      size: 60,
    }),
    columnHelper.accessor('billing_group_code', {
      header: 'รหัส',
      cell: (info) => <span className="font-bold text-blue-600 dark:text-blue-400">{info.getValue()}</span>,
      size: 150,
    }),
    columnHelper.accessor('billing_group_name_th', { header: 'ชื่อกลุ่มวางบิล (TH)', size: 250 }),
    columnHelper.accessor('billing_group_name_en', {
      header: 'ชื่อกลุ่มวางบิล (EN)',
      cell: (info) => <span className="text-gray-500">{info.getValue() || '-'}</span>,
      size: 250,
    }),
    columnHelper.accessor('is_active', {
      header: () => <div className="text-center w-full">สถานะ</div>,
      cell: (info) => <div className="flex justify-center"><ActiveStatusBadge isActive={info.getValue()} /></div>,
      size: 100,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center w-full">จัดการ</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <button onClick={() => handleEdit(row.original.billing_group_id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18} /></button>
          <button onClick={() => handleDelete(row.original.billing_group_id, row.original.billing_group_code)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
        </div>
      ),
    }),
  ], [filters.page, filters.limit, columnHelper, handleDelete]);

  return (
    <PageListLayout
      title="กำหนดกลุ่มวางบิล"
      subtitle="Customer Billing Group Setup"
      icon={CreditCard}
      accentColor="blue"
      totalCount={data?.total}
      totalCountLoading={isLoading}
      searchForm={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <FilterField label="รหัส" value={filters.search} onChange={(val: string) => setFilters({ search: val })} placeholder="รหัส..." />
          <FilterField label="ชื่อกลุ่มวางบิล" value={filters.search2} onChange={(val: string) => setFilters({ search2: val })} placeholder="ชื่อ..." />
          <div className="lg:col-span-2 xl:col-span-3 flex justify-end gap-2">
            <button 
              onClick={resetFilters} 
              className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <X size={16} />
              ล้างค่า
            </button>
            <button onClick={() => refetch()} className="h-10 px-6 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
              <Search size={18} /> ค้นหา
            </button>
            <button onClick={handleCreate} className="h-10 px-6 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700">
              <Plus size={18} /> เพิ่มใหม่
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
        rowIdField="billing_group_id"
        className="flex-1"
      />
      <BillingGroupFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        id={selectedId ?? undefined}
        onSuccess={() => refetch()}
      />
    </PageListLayout>
  );
}
