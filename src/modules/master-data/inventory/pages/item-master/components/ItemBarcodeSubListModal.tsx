import { useState } from 'react';
import { ScanBarcode, Plus, Edit2, Trash2 } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ItemBarcodeService } from '@/modules/master-data/inventory/services/item-barcode.service';
import { ItemBarcodeFormModal } from '@/modules/master-data/inventory/pages/item-barcode/ItemBarcodeFormModal';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    item_id: number;
    item_code: string;
    item_name: string;
}

export function ItemBarcodeSubListModal({ isOpen, onClose, item_id, item_code, item_name }: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editBarcodeId, setEditBarcodeId] = useState<number | null>(null);
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    // Fetch barcodes for this item
    const { data: barcodeResponse, isLoading, refetch } = useQuery({
        queryKey: ['item-barcodes-sublist', item_id],
        queryFn: () => ItemBarcodeService.getAll({ item_id }),
        enabled: isOpen && !!item_id,
    });

    const barcodes = barcodeResponse?.items || [];

    const handleAddNew = () => {
        setEditBarcodeId(null);
        setIsFormOpen(true);
    };

    const handleEdit = (id: number) => {
        setEditBarcodeId(id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบ',
            description: 'คุณต้องการลบข้อมูลบาร์โค้ดนี้หรือไม่?',
            confirmText: 'ลบ',
            variant: 'danger',
        });
        if (isConfirmed) {
            await ItemBarcodeService.delete(id);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['item-barcodes'] }); // Invalidate main page too
        }
    };

    return (
        <>
            <DialogFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title={`จัดการบาร์โค้ด: ${item_code} - ${item_name}`}
                titleIcon={<ScanBarcode className="w-5 h-5 text-purple-500" />}
                width="max-w-3xl"
                isLoading={isLoading}
                footer={
                    <div className="flex justify-end w-full">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                        >
                            ปิดหน้าต่าง
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">รายการบาร์โค้ดที่ผูกกับสินค้านี้</span>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium shadow-sm transition-colors"
                        >
                            <Plus size={14} /> เพิ่มบาร์โค้ด
                        </button>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-2 font-semibold">บาร์โค้ด</th>
                                    <th className="px-4 py-2 font-semibold">หน่วยนับ</th>
                                    <th className="px-4 py-2 font-semibold text-center">หลัก</th>
                                    <th className="px-4 py-2 font-semibold text-center">ใช้งาน</th>
                                    <th className="px-4 py-2 font-semibold text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {barcodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-xs text-gray-400">
                                            ยังไม่มีรายการบาร์โค้ดจัดเก็บ
                                        </td>
                                    </tr>
                                ) : (
                                    barcodes.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                            <td className="px-4 py-2 font-medium">{item.barcode}</td>
                                            <td className="px-4 py-2">{item.uom_name || '-'}</td>
                                            <td className="px-4 py-2 text-center">
                                                {item.is_primary ? (
                                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded text-xxs font-semibold">หลัก</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`inline-block w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(item.barcode_id || item.id)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.barcode_id || item.id)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogFormLayout>

            {/* Sub-form modal */}
            {isFormOpen && (
                <ItemBarcodeFormModal 
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    editId={editBarcodeId}
                    onSuccess={refetch}
                    initialItemId={item_id}
                    initialItemCode={item_code}
                    initialItemName={item_name}
                />
            )}
        </>
    );
}
