import { useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch, type UseFormWatch, type UseFormSetValue, type UseFormRegister, type FieldErrors, type FieldValues, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogFormLayout } from '@ui';
import { Settings, Save, X, PlusCircle, AlertCircle, Package, Database, Info } from 'lucide-react';
import { ICOptionService } from './services/ic-option.service';
import { icOptionSchema, type ICOptionFormData } from './types/ic-option.types';
import { BranchService } from '@company/services/branch.service';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { logger } from '@/shared/utils/logger';

interface ICOptionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess: () => void;
}

// ==========================================
// CONSTANTS
// ==========================================

const IC_OPTION_FLAG_KEYS: (keyof ICOptionFormData)[] = [
    'auto_perpetual_cost', 'barcode_flag', 'check_deficit', 'check_deficit_option',
    'check_max_qty', 'check_min_qty', 'check_qty_flag', 'check_standcost',
    'expire_alert_flag', 'order_alert_flag', 'post_cost_flag', 'reorder_flag',
    'set_autopost', 'set_costcn', 'set_costcn_ap', 'set_costcn_ap_refinv',
    'set_costcn_refinv', 'set_cost_return_issueref', 'set_goodqty', 'set_inve',
    'set_price', 'set_price_ic', 'set_price_pack', 'set_price_po', 'trasfer_cost_flag'
];


interface FlagToggleFieldProps {
    name: keyof ICOptionFormData;
    label: string;
    watch: UseFormWatch<ICOptionFormData>;
    setValue: UseFormSetValue<ICOptionFormData>;
}

