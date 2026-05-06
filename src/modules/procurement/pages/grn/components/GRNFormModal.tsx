import { useState, useMemo } from 'react';
import { cn } from '@/shared/utils';
import { Save, Package, Plus, Trash2, Search, ChevronDown, Loader2 } from 'lucide-react';
import { FormProvider, Controller } from 'react-hook-form';
import { WindowFormLayout, CustomDateInput } from '@ui';
import { POSearchModal } from './POSearchModal';
import { LotSearchModal } from './LotSearchModal';
import type { LotNo } from '@/modules/master-data/inventory/types/inventory-master.types';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { useGRNForm } from '../hooks/useGRNForm';
import type { POListItem } from '@/modules/procurement/types';

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialPOId?: number;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function GRNFormModal({ isOpen, onClose, onSuccess, initialPOId }: Props) {
    const {
        methods,
        fields,
        isSubmitting,
        isFetchingPO,
        warehouses,
        departments,
        currencies,
        employees,
        poDetail,
        isMulticurrency,
        items,
        onFormSubmit,
        handleRemoveLine,
    } = useGRNForm({ isOpen, initialPOId, onClose, onSuccess });

    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = methods;

    // -- Search Modals State --
    const [isPOSearchOpen, setIsPOSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [currentLotLineIndex, setCurrentLotLineIndex] = useState<number | null>(null);

    // -- Watched Header Values --
    const warehouseId = watch('warehouse_id');
    const currencyCode = watch('curr_type_code');

    // -- Handlers --
    const handleOpenLotSearch = (index: number) => {
        setCurrentLotLineIndex(index);
        setIsLotSearchOpen(true);
    };

    const handleSelectLot = (lot: LotNo) => {
        if (currentLotLineIndex !== null) {
            setValue(`items.${currentLotLineIndex}.lot_id`, String(lot.id), { shouldDirty: true });
            setValue(`items.${currentLotLineIndex}.lot_code`, lot.code, { shouldDirty: true });
        }
        setIsLotSearchOpen(false);
    };

    const handleAddLine = () => {
        // Since GRN is usually based on PO, manual adding might be limited, 
        // but we keep the button for flexibility.
        // @ts-ignore
        methods.append({
            po_line_id: Date.now(), // Temporary ID for manual lines if allowed
            item_code: '',
            item_name: '',
            qty_ordered: 0,
            qty_received: 0,
            accepted_qty: 0,
            rejected_qty: 0,
            uom_name: '',
            unit_price: 0,
            line_total: 0,
            qc_status: 'PASS',
            lot_id: '',
            lot_code: '',
            remark: ''
        });
    };

    // -- Calculated Values --
    const totalItems = items.length;
    const totalReceived = useMemo(() => items.reduce((sum, item) => sum + (Number(item.qty_received) || 0), 0), [items]);
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0), [items]);

    // -- Styles --
    const inputClass = 'w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none disabled:opacity-70';
    const selectClass = 'w-full h-8 pl-3 pr-8 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 appearance-none outline-none disabled:opacity-70 transition-all';
    const labelClass = 'block text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1';
    const sectionHeaderClass = 'text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2';

    if (!isOpen) return null;

    return (
        <FormProvider {...methods}>
            <WindowFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title="สร้างใบรับสินค้าใหม่ (Create GRN)"
                titleIcon={<div className="bg-violet-500 p-2 rounded-lg shadow"><Package className="text-white" size={20} /></div>}
                headerColor="border-violet-600 bg-violet-600 bg-gradient-to-r from-violet-700 to-violet-500 [&_div.flex.items-center.space-x-1>button:not(:last-child)]:hidden"
                footer={
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center bg-white dark:bg-gray-900 sticky bottom-0 z-10">
                        <div className="text-xs text-red-500">* ฟิลด์ที่จำเป็นต้องกรอก</div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit(onFormSubmit as any)}
                                disabled={isSubmitting || isFetchingPO}
                                className="px-8 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                บันทึก
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 gap-6 overflow-auto">
                    
                    {/* ========== GRN Header Section ========== */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm">
                        <div className="border-l-4 border-violet-500 pl-3 mb-6">
                            <h3 className={sectionHeaderClass}>
                                ใบรับสินค้า (GRN Header)
                            </h3>
                        </div>
                        
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>เลขที่ GRN <span className="text-red-500">*</span></label>
                                <input type="text" {...register('grn_no')} readOnly className={`${inputClass} bg-gray-50 dark:bg-gray-800/50 text-gray-500 font-medium`} />
                            </div>
                            <div>
                                <label className={labelClass}>วันที่รับ <span className="text-red-500">*</span></label>
                                <Controller
                                    control={control}
                                    name="received_date"
                                    render={({ field }) => (
                                        <div className="relative h-8">
                                            <CustomDateInput 
                                                value={field.value} 
                                                onChange={field.onChange} 
                                                className={inputClass} 
                                            />
                                        </div>
                                    )}
                                />
                                {errors.received_date && <p className="text-xs text-red-500 mt-1">{errors.received_date.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>เลขที่ PO อ้างอิง <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={poDetail?.po_no || ''} 
                                        readOnly 
                                        className={`${inputClass} flex-1 bg-gray-50 dark:bg-gray-800/50 text-gray-500`}
                                        placeholder="คลิกเพื่อเลือก PO..."
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setIsPOSearchOpen(true)}
                                        className="px-4 h-8 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm transition-all focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 flex items-center justify-center"
                                    >
                                        {isFetchingPO ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                    </button>
                                </div>
                                {errors.po_id && <p className="text-xs text-red-500 mt-1">{errors.po_id.message}</p>}
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div>
                                <label className={labelClass}>รับเข้าคลัง <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select {...register('warehouse_id', { valueAsNumber: true })} className={selectClass}>
                                        <option value="">-- เลือกคลังสินค้า --</option>
                                        {warehouses.map((wh: any) => (
                                            <option key={wh.warehouse_id} value={wh.warehouse_id}>{wh.warehouse_name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                                {errors.warehouse_id && <p className="text-xs text-red-500 mt-1">{errors.warehouse_id.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>ผู้รับสินค้า <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select {...register('received_by', { valueAsNumber: true })} className={selectClass}>
                                        <option value="">-- เลือกผู้รับสินค้า --</option>
                                        {employees.map((emp: any) => (
                                            <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                                {errors.received_by && <p className="text-xs text-red-500 mt-1">{errors.received_by.message}</p>}
                            </div>
                            <div>
                                <label className={labelClass}>แผนก</label>
                                <div className="relative">
                                    <select {...register('emp_dept_id')} className={selectClass}>
                                        <option value="">-- เลือกแผนก --</option>
                                        {departments.map((dept: any) => (
                                            <option key={dept.emp_dept_id || dept.dept_id || dept.id} value={String(dept.emp_dept_id || dept.dept_id || dept.id)}>
                                                {dept.emp_dept_code || dept.dept_code} - {dept.emp_dept_name || dept.dept_name || dept.department_name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div>
                                <label className={labelClass}>งาน</label>
                                <div className="relative">
                                    <select {...register('job_id')} className={selectClass}>
                                        <option value="">-- เลือกงาน --</option>
                                        <option value="JOB01">งานติดตั้งเครื่องจักร</option>
                                        <option value="JOB02">งานซ่อมบำรุงประจำปี</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>สถานะ</label>
                                <div className="relative">
                                    <select {...register('status')} className={`${selectClass} font-medium text-violet-600`}>
                                        <option value="Draft">Draft</option>
                                        <option value="Posted">Posted</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="mt-6">
                            <label className={labelClass}>หมายเหตุ <span className="text-gray-400 font-normal">(เพิ่มเติม)</span></label>
                            <textarea 
                                {...register('remark')}
                                placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                                rows={2}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 resize-none shadow-sm transition-all"
                            />
                        </div>

                        {/* Multicurrency Section */}
                        <div className="mt-4">
                            <Controller
                                control={control}
                                name="isMulticurrency"
                                render={({ field }) => (
                                    <MulticurrencyWrapper
                                        name="isMulticurrency"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        label="Multicurrency (เปิดใช้งานหลายสกุลเงิน)"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                                                <Controller
                                                    control={control}
                                                    name="rate_date"
                                                    render={({ field: rateDateField }) => (
                                                        <CustomDateInput 
                                                            value={rateDateField.value || ''}
                                                            onChange={rateDateField.onChange}
                                                            className={inputClass}
                                                            disabled={!isMulticurrency}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select 
                                                        {...register('curr_id')}
                                                        className={selectClass}
                                                        disabled={!isMulticurrency}
                                                    >
                                                        <option value="">-- เลือกสกุลเงิน --</option>
                                                        {currencies.map((c: any) => (
                                                            <option key={c.id || c.currency_id} value={c.id || c.currency_id}>
                                                                {c.code || c.currency_code} - {c.name_th || c.currency_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                                                <div className="relative">
                                                    <select 
                                                        {...register('curr_type_id')}
                                                        className={selectClass}
                                                        disabled={!isMulticurrency}
                                                    >
                                                        <option value="">-- เลือกสกุลเงิน --</option>
                                                        {currencies.map((c: any) => (
                                                            <option key={c.id || c.currency_id} value={c.id || c.currency_id}>
                                                                {c.code || c.currency_code} - {c.name_th || c.currency_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        {...register('exchange_rate', { valueAsNumber: true })}
                                                        readOnly={currencyCode === 'THB'}
                                                        disabled={!isMulticurrency}
                                                        className={cn(inputClass, "text-right font-medium", currencyCode === 'THB' && 'bg-gray-100 dark:bg-gray-800/50 italic')}
                                                        step="0.0001"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </MulticurrencyWrapper>
                                )}
                            />
                        </div>
                    </div>

                    {/* ========== Line Items Section ========== */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div className="border-l-4 border-violet-500 pl-3">
                                <h3 className={sectionHeaderClass}>รายการสินค้าที่รับ (GRN Line Items)</h3>
                            </div>
                            <button 
                                type="button"
                                onClick={handleAddLine}
                                className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 shadow-sm transition-all flex items-center gap-2 text-sm font-bold active:scale-95"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                                เพิ่มรายการ
                            </button>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden scrollbar-hide">
                            <table className="w-full min-w-[1000px] text-sm table-fixed border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400">
                                        <th className="px-6 py-4 text-center w-[60px] font-bold border-b border-gray-100 dark:border-gray-800">ลำดับ</th>
                                        <th className="px-6 py-4 text-left w-[180px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">รหัสสินค้า</th>
                                        <th className="px-6 py-4 text-left font-bold border-b border-gray-100 dark:border-gray-800">ชื่อสินค้า</th>
                                        <th className="px-6 py-4 text-center w-[120px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">จำนวนสั่ง</th>
                                        <th className="px-6 py-4 text-center w-[120px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">จำนวนรับ*</th>
                                        <th className="px-6 py-4 text-left w-[120px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">หน่วย</th>
                                        <th className="px-6 py-4 text-left w-[150px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">Lot No</th>
                                        <th className="px-6 py-4 text-left w-[200px] font-bold border-b border-gray-100 dark:border-gray-800 leading-tight">หมายเหตุ</th>
                                        <th className="px-4 py-4 text-center w-[60px] font-bold border-b border-gray-100 dark:border-gray-800">ลบ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {fields.map((item, index) => (
                                        <tr key={item.id} className="group hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-medium">{index + 1}</td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="text" 
                                                    {...register(`items.${index}.item_code`)}
                                                    readOnly 
                                                    className="w-full h-9 px-2 text-sm font-bold text-gray-700 dark:text-gray-100 border border-transparent rounded bg-transparent outline-none" 
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="text" 
                                                    {...register(`items.${index}.item_name`)}
                                                    readOnly 
                                                    className="w-full h-9 px-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-transparent rounded bg-transparent outline-none" 
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="number" 
                                                    {...register(`items.${index}.qty_ordered`)}
                                                    readOnly 
                                                    className="w-full h-9 px-2 text-sm text-center border border-gray-100 dark:border-gray-800 rounded bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <Controller
                                                    control={control}
                                                    name={`items.${index}.qty_received`}
                                                    render={({ field: qtyField }) => (
                                                        <input 
                                                            type="number" 
                                                            min={0}
                                                            value={qtyField.value || ''} 
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                qtyField.onChange(val);
                                                                setValue(`items.${index}.accepted_qty`, val);
                                                                const price = watch(`items.${index}.unit_price`) || 0;
                                                                setValue(`items.${index}.line_total`, val * price);
                                                            }}
                                                            className="w-full h-9 px-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 font-bold focus:ring-2 focus:ring-violet-500 shadow-sm"
                                                        />
                                                    )}
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="text" 
                                                    {...register(`items.${index}.uom_name`)}
                                                    readOnly 
                                                    className="w-full h-9 px-2 text-sm text-gray-700 dark:text-gray-300 border border-transparent rounded bg-transparent outline-none" 
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="relative group/lot w-full min-w-[120px]">
                                                    <input 
                                                        type="text" 
                                                        value={watch(`items.${index}.lot_code`) || ''} 
                                                        onClick={() => handleOpenLotSearch(index)}
                                                        readOnly
                                                        placeholder="คลิกเลือก Lot..."
                                                        className="w-full h-9 px-2 pr-8 text-[11px] border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-[#1a1c23] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-all shadow-sm outline-none"
                                                    />
                                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover/lot:text-violet-500 transition-colors pointer-events-none">
                                                        <Search size={14} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="text" 
                                                    {...register(`items.${index}.remark`)}
                                                    placeholder="หมายเหตุ"
                                                    className="w-full h-9 px-2 text-sm text-gray-700 dark:text-gray-300 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 rounded bg-transparent focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveLine(index)}
                                                    className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {fields.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
                                                    <Package size={48} strokeWidth={1} />
                                                    <p className="text-sm">กรุณาเลือก PO เพื่อดึงรายการสินค้า หรือกดปุ่ม "เพิ่มรายการ"</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Section */}
                        <div className="mt-8 flex justify-end">
                            <div className="bg-violet-50/50 dark:bg-violet-900/10 border-2 border-violet-100 dark:border-violet-900/30 rounded-2xl p-6 min-w-[350px] shadow-sm">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">จำนวนรายการทั้งหมด:</span>
                                        <span className="font-bold text-gray-900 dark:text-white px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-violet-100 dark:border-violet-900/30">
                                            {totalItems} <span className="text-[10px] font-normal text-gray-400 uppercase ml-1">Items</span>
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm border-b border-violet-100/50 dark:border-violet-900/20 pb-4">
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">จำนวนที่รับรวม:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {totalReceived.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            <span className="text-[10px] font-normal text-gray-400 uppercase ml-1">Units</span>
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-violet-700 dark:text-violet-300 font-bold text-sm">ยอดรวมเงินสุทธิ</span>
                                            <span className="text-[10px] text-gray-400 uppercase font-medium">Grand Total Amount</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-violet-600 dark:text-violet-400 text-3xl leading-none">
                                                {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                            <span className="ml-2 text-sm font-bold text-gray-500 uppercase">{isMulticurrency ? currencyCode : 'THB'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* PO Search Modal */}
                <POSearchModal 
                    isOpen={isPOSearchOpen}
                    onClose={() => setIsPOSearchOpen(false)}
                    onSelect={(po: POListItem) => {
                        setValue('po_id', po.po_id, { shouldDirty: true });
                        setIsPOSearchOpen(false);
                    }}
                />
                {/* Lot Search Modal */}
                <LotSearchModal 
                    isOpen={isLotSearchOpen}
                    onClose={() => setIsLotSearchOpen(false)}
                    onSelect={handleSelectLot}
                    itemId={currentLotLineIndex !== null ? items[currentLotLineIndex]?.item_id : undefined}
                    itemName={currentLotLineIndex !== null ? items[currentLotLineIndex]?.item_name : undefined}
                    itemCode={currentLotLineIndex !== null ? items[currentLotLineIndex]?.item_code : undefined}
                    warehouseId={warehouseId}
                    title="เลือกและจัดการล็อตสินค้า (GRN)"
                />
            </WindowFormLayout>
        </FormProvider>
    );
}
