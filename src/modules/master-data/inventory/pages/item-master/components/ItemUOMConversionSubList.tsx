import { useState } from 'react';
import { RefreshCcw, Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UOMConversionService } from '@/modules/master-data/inventory/services/uom-conversion.service';
import { UOMConversionFormModal } from '@/modules/master-data/inventory/pages/uom-conversion/UOMConversionFormModal';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

interface Props {
    item_id: number;
    item_code: string;
    item_name: string;
}

export function ItemUOMConversionSubList({ item_id, item_code, item_name }: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editConversionId, setEditConversionId] = useState<number | null>(null);
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    // Fetch conversions for this item
    const { data: conversionResponse, isLoading, refetch } = useQuery({
        queryKey: ['item-uom-conversions-sublist', item_id],
        queryFn: () => UOMConversionService.getByItemId(item_id),
        enabled: !!item_id,
    });

    const conversions = conversionResponse?.items || [];

    const handleAddNew = () => {
        setEditConversionId(null);
        setIsFormOpen(true);
    };

    const handleEdit = (id: number) => {
        setEditConversionId(id);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการลบ',
            description: 'คุณต้องการลบข้อมูลการแปลงหน่วยนี้หรือไม่?',
            confirmText: 'ลบ',
            variant: 'danger',
        });
        if (isConfirmed) {
            await UOMConversionService.delete(id);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['uom-conversions'] }); // Invalidate main list too
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all mt-6">
            {/* Header Section */}
            <div className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <RefreshCcw size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">จัดการแปลงหน่วยสินค้า (UOM Conversion)</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">กำหนดอัตราการแปลงหน่วยนับของสินค้าเพื่อใช้ในการซื้อขายหรือสต็อก</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAddNew}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={14} /> เพิ่มการแปลงหน่วย
                </button>
            </div>

            {/* List Body */}
            <div className="p-0 overflow-x-auto">
                {isLoading ? (
                    <div className="px-4 py-10 text-center text-xs text-gray-400">
                        กำลังโหลดข้อมูลการแปลงหน่วย...
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">ลำดับ</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">หน่วยต้นทาง (From)</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">หน่วยปลายทาง (To)</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">อัตราแปลง (Factor)</th>
                                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">ใช้จัดซื้อ</th>
                                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">ใช้งาน</th>
                                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {conversions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <RefreshCcw size={40} className="text-gray-400 animate-spin-slow" />
                                            <p className="text-sm font-medium text-gray-500">ยังไม่มีข้อมูลการแปลงหน่วยสำหรับสินค้านี้</p>
                                            <p className="text-xs text-gray-400">คลิกที่ปุ่มด้านบนเพื่อเพิ่มรายการใหม่</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                conversions.map((item, index) => (
                                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-4 py-3 text-center text-xs text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200">
                                            {item.from_unit_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                                            {item.to_unit_name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs font-mono font-medium text-gray-900 dark:text-white">
                                            {Number(item.conversion_factor || 0).toFixed(6)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                item.is_purchase_unit 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' 
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                            }`}>
                                                {item.is_purchase_unit ? 'ใช่' : 'ไม่ใช่'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block w-2 h-2 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEdit(item.conversion_id || item.id)}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400 transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(item.conversion_id || item.id)}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400 transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {conversions.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50/30 dark:bg-gray-800/30">
                                    <td colSpan={7} className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                            พบทั้งหมด {conversions.length} รายการ
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                )}
            </div>

            {/* UOM Conversion Sub-form Modal */}
            <UOMConversionFormModal 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                editId={editConversionId}
                onSuccess={refetch}
                initialItemId={item_id}
                initialItemCode={item_code}
                initialItemName={item_name}
            />
        </div>
    );
}
