import React, { useState, useEffect } from 'react';
import { Tag, X, AlertCircle, CheckCircle, RotateCcw, Search } from 'lucide-react';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { ItemLotService } from '@inventory/services/item-lot.service';
import type { ItemLotFormData, ItemLotStatus } from '@inventory/types/item-lot-types';
import { VendorSearchModal } from '@master-data/vendor/components/selector/VendorSearchModal';
import type { VendorSearchItem } from '@master-data/vendor/types/vendor-types';
import { useQueryClient } from '@tanstack/react-query';

// ====================================================================================
// PROPS
// ====================================================================================

export interface CreateLotModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** item_id ผูกอัตโนมัติจาก Line ที่ active */
    itemId: number;
    /** ชื่อสินค้า เพื่อแสดงใน header */
    itemName?: string;
    /** item_code เพื่อแสดงใน header */
    itemCode?: string;
    /** ค่าเริ่มต้นคลัง (จากตารางหลัก) */
    defaultWarehouseId?: string | number | null;
    /** ค่าเริ่มต้นที่เก็บ (จากตารางหลัก) */
    defaultLocationId?: string | number | null;
    /** callback หลัง create สำเร็จ */
    onCreated?: (lotNo: string) => void;
}

// ====================================================================================
// INITIAL STATE
// ====================================================================================

const getInitialForm = (itemId: number, whId?: string | number | null, locId?: string | number | null): ItemLotFormData => ({
    lot_no: '',
    item_id: itemId,
    supplier_vendor_id: null,
    mfg_date: null,
    expiry_date: null,
    status: 'ACTIVE',
    note: '',
    warehouse_id: whId ? Number(whId) : null,
    location_id: locId ? Number(locId) : null,
});

// ====================================================================================
// COMPONENT
// ====================================================================================

export const CreateLotModal: React.FC<CreateLotModalProps> = ({
    isOpen,
    onClose,
    itemId,
    itemName,
    itemCode,
    defaultWarehouseId,
    defaultLocationId,
    onCreated,
}) => {
    const queryClient = useQueryClient();

    const [form, setForm] = useState<ItemLotFormData>(getInitialForm(itemId, defaultWarehouseId, defaultLocationId));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVendorName, setSelectedVendorName] = useState('');
    const [isVendorSearchOpen, setIsVendorSearchOpen] = useState(false);



    // Reset form when opening or when itemId/defaults change
    useEffect(() => {
        if (isOpen) {
            setForm(getInitialForm(itemId, defaultWarehouseId, defaultLocationId));
            setSelectedVendorName('');
            setError(null);
        }
    }, [isOpen, itemId, defaultWarehouseId, defaultLocationId]);

    const handleChange = <K extends keyof ItemLotFormData>(key: K, value: ItemLotFormData[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleVendorSelect = (vendor: VendorSearchItem) => {
        handleChange('supplier_vendor_id', Number(vendor.vendor_id));
        setSelectedVendorName(vendor.name || '');
        setIsVendorSearchOpen(false);
    };

    const handleClearVendor = () => {
        handleChange('supplier_vendor_id', null);
        setSelectedVendorName('');
    };



    const validate = (): string | null => {
        if (!form.lot_no.trim()) return 'กรุณากรอกเลขล็อต (Lot No.)';
        if (form.lot_no.trim().length < 2) return 'เลขล็อตต้องมีอย่างน้อย 2 ตัวอักษร';
        return null;
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setIsSaving(true);
        try {
            const payload: ItemLotFormData = {
                ...form,
                lot_no: form.lot_no.trim(),
                item_id: itemId,
                mfg_date: form.mfg_date || null,
                expiry_date: form.expiry_date || null,
                note: form.note || null,
            };

            await ItemLotService.upsert(payload);

            // Invalidate lot queries
            await queryClient.invalidateQueries({ queryKey: ['lot-lookup-reservation'] });
            await queryClient.invalidateQueries({ queryKey: ['item-lots', itemId] });

            onCreated?.(payload.lot_no);
            onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง Lot';
            setError(msg);
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass =
        'w-full h-10 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all';
    const labelClass = 'block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5';

    return (
        <>
            <DialogFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title="สร้าง Lot Number ใหม่"
                titleIcon={
                    <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
                        <Tag size={20} className="text-white" />
                    </div>
                }
                width="max-w-[640px]"
                headerColor="bg-emerald-600"
            >
                <div className="space-y-5 p-1">
                    {/* Item Info Banner */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-xl overflow-hidden shadow-sm">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="p-2 bg-purple-600 rounded-lg shrink-0">
                                <Tag size={16} className="text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">ผูกกับสินค้า</div>
                                <div className="font-bold text-gray-900 dark:text-white truncate">
                                    {itemName || `Item ID: ${itemId}`}
                                </div>
                                {itemCode && (
                                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400">SKU: {itemCode}</div>
                                )}
                            </div>
                        </div>


                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClass}>เลขล็อต (Lot No.) <span className="text-red-500 ml-0.5">*</span></label>
                            <input
                                type="text"
                                value={form.lot_no}
                                onChange={(e) => handleChange('lot_no', e.target.value)}
                                placeholder="เช่น LOT-20260424-001"
                                className={inputClass}
                                autoFocus
                            />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>ผู้ขาย (SUPPLIER)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedVendorName}
                                        placeholder="เลือกผู้ขาย..."
                                        onClick={() => setIsVendorSearchOpen(true)}
                                        className={`${inputClass} cursor-pointer w-full pr-8`}
                                    />
                                    {selectedVendorName && (
                                        <button type="button" onClick={handleClearVendor} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={14} /></button>
                                    )}
                                </div>
                                <button type="button" onClick={() => setIsVendorSearchOpen(true)} className="h-10 w-10 bg-purple-600 text-white rounded-lg flex items-center justify-center"><Search size={18} /></button>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>วันที่ผลิต (MFG Date)</label>
                            <CustomDateInput value={form.mfg_date || ''} onChange={(val) => handleChange('mfg_date', val || null)} className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>วันหมดอายุ (EXP Date)</label>
                            <CustomDateInput value={form.expiry_date || ''} onChange={(val) => handleChange('expiry_date', val || null)} className={inputClass} />
                        </div>



                        <div>
                            <label className={labelClass}>สถานะ</label>
                            <select value={form.status} onChange={(e) => handleChange('status', e.target.value as ItemLotStatus)} className={inputClass}>
                                <option value="ACTIVE">ACTIVE — พร้อมใช้งาน</option>
                                <option value="QUARANTINE">QUARANTINE — รอตรวจสอบ</option>
                                <option value="BLOCKED">BLOCKED — ระงับใช้</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>หมายเหตุ (Note)</label>
                            <input type="text" value={form.note || ''} onChange={(e) => handleChange('note', e.target.value)} placeholder="หมายเหตุ..." className={inputClass} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button type="button" onClick={onClose} className="h-10 px-5 bg-white border border-gray-200 rounded-lg text-sm font-bold">ยกเลิก</button>
                        <button type="button" onClick={handleSubmit} disabled={isSaving} className="h-10 px-6 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm">
                            {isSaving ? (
                                <>
                                    <RotateCcw size={16} className="animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    สร้าง Lot
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </DialogFormLayout>

            {/* Vendor Search Sub-modal */}
            <VendorSearchModal
                isOpen={isVendorSearchOpen}
                onClose={() => setIsVendorSearchOpen(false)}
                onSelect={handleVendorSelect}
            />
        </>
    );
};
