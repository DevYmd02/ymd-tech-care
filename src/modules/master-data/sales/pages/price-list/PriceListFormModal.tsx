/**
 * @file PriceListFormModal.tsx
 * @description Form Modal for Price List Master Data
 */

import { useState } from 'react';
import { 
    Layers, 
    Save, 
    X, 
    Plus, 
    Trash2, 
    Search
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { usePriceListForm } from '@master-data/sales/pages/price-list/hooks/usePriceListForm';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export default function PriceListFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        fields,
        append,
        remove,
        handleItemChange,
        watch
    } = usePriceListForm(editId ?? null, onSuccess);

    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    const handleAddProduct = () => {
        setActiveRowIndex(null);
        setIsProductSearchOpen(true);
    };

    const handleSelectProduct = (product: import('@/modules/master-data/inventory/types/product-types').ItemListItem) => {
        if (activeRowIndex !== null) {
            handleItemChange(activeRowIndex, 'itemId', String(product.item_id));
            handleItemChange(activeRowIndex, 'itemCode', product.item_code);
            handleItemChange(activeRowIndex, 'itemName', product.item_name);
            handleItemChange(activeRowIndex, 'uomId', product.uom_id ? String(product.uom_id) : null);
            handleItemChange(activeRowIndex, 'uomName', product.uom_name || '');
        } else {
            append({
                itemId: String(product.item_id),
                itemCode: product.item_code,
                itemName: product.item_name,
                uomId: product.uom_id ? String(product.uom_id) : null,
                uomName: product.uom_name || '',
                unitPrice: Number(product.standard_cost) || 0,
                lineDiscount: 0,
                lineDiscountAmnt: 0,
                unitPriceNet: Number(product.standard_cost) || 0,
                remark: '',
            });
        }
        setIsProductSearchOpen(false);
    };

    // ==================== RENDERING ====================
    
    const TitleIcon = <Layers size={24} className="text-white" />;

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300 dark:border-gray-600 font-medium"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 font-medium"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
        </div>
    );

    return (
        <>
            <DialogFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title={editId ? 'แก้ไขรายการราคา (Price List)' : 'เพิ่มรายการราคาใหม่'}
                titleIcon={TitleIcon}
                footer={FormFooter}
                width="max-w-7xl"
            >
                <div className="p-6 space-y-8">
                    
                    {/* Section 1: Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                                ข้อมูลทั่วไป
                            </h3>
                            
                            <div>
                                <label className={styles.label}>เลขที่ Price List <span className="text-red-500">*</span></label>
                                <input
                                    {...register('priceListNo')}
                                    type="text"
                                    placeholder="เช่น PL-2024-001"
                                    className={`${styles.input} ${errors.priceListNo ? 'border-red-500' : ''}`}
                                />
                                {errors.priceListNo && <p className="text-red-500 text-xs mt-1">{errors.priceListNo.message}</p>}
                            </div>

                            <div>
                                <label className={styles.label}>ชื่อ Price List <span className="text-red-500">*</span></label>
                                <input
                                    {...register('priceListName')}
                                    type="text"
                                    placeholder="เช่น ราคาขายปลีก มกราคม 2024"
                                    className={`${styles.input} ${errors.priceListName ? 'border-red-500' : ''}`}
                                />
                                {errors.priceListName && <p className="text-red-500 text-xs mt-1">{errors.priceListName.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={styles.label}>วันที่เอกสาร</label>
                                    <input {...register('priceListDate')} type="date" className={styles.input} />
                                </div>
                                <div className="flex items-end pb-1">
                                    <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 w-full active:scale-95 transition-transform cursor-pointer">
                                        <input
                                            {...register('isActive')}
                                            type="checkbox"
                                            id="pl_is_active"
                                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                        />
                                        <label htmlFor="pl_is_active" className="text-sm font-semibold text-blue-700 dark:text-blue-400 cursor-pointer">ใช้งาน</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-1 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                                เงื่อนไขระยะเวลา
                            </h3>
                            
                            <div>
                                <label className={styles.label}>วันที่เริ่มต้น</label>
                                <input {...register('beginDate')} type="date" className={styles.input} />
                            </div>

                            <div>
                                <label className={styles.label}>วันที่สิ้นสุด</label>
                                <input {...register('endDate')} type="date" className={styles.input} />
                            </div>

                            <div>
                                <label className={styles.label}>สาขา <span className="text-red-500">*</span></label>
                                <select {...register('branchId')} className={styles.input}>
                                    <option value="">เลือกสาขา</option>
                                    <option value="default">สำนักงานใหญ่</option>
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-1 space-y-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                                หมายเหตุและอื่นๆ
                            </h3>
                            
                            <div>
                                <label className={styles.label}>หมายเหตุ</label>
                                <textarea
                                    {...register('remark')}
                                    rows={3}
                                    placeholder="ระบุหมายเหตุเพิ่มเติม..."
                                    className={styles.input}
                                />
                            </div>

                            <div>
                                <label className={styles.label}>รหัสลูกค้า (ถ้าเจาะจง)</label>
                                <input {...register('customerId')} type="text" className={styles.input} placeholder="ค้นหาหรือกรอกรหัสลูกค้า" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Items Table */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                    รายการสินค้าใน Price List
                                </h3>
                                <p className="text-sm text-gray-500">กำหนดราคาและส่วนลดรายสินค้า</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold transition-colors border border-blue-200"
                            >
                                <Plus size={18} />
                                เพิ่มสินค้า
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[150px]">รหัสสินค้า</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[200px]">ชื่อสินค้า</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[120px]">หน่วย</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[150px] text-right">ราคา</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[150px] text-right">ส่วนลด</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[150px] text-right">ราคาสุทธิ</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[80px] text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {fields.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-10 text-center text-gray-400 italic">
                                                ยังไม่มีรายการสินค้า กรุณากดปุ่มเพิ่มสินค้า
                                            </td>
                                        </tr>
                                    ) : (
                                        fields.map((field, index) => (
                                            <tr key={field.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">{watch(`items.${index}.itemCode`)}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveRowIndex(index);
                                                                setIsProductSearchOpen(true);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-blue-600"
                                                        >
                                                            <Search size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                                    {watch(`items.${index}.itemName`)}
                                                </td>
                                                <td className="p-3 text-xs text-gray-500">
                                                    {watch(`items.${index}.uomName`)}
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        className="w-full text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm font-medium p-1 hover:bg-gray-50 rounded"
                                                        value={watch(`items.${index}.unitPrice`)}
                                                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        className="w-full text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm font-medium p-1 hover:bg-gray-50 rounded text-red-600"
                                                        value={watch(`items.${index}.lineDiscount`)}
                                                        onChange={(e) => handleItemChange(index, 'lineDiscount', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-3 text-right text-sm font-bold text-blue-600">
                                                    {Number(watch(`items.${index}.unitPriceNet`)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(index)}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogFormLayout>

            {/* Product Search Sub-Modal */}
            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={handleSelectProduct}
            />
        </>
    );
}
