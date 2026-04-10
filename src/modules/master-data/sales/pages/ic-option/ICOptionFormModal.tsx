import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogFormLayout } from '@ui';
import { Settings, Save, X } from 'lucide-react';
import { ICOptionService } from './services/ic-option.service';
import { icOptionSchema, type ICOptionFormData } from './types/ic-option.types';
import { PriceLevelNameService } from '@sales-master/pages/price-level-name/services/price-level-name.service';
import { logger } from '@/shared/utils/logger';
import toast from 'react-hot-toast';

interface ICOptionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess: () => void;
}

export default function ICOptionFormModal({ isOpen, onClose, editId, onSuccess }: ICOptionFormModalProps) {
    const isEditMode = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ICOptionFormData>({
        resolver: zodResolver(icOptionSchema),
        defaultValues: {
            branch_id: '',
            aging_expire: '',
            set_price1: 0,
            set_price2: 0,
            set_price3: 0,
            set_price4: 0,
            auto_perpetual_cost: '0',
            barcode_flag: '0',
            check_deficit: '0',
            check_deficit_option: '0',
            check_max_qty: '0',
            check_min_qty: '0',
            check_qty_flag: '0',
            check_standcost: '0',
            expire_alert_flag: '0',
            order_alert_flag: '0',
            post_cost_flag: '0',
            reorder_flag: '0',
            set_autopost: '0',
            set_costcn: '0',
            set_costcn_ap: '0',
            set_costcn_ap_refinv: '0',
            set_costcn_refinv: '0',
            set_cost_return_issueref: '0',
            set_goodqty: '0',
            set_inve: '0',
            set_price: '0',
            set_price_ic: '0',
            set_price_pack: '0',
            set_price_po: '0',
            trasfer_cost_flag: '0',
        }
    });

    const [levelNameMap, setLevelNameMap] = useState<Map<number, string>>(new Map());

    useEffect(() => {
        const fetchPriceLevelNames = async () => {
            try {
                const levelNames = await PriceLevelNameService.getList();
                const nameMap = new Map<number, string>(
                    (Array.isArray(levelNames) ? levelNames : []).map(ln => [Number(ln.level_no), ln.name])
                );
                setLevelNameMap(nameMap);
            } catch (error) {
                logger.error('Failed to fetch price level names:', error);
            }
        };
        if (isOpen) {
            fetchPriceLevelNames();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                // Fetch data
                ICOptionService.getICOptionById(editId).then(data => {
                    if (data) {
                        reset(data);
                    } else {
                        toast.error('ไม่พบข้อมูล Base IC Option');
                        onClose();
                    }
                });
            } else {
                reset(); // Clear form for new entry
            }
        }
    }, [isOpen, isEditMode, editId, reset, onClose]);

    const onSubmit: SubmitHandler<ICOptionFormData> = async (data) => {
        try {
            if (isEditMode && editId) {
                await ICOptionService.updateICOption(editId, data);
                toast.success('แก้ไขข้อมูลสำเร็จ');
            } else {
                await ICOptionService.createICOption(data);
                toast.success('บันทึกข้อมูลสำเร็จ');
            }
            onSuccess();
        } catch (error) {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
            console.error('Submit Error:', error);
        }
    };

    /**
     * Helper to render Select dropdown for '1'/'0' flags
     */
    const renderFlagSelect = (name: keyof ICOptionFormData, label: string) => (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            <select
                {...register(name)}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm ${
                    errors[name] ? 'border-red-500 ring-red-500' : 'border-gray-300'
                }`}
            >
                <option value="0">ปิด (0)</option>
                <option value="1">เปิดใช้งาน (1)</option>
            </select>
        </div>
    );

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
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 font-medium"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'แก้ไขข้อมูล Base IC Option' : 'เพิ่ม Base IC Option'}
            titleIcon={TitleIcon}
            footer={FormFooter}
            width="max-w-6xl"
        >
            <div className="p-6 bg-gray-50/30 dark:bg-gray-900/10">
                    <form id="icOptionForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        
                        {/* ================= SECTION 1: BASIC INFO ================= */}
                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2">ข้อมูลเบื้องต้น</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        รหัสสาขา (Branch ID) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ตัวอย่าง: b9a89c8a..."
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm ${
                                            errors.branch_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        {...register('branch_id')}
                                    />
                                    {errors.branch_id && <p className="text-xs text-red-500">{errors.branch_id.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Aging สินค้ามีอายุ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ตัวอย่าง: 30 วัน"
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm ${
                                            errors.aging_expire ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        {...register('aging_expire')}
                                    />
                                    {errors.aging_expire && <p className="text-xs text-red-500">{errors.aging_expire.message}</p>}
                                </div>
                            </div>
                        </section>

                        {/* ================= SECTION 2: PRICING ================= */}
                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2">ราคาสินค้าเริ่มต้น</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(idx => (
                                    <div key={`set_price${idx}`} className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {levelNameMap.get(idx) 
                                                ? `${idx}. ${levelNameMap.get(idx)} (ระดับ ${idx})`
                                                : `ราคาขายลำดับที่ ${idx}`
                                            }
                                        </label>
                                        <input
                                            type="number"
                                            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm ${
                                                errors[`set_price${idx}` as keyof ICOptionFormData] ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            {...register(`set_price${idx}` as keyof ICOptionFormData, { valueAsNumber: true })}
                                            onFocus={(e) => e.target.select()}
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ================= SECTION 3: CONFIGURATION FLAGS ================= */}
                        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2">การตั้งค่าตัวเลือก (Options/Flags)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                                {renderFlagSelect('auto_perpetual_cost', 'ลงบัญชีต้นทุน Perpetual อัตโนมัติ')}
                                {renderFlagSelect('barcode_flag', 'มีการใช้ Barcode')}
                                {renderFlagSelect('check_deficit', 'ตรวจสอบสินค้าติดลบ')}
                                {renderFlagSelect('check_deficit_option', 'เงื่อนไขตรวจสอบสินค้าติดลบ')}
                                {renderFlagSelect('check_max_qty', 'เตือนยอดคงเหลือสูงสุด')}
                                {renderFlagSelect('check_min_qty', 'เตือนยอดตํ่ากว่าตํ่าสุด')}
                                {renderFlagSelect('check_qty_flag', 'ตรวจสอบความถูกต้องจำนวนสินค้า')}
                                {renderFlagSelect('check_standcost', 'เช็คราคามาตรฐาน')}
                                {renderFlagSelect('expire_alert_flag', 'แจ้งเมื่อสินค้าหมดอายุ')}
                                {renderFlagSelect('order_alert_flag', 'แจ้งเมื่อสินค้าต้องสั่งซื้อ')}
                                {renderFlagSelect('post_cost_flag', 'Post ต้นทุนอัตโนมัติ')}
                                {renderFlagSelect('reorder_flag', 'แจ้งเตือนเมื่อถึงจุดสั่งซื้อ (Reorder)')}
                                {renderFlagSelect('set_autopost', 'โพสต์รายการอัตโนมัติ')}
                                {renderFlagSelect('set_costcn', 'กำหนดต้นทุนลดหนี้')}
                                {renderFlagSelect('set_costcn_ap', 'กำหนดต้นทุนลดหนี้ (ซื้อ)')}
                                {renderFlagSelect('set_costcn_ap_refinv', 'กำหนดต้นทุนลดหนี้ (ซื้อ) อ้างอิงใบกำกับ')}
                                {renderFlagSelect('set_costcn_refinv', 'กำหนดต้นทุนลดหนี้ใบกำกับ')}
                                {renderFlagSelect('set_cost_return_issueref', 'กำหนดต้นทุนรับคืนอ้างอิงใบเบิก')}
                                {renderFlagSelect('set_goodqty', 'กำหนดจำนวนอัตโนมัติ')}
                                {renderFlagSelect('set_inve', 'กำหนดคลังเก็บอัตโนมัติ')}
                                {renderFlagSelect('set_price', 'กำหนดราคาขายระบบ SO')}
                                {renderFlagSelect('set_price_ic', 'กำหนดราคาระบบสินค้า PO')}
                                {renderFlagSelect('set_price_pack', 'ใช้ราคาขายตามแพ็คบรรจุ')}
                                {renderFlagSelect('set_price_po', 'กำหนดราคาระบบสินค้า IC')}
                                {renderFlagSelect('trasfer_cost_flag', 'คำนวณต้นทุนการโอนสินค้า')}
                            </div>
                        </section>

                    </form>
                </div>
        </DialogFormLayout>
    );
}
