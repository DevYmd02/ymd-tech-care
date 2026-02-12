
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Control, Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Search, Package, Coins } from 'lucide-react';
import { WindowFormLayout } from '@/shared/components/layout/WindowFormLayout';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorDropdownItem } from '@/modules/master-data/vendor/types/vendor-types';
import { useQuery } from '@tanstack/react-query';
import { PrtService } from '@/modules/procurement/services/prt.service';
import { prtSchema } from '@/modules/procurement/types/prt/prt-types';
import type { PrtItem, PrtFormValues } from '@/modules/procurement/types/prt/prt-types';
import { PrtItemsTable } from './PrtItemsTable';

// ====================================================================================
// TYPES & MOCKS (Moved to prt-types.ts)
// ====================================================================================

// Mock Constants
const STOCK_EFFECT_OPTIONS = [
    { value: 'Y', label: 'Y - มีผลต่อ Stock' },
    { value: 'N', label: 'N - ไม่มีผลต่อ Stock' }
];

const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Draft' }, // Matches PRTStatus type in prt-types.ts
    { value: 'POSTED', label: 'Posted' },
    { value: 'CANCELLED', label: 'Cancelled' }
];

const PrtSummary = ({ control }: { control: Control<PrtFormValues> }) => {
    const items = useWatch({ control, name: 'items' });
    const taxRate = useWatch({ control, name: 'tax_rate' }) || 7;
    const isVatIncluded = useWatch({ control, name: 'is_vat_included' });
    const currencyId = useWatch({ control, name: 'currency_id' });

    const summary = useMemo(() => {
        const totalItems = items?.length || 0;
        const totalQty = items?.reduce((sum, item) => sum + (Number(item.qty_return) || 0), 0) || 0;
        
        let subtotal = items?.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0) || 0;
        
        // Simple VAT Logic
        const vat = isVatIncluded 
            ? (subtotal * taxRate) / (100 + taxRate)
            : subtotal * (taxRate / 100);
            
        const grandTotal = isVatIncluded ? subtotal : subtotal + vat;
        
        // Adjust subtotal display if VAT included
        if (isVatIncluded) {
            subtotal = subtotal - vat;
        }

        return { totalItems, totalQty, subtotal, vat, grandTotal };
    }, [items, taxRate, isVatIncluded]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto text-sm">
             <div className="space-y-2 text-right">
                <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-gray-600 dark:text-gray-400">จำนวนรายการทั้งหมด:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{summary.totalItems} รายการ</span>
                </div>
                <div className="flex justify-between md:justify-end gap-4">
                    <span className="text-gray-600 dark:text-gray-400">จำนวนคืนรวม:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{summary.totalQty.toLocaleString()}</span>
                </div>
            </div>
            
            <div className="space-y-2 min-w-[200px]">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">ภาษี ({taxRate}%):</span>
                    <div className="flex items-center gap-2">
                        <select className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs rounded px-1 py-0.5 outline-none text-gray-900 dark:text-white">
                            <option>VAT7</option>
                            <option>VAT0</option>
                        </select>
                         <span className="font-medium text-gray-900 dark:text-white">{summary.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencyId || 'THB'}</span>
                    </div>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 dark:border-gray-700">
                     <span className="font-bold text-gray-800 dark:text-gray-200">มูลค่ารวม:</span>
                     <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{summary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencyId || 'THB'}</span>
                </div>
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
    initialValues?: Partial<PrtFormValues>;
}

