/**
 * @file StandardCostFormModal.tsx
 * @description Form Modal for Standard Cost Master Data
 */

import { useState } from 'react';
import { Save, X, Search, Plus, Trash2, ClipboardList, Package } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useStandardCostForm } from './hooks/useStandardCostForm';
import { EmployeeSearchModal } from '@/modules/master-data/employee/components/EmployeeSearchModal';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    onSuccess?: () => void;
}

export default function StandardCostFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        isLoading,
        fields,
        addLine,
        removeLine,
        setValue,
        watch,
        user
    } = useStandardCostForm(editId ?? null, onSuccess || (() => {}), isOpen);

    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isEmpSearchOpen, setIsEmpSearchOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    const handleSelectEmployee = (emp: IEmployee) => {
        setValue('permitEmpId', emp.id);
        setValue('permitEmpName', `${emp.employee_firstname_th} ${emp.employee_lastname_th}`);
        setIsEmpSearchOpen(false);
    };

    const handleSelectProduct = (product: ItemListItem) => {
        if (activeRowIndex === null) {
            // Header Level Item (if needed)
            setValue('itemId', product.item_id);
            setValue('itemName', product.item_name);
        } else {
            // Line Level Item
            setValue(`lines.${activeRowIndex}.itemId`, product.item_id);
            setValue(`lines.${activeRowIndex}.itemCode`, product.item_code);
            setValue(`lines.${activeRowIndex}.itemName`, product.item_name);
            setValue(`lines.${activeRowIndex}.uomId`, product.uom_id || 0);
            setValue(`lines.${activeRowIndex}.uomName`, product.uom_name || '');
        }
        setIsProductSearchOpen(false);
        setActiveRowIndex(null);
    };

    const addNewLine = () => {
        addLine({
            itemId: 0,
            itemCode: '',
            itemName: '',
            uomId: 0,
            uomName: '',
            standardBuyPrice: 0,
            standardCost: 0,
            remarks: ''
        });
    };

    // ==================== RENDERING ====================
    
    if (isLoading) return null;

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
                title={editId ? 'แก้ไขราคาซื้อและต้นทุนมาตรฐาน' : 'สร้างราคาซื้อและต้นทุนมาตรฐานใหม่'}
                titleIcon={<ClipboardList className="text-blue-600" />}
                footer={FormFooter}
                width="max-w-[1200px]"
            >
                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    
                    {/* section: Header Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <ClipboardList size={20} className="text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Header - ข้อมูลหลัก</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="md:col-span-2">
                                <label className={styles.label}>เลขที่เอกสาร <span className="text-red-500">*</span></label>
                                <input 
                                    {...register('costCode', { required: 'กรุณากรอกเลขที่เอกสาร' })} 
                                    className={styles.input} 
                                    placeholder="เช่น SC-2024-001" 
                                />
                                {errors.costCode && <p className="text-red-500 text-xs mt-1 font-medium">{errors.costCode.message}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className={styles.label}>ชื่อต้นทุน <span className="text-red-500">*</span></label>
                                <input 
                                    {...register('costName', { required: 'กรุณากรอกชื่อต้นทุน' })} 
                                    className={styles.input} 
                                    placeholder="ระบุชื่อต้นทุน" 
                                />
                            </div>

                            <div>
                                <label className={styles.label}>วันที่เอกสาร</label>
                                <input type="date" {...register('docuDate')} className={styles.input} />
                            </div>

                            <div>
                                <label className={styles.label}>วันที่เริ่มต้น</label>
                                <input type="date" {...register('startDate')} className={styles.input} />
                            </div>

                            <div>
                                <label className={styles.label}>วันที่สิ้นสุด</label>
                                <input type="date" {...register('expireDate')} className={styles.input} />
                            </div>

                            <div>
                                <label className={styles.label}>สถานะ</label>
                                <select {...register('isActive')} className={styles.input}>
                                    <option value="true">ใช้งาน (Active)</option>
                                    <option value="false">ไม่ใช้งาน (Inactive)</option>
                                </select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className={styles.label}>ยี่ห้อสินค้า</label>
                                <select {...register('itemBrandId')} className={styles.input}>
                                    <option value="">-- เลือกยี่ห้อสินค้า --</option>
                                    {/* Brand options will be populated here */}
                                </select>
                            </div>

                            <div>
                                <label className={styles.label}>ผู้อนุมัติ</label>
                                <div className="grid grid-cols-[1fr_40px] gap-1">
                                    <input 
                                        {...register('permitEmpName')} 
                                        className={`${styles.input} bg-gray-50/50 truncate`} 
                                        placeholder="ค้นหา..." 
                                        readOnly
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEmpSearchOpen(true)}
                                        className="h-[42px] flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-all text-blue-600"
                                    >
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={styles.label}>ผู้บันทึก</label>
                                <input 
                                    type="text" 
                                    className={`${styles.input} bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed`}
                                    value={user?.employee?.employee_fullname || 'System'}
                                    readOnly 
                                />
                            </div>

                            <div className="md:col-span-4">
                                <label className={styles.label}>หมายเหตุ</label>
                                <textarea {...register('remarks')} rows={2} className={styles.input} placeholder="ระบุหมายเหตุเอกสาร..." />
                            </div>
                        </div>
                    </div>

                    {/* section: Transaction Lines */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                                    <Package size={18} className="text-green-600" />
                                </div>
                                <h3 className="text-md font-bold text-gray-800 dark:text-white uppercase tracking-wider">Transaction Details</h3>
                            </div>
                            <button
                                type="button"
                                onClick={addNewLine}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm transition-all"
                            >
                                <Plus size={14} />
                                เพิ่มรายการสินค้า
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold w-12 italic">#</th>
                                        <th className="px-4 py-3 text-left font-bold">สินค้า / Item Code & Name</th>
                                        <th className="px-4 py-3 text-left font-bold w-24">หน่วย</th>
                                        <th className="px-4 py-3 text-right font-bold w-40">ราคาซื้อมาตรฐาน</th>
                                        <th className="px-4 py-3 text-right font-bold w-40">ต้นทุนมาตรฐาน</th>
                                        <th className="px-4 py-3 text-left font-bold">หมายเหตุ</th>
                                        <th className="px-4 py-3 text-center font-bold w-14">ลบ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {fields.map((field, index) => (
                                        <tr key={field.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-4 py-2">{index + 1}</td>
                                            <td className="px-4 py-2">
                                                <div className="grid grid-cols-[1fr_35px] gap-1 items-center">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-blue-600">{watch(`lines.${index}.itemCode`) || '-'}</span>
                                                        <span className="text-xs text-gray-500 line-clamp-1">{watch(`lines.${index}.itemName`) || 'คลิกที่ไอคอนเพื่อเลือกสินค้า'}</span>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            setActiveRowIndex(index);
                                                            setIsProductSearchOpen(true);
                                                        }}
                                                        className="h-8 w-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        <Search size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="text-gray-700 font-medium">{watch(`lines.${index}.uomName`) || '-'}</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input 
                                                    type="number" 
                                                    {...register(`lines.${index}.standardBuyPrice`, { valueAsNumber: true })} 
                                                    className={`${styles.input} text-right`} 
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input 
                                                    type="number" 
                                                    {...register(`lines.${index}.standardCost`, { valueAsNumber: true })} 
                                                    className={`${styles.input} text-right`} 
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input 
                                                    type="text" 
                                                    {...register(`lines.${index}.remarks`)} 
                                                    className={styles.input} 
                                                    placeholder="..."
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeLine(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {fields.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-gray-400 bg-gray-50/50">
                                                ยังไม่มีรายการสินค้า กรุณากดเพิ่มรายการ
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogFormLayout>

            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => {
                    setIsProductSearchOpen(false);
                    setActiveRowIndex(null);
                }}
                onSelect={handleSelectProduct}
            />

            <EmployeeSearchModal
                isOpen={isEmpSearchOpen}
                onClose={() => setIsEmpSearchOpen(false)}
                onSelect={handleSelectEmployee}
            />
        </>
    );
}
