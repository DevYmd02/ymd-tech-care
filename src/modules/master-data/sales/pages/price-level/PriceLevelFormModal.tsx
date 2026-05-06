/**
 * @file PriceLevelFormModal.tsx
 * @description Form Modal for Price Level Master Data
 */

import { useState, useEffect } from 'react';
import { DollarSign, Save, X, Search } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import type { Path } from 'react-hook-form';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import { usePriceLevelForm } from './hooks/usePriceLevelForm';
import type { PriceLevelFormData } from './types/price-level.types';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import { PriceLevelNameService } from '@sales-master/pages/price-level-name/services/price-level-name.service';
import { logger } from '@/shared/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | string | null;
    onSuccess?: () => void;
}

export default function PriceLevelFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        setValue,
    } = usePriceLevelForm(editId ?? null, onSuccess, isOpen);

    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [units, setUnits] = useState<UnitListItem[]>([]);
    const [levelNameMap, setLevelNameMap] = useState<Map<number, string>>(new Map());

    // Fetch units and level names
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [unitRes, levelNames] = await Promise.all([
                    UnitService.getAll(),
                    PriceLevelNameService.getList().catch(() => []), // Fallback
                ]);
                setUnits(unitRes.items || []);
                const nameMap = new Map<number, string>(
                    (Array.isArray(levelNames) ? levelNames : []).map(ln => [Number(ln.level_no), ln.name])
                );
                setLevelNameMap(nameMap);
            } catch (error) {
                logger.error('Failed to fetch form data:', error);
            }
        };
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const handleSelectProduct = (product: ItemListItem) => {
        setValue('itemId', product.item_id || product.id);
        setValue('itemCode', product.item_code);
        setValue('itemName', product.item_name);
        setValue('itemNameEn', product.item_name_en || ''); 
        if (product.uom_id) {
            setValue('uomId', product.uom_id);
        }
        setIsProductSearchOpen(false);
    };

    // ==================== RENDERING ====================
    
    const TitleIcon = <DollarSign size={24} className="text-blue-600 dark:text-blue-400" />;

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
                title={editId ? 'แก้ไขกำหนดราคาสินค้า (Price Level)' : 'เพิ่มกำหนดราคาสินค้า (Price Level)'}
                titleIcon={TitleIcon}
                footer={FormFooter}
                width="max-w-[1000px]"
            >
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-500 -mt-2">จัดการระดับราคาสินค้าตามปริมาณการสั่งซื้อ</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Selection */}
                        <div className="space-y-4">
                            <div>
                                <label className={styles.label}>รหัสสินค้า <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-[1fr_45px] gap-2">
                                    <input 
                                        {...register('itemCode')} 
                                        type="text" 
                                        className={`${styles.input} font-bold text-blue-600`} 
                                        placeholder="เลือกรหัสสินค้า" 
                                        readOnly
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsProductSearchOpen(true)}
                                        className="h-[42px] flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg shadow-sm transition-all"
                                    >
                                        <Search size={18} className="text-blue-600 dark:text-blue-400" />
                                    </button>
                                </div>
                                {errors.itemId && <p className="text-red-500 text-xs mt-1">{errors.itemId.message}</p>}
                            </div>

                            <div>
                                <label className={styles.label}>ชื่อสินค้า</label>
                                <input
                                    {...register('itemName')}
                                    type="text"
                                    className={`${styles.input} bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                                    placeholder="จะแสดงเมื่อเลือกรหัสสินค้า"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className={styles.label}>จำนวนเริ่มต้น</label>
                                <input
                                    {...register('itemFromQty', { valueAsNumber: true })}
                                    type="number"
                                    className={styles.input}
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                        </div>

                        {/* UOM and Info */}
                        <div className="space-y-4">
                            <div>
                                <label className={styles.label}>หน่วยนับ <span className="text-red-500">*</span></label>
                                <select {...register('uomId')} className={styles.input}>
                                    <option value="">เลือกหน่วยนับ</option>
                                    {units.map(unit => (
                                        <option key={unit.unit_id} value={unit.unit_id}>{unit.unit_name}</option>
                                    ))}
                                </select>
                                {errors.uomId && <p className="text-red-500 text-xs mt-1">{errors.uomId.message}</p>}
                            </div>

                            <div>
                                <label className={styles.label}>ชื่อสินค้า (EN)</label>
                                <input
                                    {...register('itemNameEn')}
                                    type="text"
                                    className={`${styles.input} bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed`}
                                    placeholder="จะแสดงเมื่อเลือกรหัสสินค้า"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className={styles.label}>ถึงจำนวน</label>
                                <input
                                    {...register('itemToQty', { valueAsNumber: true })}
                                    type="number"
                                    className={styles.input}
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onWheel={(e) => e.currentTarget.blur()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Price Levels Section */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-md font-bold text-gray-800 dark:text-white mb-4">
                            ระดับราคา (Price Levels)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <div key={num} className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        {levelNameMap.get(num)
                                            ? `${num}. ${levelNameMap.get(num)} (ระดับ ${num})`
                                            : `ระดับที่ ${num}`
                                        }
                                    </label>
                                    <input
                                        {...register(`itemPrice${num}` as Path<PriceLevelFormData>, { valueAsNumber: true })}
                                        type="number"
                                        className={`${styles.input} text-right font-medium`}
                                        placeholder="0"
                                        onFocus={(e) => e.target.select()}
                                        onWheel={(e) => e.currentTarget.blur()}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogFormLayout>

            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={handleSelectProduct}
            />
        </>
    );
}
