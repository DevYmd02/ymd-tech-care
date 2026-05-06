import { useState } from 'react';
import { Save, Plus, Calendar } from 'lucide-react';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { LotNoService } from '@/modules/master-data/inventory/services/inventory-master.service';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@/shared/utils';
import type { LotNoFormData } from '@/modules/master-data/inventory/types/inventory-master.types';

interface LotCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newLot: import('@/modules/master-data/inventory/types/inventory-master.types').LotNo) => void;
    itemId: string | number;
    vendorId?: string | number;
}

export function LotCreateModal({ isOpen, onClose, onSuccess, itemId, vendorId }: LotCreateModalProps) {
    const { toast } = useToast();
    const [lotNo, setLotNo] = useState('');
    const [lotName, setLotName] = useState('');
    const [mfgDate, setMfgDate] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        if (!lotNo) {
            toast('กรุณากรอกเลขล๊อต (Lot No)', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData: LotNoFormData = {
                code: lotNo.trim(),
                nameTh: lotName.trim() || lotNo.trim(),
                nameEn: '',
                mfgDate: mfgDate || undefined,
                expiryDate: expiryDate || undefined,
                supplierVendorId: vendorId,
                itemId: itemId,
                note: note.trim(),
                isActive: true
            };

            const response = await LotNoService.create(formData);
            
            if (response.success && response.data) {
                toast('สร้าง Lot ใหม่เรียบร้อยแล้ว', 'success');
                onSuccess(response.data);
                handleReset();
                onClose();
            } else {
                toast(response.message || 'เกิดข้อผิดพลาดในการสร้าง Lot', 'error');
            }
        } catch (error) {
            logger.error('[LotCreateModal] handleSave error:', error);
            toast('ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setLotNo('');
        setLotName('');
        setMfgDate('');
        setExpiryDate('');
        setNote('');
    };

    const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";
    const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none text-gray-900 dark:text-white";

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างล๊อตสินค้าใหม่ (Quick Create Lot)"
            titleIcon={<div className="bg-violet-500 p-2.5 rounded-xl shadow-lg shadow-violet-500/20 text-white"><Plus size={20} /></div>}
            width="max-w-xl"
            headerColor="bg-violet-600 bg-gradient-to-r from-violet-700 to-violet-500"
        >
            <div className="p-8 bg-white dark:bg-[#1a1c23] space-y-8">
                {/* Header Information (Visual Group) */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Lot Number */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <label className={`${labelClass} md:w-32 md:mb-0`}>
                            เลขล๊อต <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group flex-1">
                            <input 
                                type="text"
                                placeholder="กรอกเลขล๊อต หรือเลข Batch..."
                                value={lotNo}
                                onChange={(e) => setLotNo(e.target.value)}
                                className={`${inputClass} h-12 text-lg font-bold tracking-wider placeholder:font-normal placeholder:tracking-normal placeholder:text-sm`}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Lot Name */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <label className={`${labelClass} md:w-32 md:mb-0`}>
                            ชื่อล๊อต
                        </label>
                        <div className="flex-1">
                            <input 
                                type="text"
                                placeholder="ระบุชื่อเรียก หรือรายละเอียดสั้นๆ (ถ้าไม่ระบุจะใช้เลขล๊อตแทน)"
                                value={lotName}
                                onChange={(e) => setLotName(e.target.value)}
                                className={`${inputClass} h-11 text-sm`}
                            />
                        </div>
                    </div>
                </div>

                {/* Production Info (Boxed Section) */}
                <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-6 border border-gray-100 dark:border-gray-800/50 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Mfg Date */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                                <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Calendar size={16} />
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest">วันที่ผลิต</span>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all shadow-sm [&_input]:h-12 [&_input]:text-sm [&_input]:font-semibold [&_input]:px-4 [&_input]:dark:!bg-gray-900/80 [&_input]:dark:!text-white [&_input]:!bg-white">
                                <CustomDateInput 
                                    value={mfgDate}
                                    onChange={setMfgDate}
                                />
                            </div>
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                                <span className="p-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                    <Calendar size={16} />
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest">วันหมดอายุ</span>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all shadow-sm [&_input]:h-12 [&_input]:text-sm [&_input]:font-semibold [&_input]:px-4 [&_input]:dark:!bg-gray-900/80 [&_input]:dark:!text-white [&_input]:!bg-white">
                                <CustomDateInput 
                                    value={expiryDate}
                                    onChange={setExpiryDate}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="space-y-3">
                    <label className={labelClass}>
                        หมายเหตุเพิ่มเติม <span className="text-gray-400 font-normal text-xs ml-2">(Internal Note)</span>
                    </label>
                    <textarea 
                        placeholder="ระบุหมายเหตุเพื่อบันทึกในระบบคลังสินค้า..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className={`${inputClass} resize-none py-4 text-sm leading-relaxed min-h-[100px]`}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:px-8 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center gap-6 bg-gray-50/50 dark:bg-[#111318] rounded-b-2xl">
                <button 
                    onClick={onClose} 
                    className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-bold text-sm"
                >
                    ยกเลิกการสร้าง
                </button>
                <button 
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="min-w-[200px] px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xl shadow-violet-500/25 active:scale-[0.98] transition-all font-bold text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Save size={20} />
                            <span>บันทึกข้อมูลเข้า Master</span>
                        </>
                    )}
                </button>
            </div>
        </DialogFormLayout>
    );
}
