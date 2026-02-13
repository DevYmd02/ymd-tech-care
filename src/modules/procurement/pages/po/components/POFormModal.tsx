import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, SubmitHandler } from 'react-hook-form';
import { z } from 'zod'; // Assumed z is available or will be installed
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, FileText, Plus, Trash2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { POService } from '@/modules/procurement/services';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorDropdownItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { POFormData, CreatePOPayload } from '@/modules/procurement/types/po-types';
import { useQuery } from '@tanstack/react-query'; // React Query for vendors
import { calculatePricingSummary } from '@/modules/procurement/utils/pricing.utils';

// ====================================================================================
// ZOD SCHEMA
// ====================================================================================

const poLineSchema = z.object({
    item_id: z.string(),
    item_code: z.string().min(1, 'ระบุรหัสสินค้า'),
    item_name: z.string().min(1, 'ระบุชื่อสินค้า'),
    qty: z.number().min(0.001, 'จำนวนต้องมากกว่า 0'),
    unit_price: z.number().min(0, 'ราคาห้ามติดลบ'),
    discount: z.number().min(0, 'ส่วนลดห้ามติดลบ'),
    unit: z.string().optional()
});

const poSchema = z.object({
    po_date: z.string().refine(val => !isNaN(Date.parse(val)), 'วันที่ไม่ถูกต้อง'),
    vendor_id: z.string().min(1, 'กรุณาเลือกผู้ขาย'),
    delivery_date: z.string().optional(),
    payment_term_days: z.number().min(0),
    remarks: z.string().optional(),
    items: z.array(poLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
    tax_rate: z.number(),
    is_vat_included: z.boolean()
});

type POFormValues = z.infer<typeof poSchema>;

// ====================================================================================
// COMPONENTS
// ====================================================================================

/**
 * Summary Component using useWatch for performance
 */
const POSummary = ({ control }: { control: Control<POFormValues> }) => {
    const items = useWatch({ control, name: 'items' });
    const taxRate = useWatch({ control, name: 'tax_rate' });
    const isVatIncluded = useWatch({ control, name: 'is_vat_included' });
    const summary = useMemo(() => {
        // Map form items to pricing items
        const pricingItems = (items || []).map(item => ({
            qty: Number(item.qty) || 0,
            unit_price: Number(item.unit_price) || 0,
            discount: Number(item.discount) || 0
        }));

        return calculatePricingSummary(pricingItems, taxRate, isVatIncluded);
    }, [items, taxRate, isVatIncluded]);


    return (
        <div className="w-80 space-y-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">รวมเป็นเงิน (Subtotal)</span>
                <span className="font-medium text-gray-900 dark:text-white">{summary.beforeTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 dark:text-slate-400 flex items-center gap-2">
                    ภาษีมูลค่าเพิ่ม {taxRate}%
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{summary.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-800 dark:text-slate-200">รวมสุทธิ (Grand Total)</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
};

// ====================================================================================
// MAIN MODAL
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialValues?: Partial<POFormData>;
}

export default function POFormModal({ isOpen, onClose, onSuccess, initialValues }: Props) {
    // -- Vendors --
    const { data: vendorOptions = [] } = useQuery<VendorDropdownItem[]>({
        queryKey: ['vendor-dropdown'],
        queryFn: VendorService.getDropdown,
        enabled: isOpen, // Only fetch when open
        staleTime: 5 * 60 * 1000
    });

    // -- Form --
    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<POFormValues>({
        resolver: zodResolver(poSchema),
        defaultValues: {
            po_date: new Date().toISOString().split('T')[0],
            vendor_id: '',
            items: [],
            payment_term_days: 30,
            tax_rate: 7,
            is_vat_included: false,
            // We use reset() in useEffect to handle initialValues, so no spread here avoids type errors
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    // Reset when opening
    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            reset({
                po_date: initialValues?.po_date ?? new Date().toISOString().split('T')[0],
                vendor_id: initialValues?.vendor_id ?? '',
                items: initialValues?.items ? initialValues.items.map(item => ({
                    ...item,
                    discount: item.discount ?? 0,
                    unit: item.uom_name ?? 'PCS', // Map uom_name to unit if needed, or default
                })) : [],
                payment_term_days: initialValues?.payment_term_days ?? 30,
                tax_rate: initialValues?.tax_rate ?? 7,
                is_vat_included: false,
                delivery_date: initialValues?.delivery_date ?? '',
                remarks: initialValues?.remarks ?? ''
            });
        }
    }, [isOpen, initialValues, reset]);

    const onSubmit: SubmitHandler<POFormValues> = async (data) => {
        try {
            // Recalculate finals for payload (double check)
            // Or trust the backend to calc. Usually backend calcs, but payload might require it.
            // Let's perform simple mapping.
            
            const payloadItems = data.items.map(item => ({
                item_id: item.item_id,
                qty: item.qty,
                unit_price: item.unit_price, // Assuming simple unit price
                discount: item.discount
            }));

            // Calculate totals for consistency in payload if needed by API
            // (Reusing logic from Summary is ideal, but inline here for simplicity)
            const subtotal = data.items.reduce((sum, item) => sum + (item.qty * item.unit_price) - (item.discount || 0), 0);
            const vat = data.is_vat_included 
                ? (subtotal * data.tax_rate) / (100 + data.tax_rate)
                : subtotal * (data.tax_rate / 100);
            const total = data.is_vat_included ? subtotal : subtotal + vat;

            const payload: CreatePOPayload = {
                vendor_id: data.vendor_id,
                order_date: data.po_date,
                delivery_date: data.delivery_date || '',
                payment_term: String(data.payment_term_days),
                remarks: data.remarks,
                items: payloadItems,
                // Optional UI fields if API supports
                subtotal: subtotal,
                tax_amount: vat,
                total_amount: total
            };

            await POService.create(payload);
            window.alert('บันทึกใบสั่งซื้อเรียบร้อยแล้ว');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Create PO Error:', error);
            window.alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    const handleFormSubmit = handleSubmit(onSubmit);

    const handleAddItem = () => {
        append({
            item_id: `new-${Date.now()}`,
            item_code: '',
            item_name: '',
            qty: 1,
            unit_price: 0,
            discount: 0,
            unit: 'PCS'
        });
    };

    if (!isOpen) return null;

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบสั่งซื้อ (Create Purchase Order)"
            titleIcon={<FileText className="text-white" size={20} />}
            headerColor="bg-blue-600"
            footer={
                <div className="p-4 flex justify-end gap-3 items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleFormSubmit}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        บันทึกใบสั่งซื้อ
                    </button>
                </div>
            }
        >
            <form onSubmit={handleFormSubmit} className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
                <div className="p-6 space-y-6">

                        {/* Top Info Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <div className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-slate-700/50 px-4 py-3 border-b border-b-gray-100 dark:border-b-slate-700">
                                <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                                    ใบสั่งซื้อ (PO Header)
                                </h3>
                            </div>
                            
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">ผู้ขาย (Vendor) <span className="text-red-500">*</span></label>
                                    <select 
                                        {...register('vendor_id')}
                                        className="w-full h-10 px-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                    >
                                        <option value="">-- เลือกผู้ขาย --</option>
                                        {vendorOptions.map(v => (
                                            <option key={v.vendor_code} value={v.vendor_code}>{v.vendor_name}</option>
                                        ))}
                                    </select>
                                    {errors.vendor_id && <p className="text-red-500 text-xs mt-1">{errors.vendor_id.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">วันที่เอกสาร (Date) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        {...register('po_date')}
                                        className="w-full h-10 px-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                    />
                                    {errors.po_date && <p className="text-red-500 text-xs mt-1">{errors.po_date.message}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">วันที่ส่งมอบ (Delivery)</label>
                                    <input 
                                        type="date" 
                                        {...register('delivery_date')}
                                        className="w-full h-10 px-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">เครดิต (วัน)</label>
                                    <input 
                                        type="number" 
                                        {...register('payment_term_days', { valueAsNumber: true })}
                                        className="w-full h-10 px-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="col-span-full space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">หมายเหตุ (Remarks)</label>
                                    <textarea 
                                        {...register('remarks')}
                                        rows={2}
                                        className="w-full p-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-900 dark:text-white"
                                        placeholder="ระบุหมายเหตุเพิ่มเติม..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
                            <div className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-slate-700/50 px-4 py-3 border-b border-b-gray-100 dark:border-b-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                                    รายการสินค้า (Line Items)
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                                >
                                    <Plus size={16} />
                                    เพิ่มรายการ
                                </button>
                            </div>

                            <div className="flex-1 p-0 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-200 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-slate-700">
                                            <th className="px-4 py-3 font-semibold w-12 text-center">#</th>
                                            <th className="px-4 py-3 font-semibold">รหัสสินค้า</th>
                                            <th className="px-4 py-3 font-semibold">ชื่อสินค้า</th>
                                            <th className="px-4 py-3 font-semibold w-24 text-right">จำนวน</th>
                                            <th className="px-4 py-3 font-semibold w-24">หน่วย</th>
                                            <th className="px-4 py-3 font-semibold w-32 text-right">ราคา/หน่วย</th>
                                            <th className="px-4 py-3 font-semibold w-24 text-right">ส่วนลด</th>
                                            <th className="px-4 py-3 font-semibold w-32 text-right">รวมเงิน</th>
                                            <th className="px-4 py-3 font-semibold w-12"></th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText size={40} className="text-gray-300" />
                                                        <p>ยังไม่มีรายการสินค้า</p>
                                                        <button type="button" onClick={handleAddItem} className="text-blue-500 hover:underline text-sm">คลิกเพื่อเพิ่มรายการ</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {fields.map((field, index) => (
                                            <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-4 py-2 text-center text-gray-500 dark:text-slate-500 text-sm">{index + 1}</td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        {...register(`items.${index}.item_code`)}
                                                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none py-1 text-sm font-medium text-gray-900 dark:text-white"
                                                        placeholder="Code"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        {...register(`items.${index}.item_name`)}
                                                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none py-1 text-sm text-gray-900 dark:text-white"
                                                        placeholder="Description"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="number"
                                                        step="any"
                                                        {...register(`items.${index}.qty`, { valueAsNumber: true })}
                                                        className="w-full text-right bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        {...register(`items.${index}.unit`)}
                                                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none py-1 text-sm text-center text-gray-900 dark:text-white"
                                                        placeholder="Unit"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="number"
                                                        step="any"
                                                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                                                        className="w-full text-right bg-white dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="number"
                                                        step="any"
                                                        {...register(`items.${index}.discount`, { valueAsNumber: true })}
                                                        className="w-full text-right bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-blue-500 outline-none py-1 text-sm text-gray-500 dark:text-slate-400"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-slate-200">
                                                    {/* Row Total Calc */}
                                                    <WatchRowTotal control={control} index={index} />
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => remove(index)}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Errors for Items Array */}
                            {errors.items && <p className="px-6 pb-2 text-red-500 text-sm">{errors.items.root?.message || errors.items.message}</p>}

                            {/* Footer Summary Area */}
                            <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer select-none">
                                        <input 
                                            type="checkbox"
                                            {...register('is_vat_included')}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700"
                                        />
                                        <span>ราคารวมภาษีแล้ว (VAT Included)</span>
                                    </label>
                                    
                                    {/* Additional info or user ref could go here */}
                                    <div className="text-xs text-gray-400">
                                        Created by: Current User
                                    </div>
                                </div>
                                
                                <POSummary control={control} />
                            </div>
                        </div>

                    </div>
                </form>


        </WindowFormLayout>
    );
}

// Helper to watch individual row total
const WatchRowTotal = ({ control, index }: { control: Control<POFormValues>, index: number }) => {
    const qty = useWatch({ control, name: `items.${index}.qty` }) || 0;
    const price = useWatch({ control, name: `items.${index}.unit_price` }) || 0;
    const discount = useWatch({ control, name: `items.${index}.discount` }) || 0;
    const total = (qty * price) - discount;
    
    return <>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

