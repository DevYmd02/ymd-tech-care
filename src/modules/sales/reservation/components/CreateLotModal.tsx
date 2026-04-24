import React, { useState, useEffect } from 'react';
import { Tag, X, AlertCircle, CheckCircle, RotateCcw, Search } from 'lucide-react';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { ItemLotService } from '@inventory/services/item-lot.service';
import type { ItemLotFormData } from '@inventory/types/item-lot-types';
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
    /** callback หลัง create สำเร็จ */
    onCreated?: (lotNo: string) => void;
}

// ====================================================================================
// INITIAL STATE
// ====================================================================================

const getInitialForm = (itemId: number): ItemLotFormData => ({
    lot_no: '',
    item_id: itemId,
    supplier_vendor_id: null,
    mfg_date: null,
    expiry_date: null,
    status: 'ACTIVE',
    note: '',
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
    onCreated,
}) => {
    const queryClient = useQueryClient();

    const [form, setForm] = useState<ItemLotFormData>(getInitialForm(itemId));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVendorName, setSelectedVendorName] = useState('');
    const [isVendorSearchOpen, setIsVendorSearchOpen] = useState(false);

    // Reset form when opening or when itemId changes
    useEffect(() => {
        if (isOpen) {
            setForm(getInitialForm(itemId));
            setSelectedVendorName('');
            setError(null);
        }
    }, [isOpen, itemId]);

    const handleChange = (key: keyof ItemLotFormData, value: string | number | null) => {
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
                // Convert empty strings to null for optional date fields
                mfg_date: form.mfg_date || null,
                expiry_date: form.expiry_date || null,
                note: form.note || null,
            };

            await ItemLotService.upsert(payload);

            // Invalidate lot queries so LotSearchModal refreshes automatically
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
                    <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/40 rounded-xl px-4 py-3">
                        <div className="p-2 bg-purple-600 rounded-lg shrink-0">
                            <Tag size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">ผูกกับสินค้า</div>
                            <div className="font-bold text-gray-900 dark:text-white truncate">
                                {itemName || `Item ID: ${itemId}`}
                            </div>
                            {itemCode && (
                                <div className="text-xs font-mono text-gray-500 dark:text-gray-400">SKU: {itemCode}</div>
                            )}
                        </div>
                        <div className="ml-auto shrink-0 px-2 py-1 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                            ID: {itemId}
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
                        {/* Lot No — required, full width */}
                        <div className="col-span-2">
                            <label className={labelClass}>
                                เลขล็อต (Lot No.) <span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.lot_no}
                                onChange={(e) => handleChange('lot_no', e.target.value)}
                                placeholder="เช่น LOT-20260424-001"
                                className={inputClass}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                            />
                        </div>

                        {/* Supplier */}
                        <div className="col-span-2">
                            <label className={labelClass}>ผู้ขาย (Supplier)</label>
                            <div className="relative flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={selectedVendorName}
                                    placeholder="เลือกผู้ขาย..."
                                    onClick={() => setIsVendorSearchOpen(true)}
                                    className={`${inputClass} cursor-pointer flex-1 pr-8 hover:border-purple-400`}
                                />
                                {selectedVendorName ? (
                                    <button
                                        type="button"
                                        onClick={handleClearVendor}
                                        className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setIsVendorSearchOpen(true)}
                                    className="h-10 w-10 shrink-0 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-500 hover:text-purple-600 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center transition-all"
                                    title="ค้นหาผู้ขาย"
                                >
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>

                        {/* MFG Date */}
                        <div>
                            <label className={labelClass}>วันที่ผลิต (MFG Date)</label>
                            <CustomDateInput
                                value={form.mfg_date || ''}
                                onChange={(val) => handleChange('mfg_date', val || null)}
                                className={inputClass}
                            />
                        </div>

                        {/* Expiry Date */}
                        <div>
                            <label className={labelClass}>วันหมดอายุ (EXP Date)</label>
                            <CustomDateInput
                                value={form.expiry_date || ''}
                                onChange={(val) => handleChange('expiry_date', val || null)}
                                className={inputClass}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className={labelClass}>สถานะ</label>
                            <select
                                value={form.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className={`${inputClass} cursor-pointer`}
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="ACTIVE">ACTIVE — พร้อมใช้งาน</option>
                                <option value="HOLD">HOLD — พักรอ</option>
                            </select>
                        </div>

                        {/* Note */}
                        <div className="col-span-2">
                            <label className={labelClass}>หมายเหตุ (Note)</label>
                            <input
                                type="text"
                                value={form.note || ''}
                                onChange={(e) => handleChange('note', e.target.value)}
                                placeholder="หมายเหตุ..."
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="h-10 px-5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
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
