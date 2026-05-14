import { useState } from 'react';
import { ScanBarcode, Search, Save, RotateCcw, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import { useItemBarcodeForm } from '@/modules/master-data/inventory/hooks/useItemBarcodeForm';
import { ItemBarcodeService } from '@/modules/master-data/inventory/services/item-barcode.service';
import { useQuery } from '@tanstack/react-query';
import type { ItemListItem, UOMListItem } from '@/modules/master-data/types/master-data-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    onSuccess?: () => void;
    initialItemId?: number;
    initialItemCode?: string;
    initialItemName?: string;
}

export function ItemBarcodeFormModal({ 
    isOpen, 
    onClose, 
    editId, 
    onSuccess,
    initialItemId,
    initialItemCode,
    initialItemName
}: Props) {
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

    // Fetch edit data if editId is provided
    const { data: editData, isLoading: isLoadingEdit } = useQuery({
        queryKey: ['item-barcode-detail', editId],
        queryFn: () => ItemBarcodeService.getById(editId!),
        enabled: isOpen && !!editId,
    });

    const {
        register,
        formData,
        errors,
        units,
        isSaving,
        handleSave,
        setValue,
        clearForm,
    } = useItemBarcodeForm(
        editId || null, 
        editData, 
        () => {
            if (onSuccess) onSuccess();
            onClose();
        },
        initialItemId ? { item_id: initialItemId, item_code: initialItemCode, item_name: initialItemName } : undefined
    );

    const handleProductSelect = (product: ItemListItem) => {
        setValue('item_id', product.item_id);
        setValue('item_code', product.item_code);
        setValue('item_name', product.item_name);
        setIsItemSearchOpen(false);
    };

    const Footer = (
        <div className="flex justify-end gap-3">
            <button 
                type="button"
                onClick={clearForm} 
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
                <RotateCcw size={18} />
                ล้างฟอร์ม
            </button>
            <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button 
                type="button"
                onClick={handleSave} 
                disabled={isSaving} 
                className={`${styles.btnPrimary} flex items-center gap-2`}
            >
                <Save size={18} />
                บันทึก {isSaving && '...'}
            </button>
        </div>
    );

    return (
        <>
            <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="กำหนดรหัสบาร์โค้ดสินค้า"
            titleIcon={<ScanBarcode size={24} />}
            footer={Footer}
            isLoading={isLoadingEdit}
        >
            <div className="space-y-6">
                {/* Preview Header */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>รหัสสินค้า (แสดง)</label>
                            <input 
                                type="text" 
                                value={formData.item_code || '-'} 
                                readOnly 
                                className={`${styles.input} bg-gray-100 dark:bg-gray-600 cursor-not-allowed`} 
                            />
                        </div>
                        <div>
                            <label className={styles.label}>ชื่อสินค้า (แสดง)</label>
                            <input 
                                type="text" 
                                value={formData.item_name || 'ยังไม่ได้เลือกสินค้า'} 
                                readOnly 
                                className={`${styles.input} bg-gray-100 dark:bg-gray-600 cursor-not-allowed`} 
                            />
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>ค้นหาสินค้า <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={formData.item_code || ''}
                                        className={`${styles.input} ${errors.item_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="กดปุ่มเพื่อค้นหาสินค้า"
                                        readOnly
                                    />
                                    {errors.item_id && (
                                        <span className="text-red-500 text-xs mt-1 block">{errors.item_id.message}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsItemSearchOpen(true)}
                                    className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center h-10"
                                    type="button"
                                    title="ค้นหาสินค้า"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className={styles.label}>รหัสบาร์โค้ด <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                {...register('barcode')}
                                className={`${styles.input} ${errors.barcode ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="ระบุบาร์โค้ด"
                            />
                            {errors.barcode && (
                                <span className="text-red-500 text-xs mt-1 block">{errors.barcode.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>บาร์โค้ดผูกหน่วย <span className="text-red-500">*</span></label>
                            <select 
                                {...register('uom_id')}
                                className={`${styles.inputSelect} ${errors.uom_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {units.map((u: UOMListItem) => (
                                    <option key={u.uom_id} value={String(u.uom_id)}>{u.uom_name} ({u.uom_code})</option>
                                ))}
                            </select>
                            {errors.uom_id && (
                                <span className="text-red-500 text-xs mt-1 block">{errors.uom_id.message}</span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('is_primary')}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">บาร์โค้ดหลัก</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('is_active')}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">สถานะใช้งาน</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </DialogFormLayout>

            <ProductSearchModal 
                isOpen={isItemSearchOpen}
                onClose={() => setIsItemSearchOpen(false)}
                onSelect={handleProductSelect}
            />
        </>
    );
}

