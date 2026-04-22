import React from 'react';
import { Database, Plus, Trash2, Edit2, X, AlertTriangle, CheckCircle, Package, Calendar, Info, Search, RotateCcw } from 'lucide-react';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { useItemLot } from '@inventory/pages/item-master/hooks/useItemLot';
import { useQuery } from '@tanstack/react-query';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { format } from 'date-fns';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import { type ItemLot, type ItemLotFormData } from '@inventory/types/item-lot-types';






interface ItemLotModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: { id: number; code: string; name: string } | null;
}

export function ItemLotModal({ isOpen, onClose, item }: ItemLotModalProps) {
    // 1. Fetch Item Details to get shelf_life_days
    const { data: itemDetail } = useQuery({
        queryKey: ['item-detail', item?.id],
        queryFn: () => item?.id ? ItemMasterService.getById(item.id) : null,
        enabled: !!item?.id && isOpen,
    });

    // 2. Fetch Vendors for dropdown
    const { data: vendorResponse } = useQuery({
        queryKey: ['vendors-lookup'],
        queryFn: () => VendorService.getList(),
        enabled: isOpen,
    });

    const vendors = React.useMemo(() => vendorResponse?.items || [], [vendorResponse]);
    const shelfLifeDays = itemDetail?.shelf_life_days || 0;

    // 3. Lot Logic Hook
    const { 
        lots, isLoading, summary, 
        drafts, handleAddDraft, handleRemoveDraft, handleDraftInputChange, handleSaveDraft,
        handleSaveAllDrafts, handleRemoveAllDrafts,
        editingLotId, editFormData, handleOpenEditForm, handleCloseEditForm, handleEditInputChange, handleSaveEdit,
        handleDelete, isSaving 
    } = useItemLot(item?.id || 0, shelfLifeDays);

    const [isVendorSearchOpen, setIsVendorSearchOpen] = React.useState(false);
    const [vendorSearchTarget, setVendorSearchTarget] = React.useState<{ type: 'draft' | 'edit', id: number } | null>(null);

    if (!item) return null;

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={`จัดการ Lot Number: ${item.code}`}
            titleIcon={<Database className="w-5 h-5 text-emerald-500" />}
            width="max-w-[1600px]"
        >
            <div className="space-y-6">
                {/* Header Info Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
                    {/* Item Info (Left) */}
                    <div className="md:col-span-5 flex items-center gap-4 border-r border-gray-200/50 dark:border-gray-700/50 pr-6">
                        <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
                            <Package className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Inventory Master</div>
                            <h4 className="font-extrabold text-xl text-gray-900 dark:text-white leading-tight">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">SKU: {item.code}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[11px] text-gray-500 font-medium">Tracking {lots.length} active lots</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Metrics (Right) */}
                    <div className="md:col-span-7 flex items-center justify-between pl-2">
                        <div className="flex gap-2">
                            <SummaryCard label="คงคลัง" value={summary.totalStock} icon={<Package size={14} />} color="blue" />
                            <SummaryCard label="จองแล้ว" value={summary.totalReserved} icon={<Calendar size={14} />} color="amber" />
                            <SummaryCard label="พร้อมใช้" value={summary.totalAvailable} icon={<CheckCircle size={14} />} color="emerald" />
                            <SummaryCard label="เบิกสะสม" value={summary.totalIssued} icon={<RotateCcw size={14} />} color="blue" />
                        </div>
                        {summary.expiredCount > 0 && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 px-4 py-2 rounded-xl text-red-600 dark:text-red-400">
                                <AlertTriangle size={18} className="animate-bounce" />
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase">Expired Lots</div>
                                    <div className="text-lg font-black leading-none">{summary.expiredCount}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lots Table */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Database size={14} />
                            รายการ Lot ทั้งหมด ({lots.length})
                        </h3>
                        <button
                            onClick={handleAddDraft}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                        >
                            <Plus size={14} />
                            เพิ่มรายการ Lot
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[180px]">เลขล็อต (Lot No.)</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[250px]">ผู้ขาย (Supplier)</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px] text-right">คงคลัง</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px] text-right">จองแล้ว</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px] text-right">พร้อมใช้</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[90px] text-right">เบิกสะสม</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">วันที่ผลิต</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[140px]">วันหมดอายุ</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">หมายเหตุ</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px] text-center">สถานะ</th>
                                    <th className="px-4 py-3 text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[100px] text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {/* Inline Add Rows (Drafts) */}
                                {drafts.map((draft) => (
                                    <LotFormRow 
                                        key={draft._tempId}
                                        formData={draft}
                                        isSaving={isSaving}
                                        handleInputChange={(name, val) => handleDraftInputChange(draft._tempId, name, val)}
                                        handleCloseForm={() => handleRemoveDraft(draft._tempId)}
                                        handleSave={() => handleSaveDraft(draft._tempId)}
                                        shelfLifeDays={shelfLifeDays}
                                        setIsVendorSearchOpen={(open) => {
                                            if (open) {
                                                setVendorSearchTarget({ type: 'draft', id: draft._tempId });
                                                setIsVendorSearchOpen(true);
                                            } else {
                                                setIsVendorSearchOpen(false);
                                            }
                                        }}
                                        selectedVendorName={draft.supplier_vendor_id ? vendors.find(v => Number(v.vendor_id) === Number(draft.supplier_vendor_id))?.vendor_name || 'Loading...' : ''}
                                        isNew
                                    />
                                ))}

                                {isLoading ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center text-xs text-gray-500">กำลังโหลดข้อมูล...</td>
                                    </tr>
                                ) : lots.length === 0 && drafts.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <Package size={32} className="opacity-20" />
                                                <span className="text-xs">ยังไม่มีข้อมูล Lot สำหรับสินค้านี้</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    lots.map((lot: ItemLot) => (
                                        editingLotId === lot.lot_id ? (
                                            <LotFormRow 
                                                key={lot.lot_id}
                                                formData={editFormData!}
                                                isSaving={isSaving}
                                                handleInputChange={handleEditInputChange}
                                                handleCloseForm={handleCloseEditForm}
                                                handleSave={handleSaveEdit}
                                                shelfLifeDays={shelfLifeDays}
                                                setIsVendorSearchOpen={(open) => {
                                                    if (open) {
                                                        setVendorSearchTarget({ type: 'edit', id: lot.lot_id });
                                                        setIsVendorSearchOpen(true);
                                                    } else {
                                                        setIsVendorSearchOpen(false);
                                                    }
                                                }}
                                                selectedVendorName={editFormData?.supplier_vendor_id ? vendors.find(v => Number(v.vendor_id) === Number(editFormData.supplier_vendor_id))?.vendor_name || 'Loading...' : ''}
                                            />
                                        ) : (
                                            <tr key={lot.lot_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-900 dark:text-white text-[13px]">{lot.lot_no}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-1" title={lot.supplier_name}>
                                                        {lot.supplier_name || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-[13px] font-medium text-gray-900 dark:text-white">{(lot.qty_stock || 0).toLocaleString()}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-[13px] text-amber-600 dark:text-amber-400">{(lot.qty_reserved || 0).toLocaleString()}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{(lot.qty_available || 0).toLocaleString()}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="text-[13px] text-gray-400">{(lot.qty_issued || 0).toLocaleString()}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-[13px] text-gray-600 dark:text-gray-400">
                                                        {lot.mfg_date ? format(new Date(lot.mfg_date), 'dd/MM/yyyy') : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={`text-[13px] font-medium ${isNearExpiry(lot.expiry_date) ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {lot.expiry_date ? format(new Date(lot.expiry_date), 'dd/MM/yyyy') : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-[12px] text-gray-500 italic line-clamp-1" title={lot.note || ''}>
                                                        {lot.note || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center">
                                                        <StatusBadge status={lot.status} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleOpenEditForm(lot)}
                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(lot.lot_id, lot.lot_no)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Bulk Actions Footer */}
                    {drafts.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={handleRemoveAllDrafts}
                                className="px-4 py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex items-center gap-2"
                            >
                                <X size={14} />
                                ล้างรายการที่ยังไม่บันทึก
                            </button>
                            <button
                                onClick={handleSaveAllDrafts}
                                disabled={isSaving}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <RotateCcw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                บันทึกทั้งหมด ({drafts.length} รายการ)
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Legend or Note */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <Info size={12} />
                    <span>จำนวนสต็อกจะอัปเดตอัตโนมัติผ่านรายการ รับเข้า/เบิกออก ของคลังสินค้า</span>
                </div>
            </div>

            <VendorSearchModal
                isOpen={isVendorSearchOpen}
                onClose={() => setIsVendorSearchOpen(false)}
                onSelect={(vendor: VendorSearchItem) => {
                    if (vendorSearchTarget?.type === 'draft') {
                        handleDraftInputChange(vendorSearchTarget.id, 'supplier_vendor_id', Number(vendor.vendor_id));
                    } else if (vendorSearchTarget?.type === 'edit') {
                        handleEditInputChange('supplier_vendor_id', Number(vendor.vendor_id));
                    }
                    setIsVendorSearchOpen(false);
                }}
            />
        </DialogFormLayout>
    );
}

// ==================== HELPER COMPONENTS ====================


interface LotFormRowProps {
    formData: ItemLotFormData;
    isSaving: boolean;
    handleInputChange: (key: keyof ItemLotFormData, value: string | number | null) => void;
    handleCloseForm: () => void;
    handleSave: () => void;
    shelfLifeDays: number;
    setIsVendorSearchOpen: (isOpen: boolean) => void;
    selectedVendorName: string;
    isNew?: boolean;
}

function LotFormRow({ 
    formData, isSaving, handleInputChange, handleCloseForm, handleSave, 
    shelfLifeDays, setIsVendorSearchOpen, selectedVendorName, isNew 
}: LotFormRowProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus on Lot No when form opens
    React.useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const themeColor = isNew ? 'emerald' : 'blue';
    const bgClass = isNew ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'bg-blue-50/30 dark:bg-blue-900/10';

    return (
        <tr className={`${bgClass} transition-colors`}>
            <td className="px-2 py-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={formData.lot_no}
                    onChange={(e) => handleInputChange('lot_no', e.target.value)}
                    className={`w-full h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`}
                    placeholder="เลขล็อต..."
                />
            </td>
            <td className="px-2 py-2">
                <div className="relative group">
                    <input
                        type="text"
                        readOnly
                        value={selectedVendorName}
                        onClick={() => setIsVendorSearchOpen(true)}
                        placeholder="เลือกผู้ขาย..."
                        className={`w-full h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-2 pr-8 text-[13px] text-gray-900 dark:text-white cursor-pointer hover:border-${themeColor}-400 focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500`}
                    />
                    <button
                        type="button"
                        onClick={() => setIsVendorSearchOpen(true)}
                        className={`absolute right-0 top-0 bottom-0 px-2 text-gray-400 hover:text-${themeColor}-600 transition-colors`}
                    >
                        <Search size={12} />
                    </button>
                </div>
            </td>
            {/* Quantity Columns Merged for Data Entry Row to reduce noise */}
            <td colSpan={4} className="px-2 py-2 text-center bg-gray-50/20 dark:bg-gray-900/10 border-x border-gray-100/50 dark:border-gray-800/50">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium italic">
                    <Database size={10} className="opacity-50" />
                    <span>ระบบคำนวณยอดอัตโนมัติ</span>
                </div>
            </td>
            <td className="px-2 py-2">
                <div className="relative">
                    <CustomDateInput
                        value={formData.mfg_date || ''}
                        onChange={(val) => handleInputChange('mfg_date', val)}
                        className={`w-full h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-[13px] text-gray-900 dark:text-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`}
                    />
                    {shelfLifeDays > 0 && isNew && (
                        <div className="absolute -top-3 right-0 text-[10px] text-emerald-600 font-bold">+{shelfLifeDays}d</div>
                    )}
                </div>
            </td>
            <td className="px-2 py-2">
                <CustomDateInput
                    value={formData.expiry_date || ''}
                    onChange={(val) => handleInputChange('expiry_date', val)}
                    className={`w-full h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-[13px] text-gray-900 dark:text-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`}
                />
            </td>
            <td className="px-2 py-2">
                <input
                    type="text"
                    value={formData.note || ''}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    className={`w-full h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all`}
                    placeholder="หมายเหตุ..."
                />
            </td>
            <td className="px-2 py-2">
                {!isNew ? (
                    <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className={`w-full h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-1 text-[13px] text-gray-900 dark:text-white focus:ring-2 focus:ring-${themeColor}-500 outline-none transition-all text-center`}
                    >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="QUARANTINE">QUARANTINE</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>
                ) : (
                    <div className="text-[12px] text-emerald-600 font-bold px-2 italic text-center flex flex-col leading-tight">
                        <span>ACTIVE</span>
                        <span className="text-[10px] opacity-70">(New)</span>
                    </div>
                )}
            </td>
            <td className="px-2 py-2">
                <div className="flex items-center justify-center gap-1">
                    {!isNew && (
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-all active:scale-95`}
                            title="บันทึก"
                        >
                            <CheckCircle size={14} />
                        </button>
                    )}
                    <button 
                        onClick={handleCloseForm}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title={isNew ? "ลบรายการ" : "ยกเลิก"}
                    >
                        <X size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'blue' | 'amber' | 'emerald' | 'red' }) {
    const colors = {
        blue: 'text-blue-600 bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/30',
        amber: 'text-amber-600 bg-white dark:bg-gray-800 border-amber-100 dark:border-amber-900/30',
        emerald: 'text-emerald-600 bg-white dark:bg-gray-800 border-emerald-100 dark:border-emerald-900/30',
        red: 'text-red-600 bg-white dark:bg-gray-800 border-red-100 dark:border-red-900/30'
    };

    const iconBg = {
        blue: 'bg-blue-50 dark:bg-blue-900/40',
        amber: 'bg-amber-50 dark:bg-amber-900/40',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/40',
        red: 'bg-red-50 dark:bg-red-900/40'
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${colors[color]}`}>
            <div className={`p-2 rounded-xl ${iconBg[color]}`}>
                {icon}
            </div>
            <div>
                <div className="text-[10px] font-bold uppercase tracking-tight opacity-70 leading-none mb-1">
                    {label}
                </div>
                <div className="text-lg font-black leading-none tracking-tight">
                    {value.toLocaleString()}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string; class: string }> = {
        ACTIVE: { label: 'ACTIVE', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
        BLOCKED: { label: 'BLOCKED', class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
        QUARANTINE: { label: 'QUARANTINE', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
        CLOSED: { label: 'CLOSED', class: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400' }
    };

    const config = configs[status] || configs.ACTIVE;
    return (
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${config.class}`}>
            {config.label}
        </span>
    );
}

function isNearExpiry(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const expDate = new Date(dateStr);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expDate <= thirtyDaysFromNow;
}