const FlagToggleField = ({ name, label, watch, setValue }: FlagToggleFieldProps) => {
    const value = watch(name);
    const isActive = value === 'Y';

    const toggle = () => {
        setValue(name, isActive ? 'N' : 'Y', { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                {label}
            </label>
            <button
                type="button"
                onClick={toggle}
                className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all duration-200 border ${
                    isActive 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                }`}
            >
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                {isActive ? 'เปิดใช้งาน' : 'ปิด'}
            </button>
        </div>
    );
};

interface PriceSourceFieldProps {
    name: keyof ICOptionFormData;
    label: string;
    register: UseFormRegister<ICOptionFormData>;
    errors: FieldErrors<ICOptionFormData>;
    options: { id: number; name: string }[];
}

const PriceSourceField = ({ name, label, register, errors, options }: PriceSourceFieldProps) => (
    <div className="space-y-1">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {label}
        </label>
        <select
            {...register(name, { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm ${
                errors[name] ? 'border-red-500' : 'border-gray-300'
            }`}
        >
            {options.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
        </select>
    </div>
);

export default function ICOptionFormModal({ isOpen, onClose, editId, onSuccess }: ICOptionFormModalProps) {
    const isEditMode = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<ICOptionFormData>({
        resolver: zodResolver(icOptionSchema) as Resolver<ICOptionFormData>,
        mode: 'onChange',
        defaultValues: {
            branch_id: 0,
            aging_expire: '',
            set_price1: 0,
            set_price2: 0,
            set_price3: 0,
            set_price4: 0,
            auto_perpetual_cost: 'N',
            barcode_flag: 'N',
            check_deficit: 'N',
            check_deficit_option: 'N',
            check_max_qty: 'N',
            check_min_qty: 'N',
            check_qty_flag: 'N',
            check_standcost: 'N',
            expire_alert_flag: 'N',
            order_alert_flag: 'N',
            post_cost_flag: 'N',
            reorder_flag: 'N',
            set_autopost: 'N',
            set_costcn: 'N',
            set_costcn_ap: 'N',
            set_costcn_ap_refinv: 'N',
            set_costcn_refinv: 'N',
            set_cost_return_issueref: 'N',
            set_goodqty: 'N',
            set_inve: 'N',
            set_price: 'N',
            set_price_ic: 'N',
            set_price_pack: 'N',
            set_price_po: 'N',
            trasfer_cost_flag: 'N',
        }
    });
 
    const watchedBranchId = useWatch({
        control,
        name: 'branch_id'
    });

    // Fetch Branches for selection
    const { data: branchesData } = useQuery({
        queryKey: ['org-branches-lookup'],
        queryFn: () => BranchService.getList({ page: 1, limit: 1000 }),
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                ICOptionService.getICOptionById(editId).then(data => {
                    if (data) {
                        // Normalize flags: convert null/undefined to 'N'
                        const normalizedData = { ...data };
                        
                        IC_OPTION_FLAG_KEYS.forEach(key => {
                            // The schema now handles 0/1 to 'Y'/'N' conversion via preprocess
                            (normalizedData as Record<string, unknown>)[key] = data[key];
                        });
                        
                        reset(normalizedData);
                    } else {
                        toast.error('ไม่พบข้อมูล Base IC Option');
                        onClose();
                    }
                });
            } else {
                reset();
            }
        }
    }, [isOpen, isEditMode, editId, reset, onClose]);
 
    const onSubmit: SubmitHandler<FieldValues> = useCallback(async (formData) => {
        const data = formData as ICOptionFormData;
        try {
            // WHITELIST APPROACH: Only send fields that exist in the database table
            // This prevents "400 Bad Request" caused by extra virtual or metadata fields
            const payload: Record<string, unknown> = {
                branch_id: Number(data.branch_id),
                aging_expire: String(data.aging_expire),
                set_price1: Number(data.set_price1 || 0),
                set_price2: Number(data.set_price2 || 0),
                set_price3: Number(data.set_price3 || 0),
                set_price4: Number(data.set_price4 || 0),
            };

            // Add all 25 flags
            IC_OPTION_FLAG_KEYS.forEach(key => {
                payload[key] = data[key];
            });

            if (isEditMode && editId) {
                // For updates, we send the payload without the ID in the body
                // as it's already in the URL: /inventory-option/:id
                await ICOptionService.updateICOption(editId, payload);
                toast.success('บันทึกการตั้งค่าสำเร็จ');
            } else {
                // For creation, we include everything
                await ICOptionService.createICOption(payload as ICOptionFormData);
                toast.success('บันทึกข้อมูลสำเร็จ');
            }
            onSuccess();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            logger.error('Submit Error:', error);
        }
    }, [isEditMode, editId, onSuccess]);

    /**
     * WINSPEED Price Source Options
     */
    const priceSourceOptions = useMemo(() => {
        return [
            { id: 0, name: 'ไม่มีการกำหนด' },
            { id: 1, name: 'ราคาสินค้า Price List' },
            { id: 2, name: 'ราคาสินค้า Price Level' },
            { id: 3, name: 'ราคา Promotion' },
            { id: 4, name: 'ราคาตามระยะเวลาเครดิต' },
            { id: 5, name: 'ราคาขายหลังสุด' },
            { id: 6, name: 'ราคาขายหลังสุดตามลูกค้า' },
        ];
    }, []);

    const TitleIcon = <Settings size={24} className="text-indigo-600" />;

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
                type="submit"
                form="icOptionForm"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 font-semibold"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'ตั้งค่าโมดูลสินค้าคงคลัง (IC Option Settings)' : 'เพิ่มการตั้งค่า IC Option'}
            titleIcon={TitleIcon}
            footer={FormFooter}
            width="max-w-6xl"
        >
            <div className="p-6 bg-gray-50/30 dark:bg-gray-900/10">


                <form id="icOptionForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* ข้อมูลพื้นฐาน */}
                        <section className="lg:col-span-1 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400 border-b pb-2">
                                <Info size={20} />
                                <h3 className="font-semibold">ข้อมูลสาขาและการใช้งาน</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    {isEditMode && <input type="hidden" {...register('branch_id')} />}
                                    <select
                                        disabled={isEditMode}
                                        value={watchedBranchId}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm sm:text-sm ${
                                            isEditMode 
                                                ? 'bg-gray-100 dark:bg-gray-900/50 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed' 
                                                : 'bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500'
                                        } ${errors.branch_id ? 'border-red-500' : 'border-gray-300'}`}
                                        {...(!isEditMode ? register('branch_id') : {})}
                                    >
                                        <option value={0}>-- เลือกสาขา --</option>
                                        {branchesData?.items?.map((branch, index) => (
                                            <option key={branch.branch_id || branch.id || `br-${index}`} value={String(branch.branch_id)}>
                                                {branch.branch_code} - {branch.branch_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.branch_id && <p className="text-red-500 text-xs mt-1">{errors.branch_id.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        ระยะเวลา Aging สินค้า <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ตัวอย่าง: 30 วัน"
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm ${
                                            errors.aging_expire ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        {...register('aging_expire')}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* ลำดับที่มาของราคาขาย */}
                        <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 border-b pb-2">
                                <Database size={20} />
                                <h3 className="font-semibold">ลำดับที่มาของราคาขาย (Selling Price Priority)</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <PriceSourceField name="set_price1" label="ลำดับราคาที่ 1" register={register} errors={errors} options={priceSourceOptions} />
                                <PriceSourceField name="set_price2" label="ลำดับราคาที่ 2" register={register} errors={errors} options={priceSourceOptions} />
                                <PriceSourceField name="set_price3" label="ลำดับราคาที่ 3" register={register} errors={errors} options={priceSourceOptions} />
                                <PriceSourceField name="set_price4" label="ลำดับราคาที่ 4" register={register} errors={errors} options={priceSourceOptions} />
                            </div>
                            <p className="mt-4 text-xs text-gray-400 italic">
                                * ระบบจะดึงราคาตามลำดับ 1-4 หากลำดับก่อนหน้าไม่มีข้อมูลราคา จะข้ามไปดึงลำดับถัดไปให้อัตโนมัติ
                            </p>
                        </section>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* บัญชีและต้นทุน */}
                        <section className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b pb-3">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Package size={18} /></div>
                                บัญชีและต้นทุน (Account & Costing)
                            </h3>
                            <div className="grid grid-cols-1 gap-2.5">
                                <FlagToggleField name="auto_perpetual_cost" label="ลงบัญชีต้นทุน Perpetual อัตโนมัติ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="post_cost_flag" label="Post ต้นทุนอัตโนมัติ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_autopost" label="โพสต์รายการอัตโนมัติ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="trasfer_cost_flag" label="คำนวณต้นทุนการโอนสินค้า" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_cost_return_issueref" label="กำหนดต้นทุนรับคืนอ้างอิงใบเบิก" watch={watch} setValue={setValue} />
                            </div>
                        </section>

                        {/* การควบคุมสต็อก */}
                        <section className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b pb-3">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><Settings size={18} /></div>
                                การควบคุมสินค้า (Stock Control)
                            </h3>
                            <div className="grid grid-cols-1 gap-2.5">
                                <FlagToggleField name="barcode_flag" label="มีการใช้ Barcode" watch={watch} setValue={setValue} />
                                <FlagToggleField name="check_deficit" label="ตรวจสอบสินค้าติดลบ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="check_deficit_option" label="เงื่อนไขตรวจสอบสินค้าติดลบ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="check_max_qty" label="เตือนยอดคงเหลือสูงสุด" watch={watch} setValue={setValue} />
                                <FlagToggleField name="check_min_qty" label="เตือนยอดตํ่ากว่าตํ่าสุด" watch={watch} setValue={setValue} />
                                <FlagToggleField name="check_qty_flag" label="ตรวจสอบความถูกต้องจำนวนสินค้า" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_goodqty" label="กำหนดจำนวนอัตโนมัติ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_inve" label="กำหนดคลังเก็บอัตโนมัติ" watch={watch} setValue={setValue} />
                            </div>
                        </section>

                        {/* ระบบขายและราคา */}
                        <section className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b pb-3">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg"><PlusCircle size={18} /></div>
                                ระบบขายและราคา (Sales & Pricing)
                            </h3>
                            <div className="grid grid-cols-1 gap-2.5">
                                <FlagToggleField name="set_price" label="กำหนดราคาขายระบบ SO" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_price_ic" label="กำหนดราคาระบบสินค้า PO" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_price_po" label="กำหนดราคาระบบสินค้า IC" watch={watch} setValue={setValue} />
                                <FlagToggleField name="set_price_pack" label="ใช้ราคาขายตามแพ็คบรรจุ" watch={watch} setValue={setValue} />
                                <FlagToggleField name="check_standcost" label="เช็คราคามาตรฐาน" watch={watch} setValue={setValue} />
                            </div>
                        </section>

                        {/* ใบลดหนี้และการแจ้งเตือน */}
                        <section className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2 border-b pb-3">
                                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg"><AlertCircle size={18} /></div>
                                ใบลดหนี้และการแจ้งเตือน (CN & Alerts)
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                    <FlagToggleField name="set_costcn" label="กำหนดต้นทุนลดหนี้" watch={watch} setValue={setValue} />
                                    <FlagToggleField name="set_costcn_refinv" label="ต้นทุนลดหนี้ตามใบกำกับ" watch={watch} setValue={setValue} />
                                    <FlagToggleField name="set_costcn_ap" label="ต้นทุนลดหนี้ (ซื้อ)" watch={watch} setValue={setValue} />
                                    <FlagToggleField name="set_costcn_ap_refinv" label="ต้นทุนลดหนี้ (ซื้อ) อ้างใบกำกับ" watch={watch} setValue={setValue} />
                                </div>
                                <div className="pt-3 border-t dark:border-gray-700 grid grid-cols-1 gap-2">
                                    <FlagToggleField name="expire_alert_flag" label="แจ้งเมื่อสินค้าหมดอายุ" watch={watch} setValue={setValue} />
                                    <FlagToggleField name="order_alert_flag" label="แจ้งเมื่อต้องสั่งซื้อ" watch={watch} setValue={setValue} />
                                    <FlagToggleField name="reorder_flag" label="แจ้งเตือนจุดสั่งซื้อ (Reorder)" watch={watch} setValue={setValue} />
                                </div>
                            </div>
                        </section>
                    </div>
                </form>
            </div>
        </DialogFormLayout>
    );
}
