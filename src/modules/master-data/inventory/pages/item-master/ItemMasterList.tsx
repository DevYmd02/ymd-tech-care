/**
 * @file ItemMasterList.tsx
 * @description รายการสินค้า (Item Master)
 * @purpose แสดงรายการสินค้า ใช้ SmartTable โดยไม่มี PageListLayout (Header แยกจัดการโดย Dashboard)
 */
import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Edit2, Trash2
} from 'lucide-react';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { SmartTable } from '@ui/SmartTable';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

// Columns Definition
const columnHelper = createColumnHelper<ItemListItem>();

export default function ItemMasterList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();
    
    // Pagination state
    const [pageIndex, setPageIndex] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // REFACTORED: Use React Query for data fetching (Deduplication & Caching)
    const { data: response, isLoading } = useQuery({
        queryKey: ['items'],
        queryFn: ItemMasterService.getAll,
        staleTime: 1000 * 60 * 5, // 5 minutes stale time
        refetchOnWindowFocus: false, // Prevent spamming requests when switching tabs
    });
    
    const items = response?.items || [];

    const handleEdit = useCallback((id: string) => {
        navigate(`/master-data/item?id=${id}`);
    }, [navigate]);

    const handleDelete = useCallback(async (id: string, code: string) => {
        const isConfirmed = await confirm({
            title: 'คุณต้องการลบสินค้า?',
            description: `ต้องการลบรหัสสินค้า ${code} ใช่หรือไม่?`,
            confirmText: 'ลบข้อมูล',
            cancelText: 'ยกเลิก',
            variant: 'danger'
        });

        if (isConfirmed) {
            const success = await ItemMasterService.delete(id);
            if (success) {
                await confirm({
                    title: 'ลบข้อมูลเรียบร้อยแล้ว!',
                    description: 'ระบบได้ทำการลบข้อมูลสินค้าเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                queryClient.invalidateQueries({ queryKey: ['items'] });
            } else {
                await confirm({
                    title: 'เกิดข้อผิดพลาด',
                    description: 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                    confirmText: 'ตกลง',
                    variant: 'danger',
                    hideCancel: true
                });
            }
        }
    }, [queryClient, confirm]);
    
    const columns = useMemo(() => [
        columnHelper.accessor('item_code', {
            header: 'รหัสสินค้า',
            cell: (info) => (
                <span className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => handleEdit(info.row.original.item_id)}>
                    {info.getValue()}
                </span>
            ),
            size: 120,
        }),
        columnHelper.accessor('item_name', {
            header: 'ชื่อสินค้า (ไทย)',
            cell: info => <span className="text-gray-900 dark:text-gray-100">{info.getValue()}</span>,
            size: 200,
        }),
        columnHelper.accessor('item_name_en', {
            header: 'ชื่อสินค้า (Eng)',
            cell: info => <span className="text-gray-500 dark:text-gray-400">{info.getValue() || '-'}</span>,
            size: 200,
        }),
        columnHelper.accessor('category_name', {
            header: 'หมวดหมู่',
            cell: info => <span className="text-gray-700 dark:text-gray-300">{info.getValue()}</span>,
            size: 150,
        }),
        columnHelper.accessor('item_type_code', {
            header: 'ประเภท',
            cell: (info) => (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 100,
        }),
        columnHelper.accessor('unit_name', {
            header: 'หน่วยนับ',
            cell: info => <span className="text-gray-600 dark:text-gray-300">{info.getValue()}</span>,
            size: 100,
        }),
        columnHelper.accessor('is_active', {
            header: 'สถานะ',
            cell: (info) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    info.getValue() 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                    {info.getValue() ? 'Active' : 'Inactive'}
                </span>
            ),
            size: 100,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => (
                <div className="flex justify-center gap-2">
                    <button 
                        onClick={() => handleEdit(row.original.item_id)}
                        className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                        title="แก้ไข"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDelete(row.original.item_id, row.original.item_code)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                        title="ลบ"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
            size: 100,
        }),
    ], [handleEdit, handleDelete]);

    return (
        <div className="h-full flex flex-col">
            <SmartTable
                data={items}
                columns={columns as ColumnDef<ItemListItem>[]}
                isLoading={isLoading}
                rowIdField="item_id"
                className="flex-1"
                pagination={{
                     pageIndex,
                     pageSize,
                     totalCount: items.length,
                     onPageChange: setPageIndex,
                     onPageSizeChange: setPageSize
                }}
            />
        </div>
    );
}
