/**
 * @file PriceListFormModal.tsx
 * @description Form Modal for Price List Master Data
 */

import { useState } from 'react';
import { Layers, Save, X, Plus, Trash2, Search, Minus } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { Controller } from 'react-hook-form';
import { usePriceListForm } from '@master-data/sales/pages/price-list/hooks/usePriceListForm';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import { CustomerSearchModal } from '@/modules/master-data/customer/customer-master/components/CustomerSearchModal';
import { EmployeeSearchModal } from '@/modules/master-data/employee/components/EmployeeSearchModal';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';

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
        watch,
        control,
        setValue
    } = usePriceListForm(editId ?? null, onSuccess);

    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isPermitEmpSearchOpen, setIsPermitEmpSearchOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    const handleAddProduct = () => {
        setActiveRowIndex(null);
        setIsProductSearchOpen(true);
    };

    const handleSelectProduct = (product: ItemListItem) => {
        if (activeRowIndex !== null) {
            // Update existing row
            handleItemChange(activeRowIndex, 'itemId', String(product.item_id || product.id));
            handleItemChange(activeRowIndex, 'itemCode', product.item_code);
            handleItemChange(activeRowIndex, 'itemName', product.item_name);
            handleItemChange(activeRowIndex, 'uomId', product.uom_id ? String(product.uom_id) : null);
            handleItemChange(activeRowIndex, 'uomName', product.uom_name || product.unit_name || '-');
        } else {
            // Add new row logic (if needed)
            append({
                itemId: String(product.item_id || product.id),
                itemCode: product.item_code,
                itemName: product.item_name,
                uomId: product.uom_id ? String(product.uom_id) : null,
                uomName: product.uom_name || product.unit_name || '-',
                unitPrice: Number(product.standard_cost || 0),
                lineDiscount: 0,
                lineDiscountAmnt: 0,
                unitPriceNet: Number(product.standard_cost || 0),
                remark: ''
            });
        }
        setIsProductSearchOpen(false);
    };

    const handleSelectCustomer = (customer: CustomerMaster) => {
        setValue('customerId', customer.customer_code || customer.code);
        setValue('customerName', customer.customer_name_th || customer.name_th || customer.customer_name || '');
        setIsCustomerSearchOpen(false);
    };
    
    const handleSelectPermitEmp = (employee: IEmployee) => {
        setValue('permitEmpId', String(employee.id));
        setValue('permitEmpName', `${employee.employee_firstname_th} ${employee.employee_lastname_th}`);
        setIsPermitEmpSearchOpen(false);
    };

    // ==================== RENDERING ====================
    
    const TitleIcon = <Layers size={24} />;

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
                width="max-w-[1800px]"
            >
                <div className="p-6 space-y-8">
                    
                    {/* Section 1: Header Info */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                ข้อมูลทั่วไป
                            </h3>
                            <div className="flex items-center gap-3 p-2 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 active:scale-95 transition-transform cursor-pointer">
                                <input
                                    {...register('isActive')}
                                    type="checkbox"
                                    id="pl_is_active"
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="pl_is_active" className="text-sm font-semibold text-blue-700 dark:text-blue-400 cursor-pointer">
                                    สถานะใช้งาน
                                </label>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            {/* Row 1 */}
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

                            <div>
                                <label className={styles.label}>วันที่เอกสาร</label>
                                <Controller
                                    name="priceListDate"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomDateInput
                                            value={field.value}
                                            onChange={field.onChange}
                                            className={styles.input}
                                        />
                                    )}
                                />
                            </div>

                            {/* Row 2 */}
                            <div>
                                <label className={styles.label}>วันที่เริ่มต้น</label>
                                <Controller
                                    name="beginDate"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomDateInput
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            className={styles.input}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <label className={styles.label}>วันที่สิ้นสุด</label>
                                <Controller
                                    name="endDate"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomDateInput
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            className={styles.input}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <label className={styles.label}>สาขา <span className="text-red-500">*</span></label>
                                <select {...register('branchId')} className={styles.input}>
                                    <option value="">เลือกสาขา</option>
                                    <option value="default">สำนักงานใหญ่</option>
                                </select>
                            </div>

                            {/* Row 3 */}
                            <div className="md:col-span-2">
                                <label className={styles.label}>ลูกค้า (ถ้าเจาะจง / Specific Customer)</label>
                                <div className="grid grid-cols-[180px_1fr_45px] gap-2">
                                    <input 
                                        {...register('customerId')} 
                                        type="text" 
                                        className={`${styles.input} font-bold text-blue-600`} 
                                        placeholder="รหัสลูกค้า" 
                                        readOnly
                                    />
                                    <input 
                                        {...register('customerName')} 
                                        type="text" 
                                        className={`${styles.input} font-medium`} 
                                        placeholder="ชื่อลูกค้า" 
                                        readOnly
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCustomerSearchOpen(true)}
                                        className="h-[42px] flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg shadow-sm transition-all"
                                        title="ค้นหาลูกค้า"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={styles.label}>ผู้บันทึก (Recorder)</label>
                                <input 
                                    {...register('saveEmpName')} 
                                    type="text" 
                                    className={`${styles.input} font-medium bg-gray-50/50 dark:bg-gray-800/50`} 
                                    placeholder="ผู้บันทึก..." 
                                    readOnly
                                />
                            </div>

                            {/* Row 4 */}
                            <div>
                                <label className={styles.label}>ผู้อนุมัติ (Approver)</label>
                                <div className="grid grid-cols-[1fr_45px] gap-2">
                                    <input 
                                        {...register('permitEmpName')} 
                                        type="text" 
                                        className={`${styles.input} font-medium`} 
                                        placeholder="เลือกผู้อนุมัติ..." 
                                        readOnly
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsPermitEmpSearchOpen(true)}
                                        className="h-[42px] flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg shadow-sm transition-all"
                                        title="ค้นหาพนักงาน"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={styles.label}>เงื่อนไขการปรับราคา</label>
                                <Controller
                                    name="priceListFlag"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex h-[42px] p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(field.value === '+' ? null : '+')}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-md transition-all text-sm font-bold ${
                                                    field.value === '+' 
                                                    ? 'bg-emerald-500 text-white shadow-sm' 
                                                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                <Plus size={16} /> ปรับเพิ่ม
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(field.value === '-' ? null : '-')}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-md transition-all text-sm font-bold ${
                                                    field.value === '-' 
                                                    ? 'bg-rose-500 text-white shadow-sm' 
                                                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                <Minus size={16} /> ปรับลด
                                            </button>
                                        </div>
                                    )}
                                />
                            </div>

                            <div>
                                <label className={styles.label}>หมายเหตุ (Remark)</label>
                                <input
                                    {...register('remark')}
                                    type="text"
                                    placeholder="ระบุหมายเหตุเพิ่มเติม..."
                                    className={styles.input}
                                />
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
                                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-lg font-bold transition-colors border border-emerald-200"
                            >
                                <Plus size={18} />
                                เพิ่มสินค้า
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[50px] text-center">ลำดับ</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[150px]">รหัสสินค้า</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[200px]">ชื่อสินค้า</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[100px]">หน่วย</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[130px] text-right">ราคา</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[130px] text-right">ส่วนลด %</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[140px] text-right">มูลค่าส่วนลด</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[140px] text-right">ราคาสุทธิ</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[200px]">หมายเหตุ</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[80px] text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {fields.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-10 text-center text-gray-400 italic">
                                                ยังไม่มีรายการสินค้า กรุณากดปุ่มเพิ่มสินค้า
                                            </td>
                                        </tr>
                                    ) : (
                                        fields.map((field, index) => (
                                            <tr key={field.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                <td className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {index + 1}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{watch(`items.${index}.itemCode`)}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveRowIndex(index);
                                                                setIsProductSearchOpen(true);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                                                        >
                                                            <Search size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {watch(`items.${index}.itemName`)}
                                                </td>
                                                <td className="p-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {watch(`items.${index}.uomName`)}
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        {...register(`items.${index}.unitPrice`, {
                                                            onChange: (e) => handleItemChange(index, 'unitPrice', e.target.value)
                                                        })}
                                                        className="w-full text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-bold px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-100 shadow-sm transition-all"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        {...register(`items.${index}.lineDiscount`, {
                                                            onChange: (e) => handleItemChange(index, 'lineDiscount', e.target.value)
                                                        })}
                                                        className="w-full text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-bold px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 shadow-sm transition-all"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="p-3 text-right text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                    {Number(watch(`items.${index}.lineDiscountAmnt`) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-right text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    {Number(watch(`items.${index}.unitPriceNet`) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        {...register(`items.${index}.remark`)}
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm p-2 rounded-lg text-gray-700 dark:text-gray-300 shadow-sm transition-all"
                                                        placeholder="หมายเหตุ..."
                                                    />
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

            {/* Customer Search Sub-Modal */}
            <CustomerSearchModal
                isOpen={isCustomerSearchOpen}
                onClose={() => setIsCustomerSearchOpen(false)}
                onSelect={handleSelectCustomer}
            />

            {/* Employee Search Sub-Modal (Permit) */}
            <EmployeeSearchModal
                isOpen={isPermitEmpSearchOpen}
                onClose={() => setIsPermitEmpSearchOpen(false)}
                onSelect={handleSelectPermitEmp}
                title="ค้นหาผู้อนุมัติ - Find Approver"
            />
        </>
    );
}
