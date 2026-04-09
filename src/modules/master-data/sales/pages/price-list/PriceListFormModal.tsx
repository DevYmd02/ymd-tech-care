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
import { EmployeeDeptService } from '@company/services/employee-dept.service';
import { BranchService } from '@company/services/branch.service';
import { useQuery } from '@tanstack/react-query';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem } from '@/modules/master-data/inventory/types/product-types';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';

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
    } = usePriceListForm(editId ?? null, onSuccess, isOpen);

    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isPermitEmpSearchOpen, setIsPermitEmpSearchOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

    // Fetch Departments for selection
    const { data: deptsData } = useQuery({
        queryKey: ['employee-depts-lookup'],
        queryFn: () => EmployeeDeptService.getList({ page: 1, limit: 1000 }),
    });

    const { data: branchesData } = useQuery({
        queryKey: ['org-branches-lookup'],
        queryFn: () => BranchService.getList({ page: 1, limit: 1000 }),
    });

    const { data: unitsData } = useQuery({
        queryKey: ['units-lookup'],
        queryFn: () => UnitService.getAll({ page: 1, limit: 1000 }),
    });

    const handleAddProduct = () => {
        append({
            itemId: '',
            itemCode: '',
            itemName: '',
            uomId: null,
            uomName: '-',
            unitPrice: 0,
            lineDiscount: 0,
            lineDiscountAmnt: 0,
            unitPriceNet: 0,
            remark: ''
        });
    };

    const handleSelectProduct = (product: ItemListItem) => {
        // Smart UOM Mapping: Try ID match first, fallback to Name match if ID is missing (0/null)
        let targetUomId = product.uom_id ? String(product.uom_id) : (product.unit_id ? String(product.unit_id) : '');
        const targetUomName = product.uom_name || product.unit_name || '';
        const targetPrice = Number(product.standard_cost || 0);

        // Debug diagnostic
        console.group('🔍 Product Selection Diagnostic');
        console.log('Selected Product:', product);
        
        // If ID is shaky, try matching by name against the loaded unitsData
        if (!targetUomId || targetUomId === '0' || targetUomId === 'undefined') {
            const matchedUnit = unitsData?.items.find(u => 
                (u.uom_name && u.uom_name === targetUomName) || 
                (u.unit_name && u.unit_name === targetUomName)
            );
            if (matchedUnit) {
                console.log('✅ Smart Match found UOM by Name:', matchedUnit);
                targetUomId = String(matchedUnit.uom_id || matchedUnit.unit_id);
            } else {
                console.warn('⚠️ No UOM match found for name:', targetUomName);
            }
        }
        // Smart Match Log
        console.log('Final targetUomId:', targetUomId);
        console.groupEnd();

        if (activeRowIndex !== null) {
            handleItemChange(activeRowIndex, 'itemId', String(product.item_id || product.id));
            handleItemChange(activeRowIndex, 'itemCode', product.item_code);
            handleItemChange(activeRowIndex, 'itemName', product.item_name);
            handleItemChange(activeRowIndex, 'uomId', targetUomId);
            handleItemChange(activeRowIndex, 'uomName', targetUomName || '-');
            handleItemChange(activeRowIndex, 'unitPrice', targetPrice);
            const bId = (product as { item_brand_id?: number | string; brand_id?: number | string }).item_brand_id || (product as { brand_id?: number | string }).brand_id || 0;
            handleItemChange(activeRowIndex, 'itemBrandId', bId);
        } else {
            const bId = (product as { item_brand_id?: number | string; brand_id?: number | string }).item_brand_id || (product as { brand_id?: number | string }).brand_id || 0;
            append({
                itemId: String(product.item_id || product.id),
                itemCode: product.item_code,
                itemName: product.item_name,
                uomId: targetUomId,
                uomName: targetUomName || '-',
                unitPrice: targetPrice,
                lineDiscount: 0,
                lineDiscountAmnt: 0,
                unitPriceNet: targetPrice,
                remark: '',
                itemBrandId: bId
            });
        }
        setIsProductSearchOpen(false);
    };

    const handleSelectCustomer = (customer: CustomerMaster) => {
        setValue('customerId', String(customer.customer_id || customer.id));
        setValue('customerCode', customer.customer_code);
        setValue('customerName', customer.customer_name_th || customer.customer_name);
        setIsCustomerSearchOpen(false);
    };
    
    const handleSelectPermitEmp = (employee: IEmployee) => {
        const empId = employee.id || ('employee_id' in employee ? (employee as { employee_id: number | string }).employee_id : '');
        setValue('permitEmpId', String(empId || ''));
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
                title={editId ? 'แก้ไขรายการราคา (Price List)' : 'เพิ่มรายการราคาใหม่ (Price List)'}
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
                                <select 
                                    {...register('branchId')} 
                                    className={`${styles.input} ${errors.branchId ? 'border-red-500' : ''}`}
                                >
                                    <option value="">-- เลือกสาขา --</option>
                                    {branchesData?.items?.map((branch, index) => (
                                        <option key={branch.branch_id || branch.id || `branch-${index}`} value={String(branch.branch_id)}>
                                            {branch.branch_code} - {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.branchId && <p className="text-red-500 text-xs mt-1">{errors.branchId.message}</p>}
                             </div>

                            <div>
                                <label className={styles.label}>แผนก (Department) <span className="text-red-500">*</span></label>
                                <select 
                                    {...register('empDeptId')} 
                                    className={`${styles.input} ${errors.empDeptId ? 'border-red-500' : ''}`}
                                >
                                    <option value="">-- เลือกแผนก --</option>
                                    {deptsData?.items?.map((dept, index) => (
                                        <option key={dept.emp_dept_id || dept.id || `dept-${index}`} value={dept.emp_dept_id || dept.id}>
                                            {dept.emp_dept_code || dept.dept_code} - {dept.emp_dept_name || dept.dept_name || dept.department_name} {dept.emp_side_name ? `(${dept.emp_side_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.empDeptId && <p className="text-red-500 text-xs mt-1">{errors.empDeptId.message}</p>}
                            </div>

                            {/* Row 3 */}
                            <div className="md:col-span-2">
                                <label className={styles.label}>ลูกค้า (ถ้าเจาะจง / Specific Customer)</label>
                                <div className="grid grid-cols-[180px_1fr_45px] gap-2">
                                    <input 
                                        {...register('customerCode')} 
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
                                <label className={styles.label}>ผู้อนุมัติ (Approver) <span className="text-red-500">*</span></label>
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
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[350px]">ชื่อสินค้า</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[150px]">หน่วย</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[130px] text-right">ราคา</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[130px] text-right">ส่วนลด </th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[140px] text-right">มูลค่าส่วนลด</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[140px] text-right">ราคาสุทธิ</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 min-w-[200px]">หมายเหตุ</th>
                                        <th className="p-3 text-sm font-bold border-b border-gray-200 dark:border-gray-700 w-[80px] text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {fields.length === 0 ? (
                                        <tr key="empty-row">
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
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-1 min-w-[150px]">
                                                        <select
                                                            {...register(`items.${index}.uomId`)}
                                                            value={watch(`items.${index}.uomId`) || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const unit = unitsData?.items.find(u => String(u.uom_id) === val);
                                                                handleItemChange(index, 'uomId', val);
                                                                handleItemChange(index, 'uomName', unit?.uom_name || '-');
                                                            }}
                                                            className={`${styles.input} text-xs py-1 h-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all ${errors.items?.[index]?.uomId ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50 dark:bg-red-900/20' : ''}`}
                                                        >
                                                            <option value="" className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">-- เลือกหน่วย --</option>
                                                            {unitsData?.items.map(unit => (
                                                                <option 
                                                                    key={unit.uom_id} 
                                                                    value={String(unit.uom_id)}
                                                                    className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                                                                >
                                                                    {unit.uom_code} - {unit.uom_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.items?.[index]?.uomId && (
                                                            <div className="flex items-center gap-1 mt-1 whitespace-nowrap">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                                                                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold tracking-tight">
                                                                    {errors.items[index]?.uomId?.message}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        {...register(`items.${index}.unitPrice`, {
                                                            onChange: (e) => handleItemChange(index, 'unitPrice', e.target.value)
                                                        })}
                                                        onFocus={(e) => e.target.select()}
                                                        className="w-full text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-bold px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-100 shadow-sm transition-all"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        {...register(`items.${index}.lineDiscount`, {
                                                            onChange: (e) => handleItemChange(index, 'lineDiscount', e.target.value)
                                                        })}
                                                        onFocus={(e) => e.target.select()}
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
