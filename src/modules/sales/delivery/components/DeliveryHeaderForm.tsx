/**
 * @file DeliveryHeaderForm.tsx
 * @description ฟอร์ม Header ของใบจัดส่งสินค้า (delivery_header D11)
 */

import { useFormContext } from 'react-hook-form';
import { MapPin, Truck, Search, Calendar, FileText, Hash } from 'lucide-react';
import type { DeliveryFormValues } from '../schemas/delivery.schemas';
import type { BranchListItem } from '@master-data/types/master-data-types';

interface DeliveryHeaderFormProps {
    branches: BranchListItem[];
    onSearchSalesOrder: () => void;
    onSearchEmployee: () => void;
}

const SHIP_METHOD_OPTIONS = [
    { value: '', label: '-- เลือกวิธีจัดส่ง --' },
    { value: 'DELIVERY', label: 'ส่งถึงบ้าน' },
    { value: 'PICKUP', label: 'รับเอง' },
    { value: 'EXPRESS', label: 'ขนส่งด่วน' },
    { value: 'FREIGHT', label: 'ขนส่งทั่วไป' },
    { value: 'COURIER', label: 'ไปรษณีย์' },
    { value: 'OTHER', label: 'อื่นๆ' },
];

const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5';
const inputClass =
    'w-full h-9 px-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all placeholder-slate-400 dark:placeholder-slate-600';
const inputReadonlyClass =
    'w-full h-9 px-3 bg-slate-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 cursor-default select-none truncate flex items-center';
const searchBtnClass =
    'absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors';
const errorClass = 'text-xs text-red-500 mt-1';

export function DeliveryHeaderForm({
    branches,
    onSearchSalesOrder,
    onSearchEmployee,
}: DeliveryHeaderFormProps) {
    const {
        register,
        watch,
        formState: { errors },
    } = useFormContext<DeliveryFormValues>();

    const watchedSoNo = watch('so_no');
    const watchedCustomerName = watch('customer_name');
    const watchedEmpName = watch('ship_by_emp_name');

    return (
        <div className="space-y-6">
            {/* Section Title */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                    <FileText size={18} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100">ข้อมูลรายการจัดส่ง</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">กรอกข้อมูลส่วน Header ของรายการจัดส่งสินค้า</p>
                </div>
            </div>

            {/* Row 1: Delivery No, Delivery Date, Document Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className={labelClass}>เลขที่รายการจัดส่ง (Auto)</label>
                    <div className={inputReadonlyClass + ' text-slate-400 dark:text-slate-500 italic'}>
                        {watch('delivery_no') || 'สร้างอัตโนมัติ'}
                    </div>
                </div>
                <div>
                    <label className={labelClass}>
                        วันที่จัดส่ง <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <Calendar size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                            type="date"
                            {...register('delivery_date')}
                            className={inputClass + ' pl-9'}
                        />
                    </div>
                    {errors.delivery_date && <p className={errorClass}>{errors.delivery_date.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>
                        วันที่เอกสาร <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <Calendar size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                            type="date"
                            {...register('docu_date')}
                            className={inputClass + ' pl-9'}
                        />
                    </div>
                    {errors.docu_date && <p className={errorClass}>{errors.docu_date.message}</p>}
                </div>
            </div>

            {/* Row 2: SO Reference, Customer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>
                        อ้างอิงใบสั่งขาย (SO) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div
                            className={inputReadonlyClass + ' cursor-pointer hover:border-teal-400 pr-10 transition-all'}
                            onClick={onSearchSalesOrder}
                        >
                            {watchedSoNo || (
                                <span className="text-slate-400 italic">คลิกเพื่อเลือกใบสั่งขาย</span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onSearchSalesOrder}
                            className={searchBtnClass}
                            title="ค้นหาใบสั่งขาย"
                        >
                            <Search size={15} />
                        </button>
                    </div>
                    {errors.so_id && <p className={errorClass}>{errors.so_id.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>ลูกค้า</label>
                    <div className={inputReadonlyClass}>
                        {watchedCustomerName || <span className="text-slate-400 italic">เลือกจาก SO</span>}
                    </div>
                </div>
            </div>

            {/* Row 3: Branch, Warehouse ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>
                        สาขา <span className="text-red-500">*</span>
                    </label>
                    <select {...register('branch_id')} className={inputClass}>
                        <option value="">-- เลือกสาขา --</option>
                        {branches.map((b) => (
                            <option
                                key={String(b.branch_id || b.id)}
                                value={String(b.branch_id || b.id)}
                            >
                                {b.branch_name}
                            </option>
                        ))}
                    </select>
                    {errors.branch_id && <p className={errorClass}>{errors.branch_id.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>คลังต้นทาง (ถ้ามี)</label>
                    <input
                        {...register('warehouse_id')}
                        placeholder="ระบุรหัสคลังสินค้า"
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Row 4: Ship Method, Carrier, Tracking No */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className={labelClass}>วิธีจัดส่ง</label>
                    <div className="relative flex items-center">
                        <Truck size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <select {...register('ship_method')} className={inputClass + ' pl-9'}>
                            {SHIP_METHOD_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>บริษัทขนส่ง</label>
                    <input
                        {...register('carrier')}
                        placeholder="ชื่อบริษัทขนส่ง"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>หมายเลข Tracking</label>
                    <div className="relative flex items-center">
                        <Hash size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                        <input
                            {...register('tracking_no')}
                            placeholder="Tracking number"
                            className={inputClass + ' pl-9'}
                        />
                    </div>
                </div>
            </div>

            {/* Row 5: Ship To Address, Employee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className={labelClass}>ที่อยู่จัดส่ง</label>
                    <div className="relative flex items-start">
                        <MapPin size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <textarea
                            {...register('ship_to_address')}
                            rows={3}
                            placeholder="ระบุที่อยู่จัดส่ง..."
                            className={
                                'w-full px-3 py-2 pl-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all placeholder-slate-400 dark:placeholder-slate-600 resize-none'
                            }
                        />
                    </div>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className={labelClass}>พนักงานจัดส่ง</label>
                        <div className="relative">
                            <div
                                className={inputReadonlyClass + ' cursor-pointer hover:border-teal-400 pr-10 transition-all'}
                                onClick={onSearchEmployee}
                            >
                                {watchedEmpName || (
                                    <span className="text-slate-400 italic">คลิกเพื่อเลือกพนักงาน</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onSearchEmployee}
                                className={searchBtnClass}
                                title="ค้นหาพนักงาน"
                            >
                                <Search size={15} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>หมายเหตุ</label>
                        <input
                            {...register('remarks')}
                            placeholder="หมายเหตุเพิ่มเติม"
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