export default function PRTFormModal({ isOpen, onClose, onSuccess, initialValues }: Props) {
    const { data: vendorOptions = [] } = useQuery<VendorDropdownItem[]>({
        queryKey: ['vendor-dropdown'],
        queryFn: VendorService.getDropdown,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000
    });

    const { data: itemOptions = [] } = useQuery<PrtItem[]>({
        queryKey: ['prt-items'],
        queryFn: PrtService.getItems,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000
    });

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<PrtFormValues>({
        resolver: zodResolver(prtSchema) as Resolver<PrtFormValues>,
        defaultValues: {
            prt_date: new Date().toISOString().split('T')[0],
            vendor_id: '',
            status: 'DRAFT',
            stock_effect: 'Y',
            is_multicurrency: false,
            items: [],
            tax_rate: 7,
            is_vat_included: false,
            reason: '',
            reference_grn_id: '',
            prt_no: '',
            currency_id: 'THB',
            exchange_rate: 1,
            currency_type_id: '',
            rate_date: new Date().toISOString().split('T')[0]
        }
    });



    const isMulticurrency = watch('is_multicurrency');
    const currencyId = watch('currency_id');
    const rateDate = watch('rate_date');
    const [isRateLoading, setIsRateLoading] = useState(false);

    // Exchange Rate Logic
    useEffect(() => {
        const fetchRate = async () => {
            if (!currencyId || !rateDate) return;

            if (currencyId === 'THB') {
                setValue('exchange_rate', 1);
                return;
            }

            setIsRateLoading(true);
            try {
                const rate = await PrtService.getExchangeRate(currencyId, rateDate);
                setValue('exchange_rate', rate);
            } catch (error) {
                console.error('Failed to fetch exchange rate:', error);
            } finally {
                setIsRateLoading(false);
            }
        };

        fetchRate();
    }, [currencyId, rateDate, setValue]);

    useEffect(() => {
        if (isOpen) {
             reset({
                prt_no: initialValues?.prt_no ?? 'PRT2024-xxx',
                prt_date: initialValues?.prt_date ?? new Date().toISOString().split('T')[0],
                vendor_id: initialValues?.vendor_id ?? '',
                status: initialValues?.status ?? 'DRAFT',
                stock_effect: initialValues?.stock_effect ?? 'Y',
                is_multicurrency: initialValues?.is_multicurrency ?? false,
                items: initialValues?.items ?? [
                    { item_id: 'item-1', item_code: 'ITM-001', item_name: 'คอมพิวเตอร์ Notebook Dell Inspiron', qty_return: 2, uom_id: 'PCS', unit_price_ref: 25000, line_total: 50000 }
                ], 
                tax_rate: initialValues?.tax_rate ?? 7,
                is_vat_included: initialValues?.is_vat_included ?? false,
                reason: initialValues?.reason ?? '',
                reference_grn_id: initialValues?.reference_grn_id ?? '',
                currency_id: initialValues?.currency_id ?? 'THB',
                exchange_rate: initialValues?.exchange_rate ?? 1,
                currency_type_id: initialValues?.currency_type_id ?? '',
                rate_date: initialValues?.rate_date ?? new Date().toISOString().split('T')[0]
             });
        }
    }, [isOpen, reset, initialValues]);

    const onSubmit: SubmitHandler<PrtFormValues> = async (data) => {
        console.log('Submit PRT:', data);
        alert('บันทึกใบคืนสินค้าเรียบร้อยแล้ว');
        if (onSuccess) onSuccess();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบคืนสินค้าใหม่ (Create Purchase Return - PRT)" 
            titleIcon={<Package className="text-white" size={20} />}
            headerColor="bg-blue-600"
            footer={
                <div className="p-4 flex justify-end gap-3 items-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Save size={18} />
                        บันทึก
                    </button>
                </div>
            }
        >
            <form className="h-full flex flex-col bg-white dark:bg-gray-900">
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    {/* Header Section */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                                ใบคืนสินค้า (PRT Header)
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">เลขที่ PRT (prt_no) <span className="text-red-500">*</span></label>
                                <input 
                                    {...register('prt_no')}
                                    disabled
                                    className="w-full h-9 px-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 text-sm"
                                    placeholder="PRT2024-xxx"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">วันที่คืน (prt_date) <span className="text-red-500">*</span></label>
                                <input 
                                    type="date"
                                    {...register('prt_date')}
                                    className="w-full h-9 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">ผู้ขาย (vendor_id FK) <span className="text-red-500">*</span></label>
                                <select 
                                    {...register('vendor_id')}
                                    className="w-full h-9 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="">-- เลือกผู้ขาย --</option>
                                    {vendorOptions.map(v => (
                                        <option key={v.vendor_code} value={v.vendor_code}>{v.vendor_name}</option>
                                    ))}
                                </select>
                                {errors.vendor_id && <p className="text-red-500 text-xs mt-1">{errors.vendor_id.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">เลขที่ GRN อ้างอิง (reference_grn_id FK - nullable)</label>
                                <div className="flex gap-2">
                                    <input 
                                        {...register('reference_grn_id')}
                                        className="w-full h-9 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                        placeholder="GRN2024-xxx (ถ้ามี)"
                                    />
                                    <button type="button" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">สถานะ (status)</label>
                                <select 
                                    {...register('status')}
                                    className="w-full h-9 px-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 text-sm"
                                >
                                    {STATUS_OPTIONS.map(opt => ( 
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">มีผลต่อ Stock (stockeffect) <span className="text-red-500">*</span></label>
                                <select 
                                    {...register('stock_effect')}
                                    className="w-full h-9 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm text-gray-900 dark:text-white"
                                >
                                    {STOCK_EFFECT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="col-span-full space-y-1">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">เหตุผลการคืน (reason - nullable)</label>
                                <textarea 
                                    {...register('reason')}
                                    rows={2}
                                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 outline-none text-sm resize-none text-gray-900 dark:text-white"
                                    placeholder="ระบุเหตุผลในการคืนสินค้า เช่น สินค้าชำรุด, สินค้าไม่ตรงตามข้อกำหนด"
                                />
                            </div>
                        </div>

                         <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                             <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer w-fit select-none">
                                <input 
                                    type="checkbox"
                                    {...register('is_multicurrency')}
                                    className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
                                />
                                <span className="font-medium">Multicurrency</span>
                            </label>
                        </div>
                    </div>

                    {/* Multicurrency Section (Middle) - Cloned & Adapted */}
                    {isMulticurrency && (
                         <div className={`p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mb-6`}>
                            <div className="space-y-4">
                                <div className="flex items-center mb-2">
                                     <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Coins size={16} className="text-yellow-500" /> 
                                        ข้อมูลสกุลเงินและอัตราแลกเปลี่ยน (Currency & Rate)
                                     </h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                                        <input 
                                            type="date" 
                                            {...register('rate_date')}
                                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                                        <select 
                                            {...register('currency_id')}
                                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">เลือกสกุลเงิน</option>
                                            <option value="THB">THB - บาท</option>
                                            <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                            <option value="EUR">EUR - ยูโร</option>
                                            <option value="JPY">JPY - เยน</option>
                                            <option value="CNY">CNY - หยวน</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                                        <select 
                                            {...register('currency_type_id')}
                                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">เลือกสกุลเงิน</option>
                                            <option value="THB">THB - บาท</option>
                                            <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                            <option value="EUR">EUR - ยูโร</option>
                                            <option value="JPY">JPY - เยน</option>
                                            <option value="CNY">CNY - หยวน</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน {isRateLoading && <span className="text-blue-500 text-[10px] animate-pulse">(Updating...)</span>}</label>
                                        <input 
                                            type="number"
                                            step="0.0001"
                                            {...register('exchange_rate', { valueAsNumber: true })}
                                            readOnly={watch('currency_id') === 'THB'}
                                            disabled={isRateLoading}
                                            className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${watch('currency_id') === 'THB' || isRateLoading ? 'bg-gray-100 dark:bg-gray-700 italic' : 'bg-white dark:bg-gray-800'}`}
                                        />
                                         {watch('currency_id') && watch('currency_id') !== 'THB' && (
                                           <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right">
                                              1 {watch('currency_id')} ≈ {Number(watch('exchange_rate') || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                                           </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                     <div>
                        <div className="border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 mb-2 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                                รายการสินค้าที่คืน (PRT Line Items)
                            </h3>
                        </div>

                        <PrtItemsTable 
                            control={control}
                            register={register}
                            setValue={setValue}
                            watch={watch}
                            itemOptions={itemOptions}
                        />

                         <div className="mt-4 flex justify-end">
                            <PrtSummary control={control} />
                        </div>
                    </div>

                </div>
            </form>
        </WindowFormLayout>
    );
}


