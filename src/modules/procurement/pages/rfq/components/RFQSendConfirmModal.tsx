/**
 * @file RFQSendConfirmModal.tsx
 * @description Pre-flight Review Modal before sending RFQ to vendors.
 * Features: Zero-Vendor Trap, Pure Read-Only Confirmation.
 * Data is fetched on-open via RFQService.getById() to get vendor list.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, AlertTriangle, Users, Loader2, Mail } from 'lucide-react';
import type { RFQHeader } from '@/modules/procurement/types/rfq-types';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// TYPES
// ====================================================================================

/** Details of a vendor in the response, mapped for UI */
interface VendorDetailDisplay {
    rfq_vendor_id: string;
    vendor_id: string;
    vendor_name: string;
    vendor_code: string;
    email_sent_to: string | null;
    status: string;
    sent_date: string | null;
}

interface RFQSendConfirmModalProps {
    isOpen: boolean;
    rfq: RFQHeader | null;
    onClose: () => void;
    onConfirm: (selectedVendorIds: string[], methods: string[]) => void;
    isLoading?: boolean; // Controlled externally for API call state
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export const RFQSendConfirmModal: React.FC<RFQSendConfirmModalProps> = ({
    isOpen,
    rfq,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    // Local state for vendor data (Read Only)
    const [vendors, setVendors] = useState<VendorDetailDisplay[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Multi-select state
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
    const [selectedMethods, setSelectedMethods] = useState<string[]>(['EMAIL']);

    // Fetch vendor data when modal opens
    useEffect(() => {
        if (!isOpen || !rfq) {
            setVendors([]);
            setFetchError(null);
            setSelectedVendorIds([]);
            setSelectedMethods(['EMAIL']);
            return;
        }

        let cancelled = false;
        const fetchVendors = async () => {
            setIsFetching(true);
            setFetchError(null);
            try {
                // Type-safe fetch using RFQDetailResponse
                const response = await RFQService.getById(rfq.rfq_id);
                if (cancelled) return;

                // Map results to display interface
                const vendorList: VendorDetailDisplay[] = response.vendors.map(v => ({
                    rfq_vendor_id: v.rfq_vendor_id,
                    vendor_id: v.vendor_id,
                    vendor_name: v.vendor_name || '',
                    vendor_code: v.vendor_code || '',
                    email_sent_to: v.email_sent_to,
                    status: v.status,
                    sent_date: v.sent_date
                }));

                setVendors(vendorList);
                
                // Intelligent selection: 
                // 1. All already sent vendors are locked in (checked)
                // 2. All PENDING vendors are pre-selected for this new dispatch
                setSelectedVendorIds(vendorList.map(v => v.vendor_id));
            } catch (err) {
                if (!cancelled) {
                    setFetchError('ไม่สามารถโหลดข้อมูลผู้ขายได้');
                    logger.error('[RFQSendConfirmModal] Fetch error:', err);
                }
            } finally {
                if (!cancelled) setIsFetching(false);
            }
        };

        fetchVendors();
        return () => { cancelled = true; };
    }, [isOpen, rfq]);

    // Checkbox toggles
    const handleToggleVendor = (vendorId: string) => {
        setSelectedVendorIds(prev =>
            prev.includes(vendorId)
                ? prev.filter(id => id !== vendorId)
                : [...prev, vendorId]
        );
    };

    const handleSelectAllVendors = () => {
        const interactiveVendors = vendors.filter(v => v.status === 'PENDING');
        const allInteractiveSelected = interactiveVendors.every(v => selectedVendorIds.includes(v.vendor_id));

        if (allInteractiveSelected) {
            // Uncheck only interactive ones (locked ones stay)
            const lockedIds = vendors.filter(v => v.status !== 'PENDING').map(v => v.vendor_id);
            setSelectedVendorIds(lockedIds);
        } else {
            // Check everything
            setSelectedVendorIds(vendors.map(v => v.vendor_id));
        }
    };

    const handleConfirm = () => {
        // We only want to send/re-send the vendors who are in PENDING status but currently SELECTED
        const newVendorIdsToSend = vendors
            .filter(v => v.status === 'PENDING' && selectedVendorIds.includes(v.vendor_id))
            .map(v => v.vendor_id);
            
        onConfirm(newVendorIdsToSend, selectedMethods);
    };

    const handleToggleMethod = (method: string) => {
        setSelectedMethods(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

    const hasVendors = vendors.length > 0;
    const isEmailMethodSelected = selectedMethods.includes('EMAIL');
    const isPdfMethodSelected = selectedMethods.includes('PDF');

    const isAllSentMode = vendors.length > 0 && vendors.every(v => v.status !== 'PENDING');

    // Validation targets only the newly selected vendors (not the locked ones)
    const newSelectedVendors = vendors.filter(v => v.status === 'PENDING' && selectedVendorIds.includes(v.vendor_id));
    const vendorsMissingEmail = newSelectedVendors.filter(v => !v.email_sent_to);
    const hasEmailError = isEmailMethodSelected && vendorsMissingEmail.length > 0;

    const hasNewSelection = newSelectedVendors.length > 0 && selectedMethods.length > 0;
    const canConfirm = hasNewSelection && !hasEmailError && !isLoading && !isFetching;

    if (!isOpen || !rfq) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop — disabled during loading */}
            <div
                className={`absolute inset-0 ${isLoading ? 'pointer-events-none' : ''}`}
                onClick={isLoading ? undefined : onClose}
            />

            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* ===== HEADER ===== */}
                <div className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                            <Send size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                ตรวจสอบก่อนส่ง RFQ
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {rfq.rfq_no}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ===== BODY ===== */}
                <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
                    {/* Loading skeleton */}
                    {isFetching && (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                            <p className="text-sm text-gray-500">กำลังโหลดข้อมูลผู้ขาย...</p>
                        </div>
                    )}

                    {/* Fetch error */}
                    {fetchError && !isFetching && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300">{fetchError}</p>
                        </div>
                    )}

                    {/* ===== ZERO-VENDOR TRAP ===== */}
                    {!isFetching && !fetchError && !hasVendors && (
                        <div className="py-6">
                            <div className="flex flex-col items-center gap-3 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg">
                                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-amber-800 dark:text-amber-200 mb-1">
                                        ไม่พบรายชื่อผู้ขาย
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        กรุณากลับไปแก้ไข RFQ ใบนี้และเพิ่มผู้ขายก่อนทำการส่ง
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== VENDOR SELECTION LIST ===== */}
                    {!isFetching && !fetchError && hasVendors && (
                        <>
                            {/* Header bar */}
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Users size={16} className="text-gray-500" />
                                    <span>ผู้ขายที่จะส่ง RFQ ({vendors.length} ราย)</span>
                                </div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                                        checked={selectedVendorIds.length === vendors.length && vendors.length > 0}
                                        onChange={handleSelectAllVendors}
                                    />
                                    เลือกทั้งหมด
                                </label>
                            </div>

                            {/* Vendor rows */}
                            <div className="space-y-2">
                                {vendors.map((vendor) => {
                                    const isSelected = selectedVendorIds.includes(vendor.vendor_id);
                                    const isLocked = vendor.status !== 'PENDING';
                                    const missingEmail = !isLocked && isEmailMethodSelected && isSelected && !vendor.email_sent_to;
                                    
                                    return (
                                        <label
                                            key={vendor.vendor_id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                isLocked 
                                                    ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 cursor-default opacity-80' // Locked/Already Sent
                                                    : isSelected 
                                                        ? missingEmail 
                                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800 cursor-pointer' // Selected but missing email error
                                                            : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-800 cursor-pointer' // Selected valid
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer' // Not selected
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                className={`rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-1 self-start ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                                                checked={isSelected}
                                                disabled={isLocked}
                                                onChange={() => !isLocked && handleToggleVendor(vendor.vendor_id)}
                                            />
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-medium truncate transition-colors ${
                                                        isLocked ? 'text-gray-500 dark:text-gray-400' : isSelected && !missingEmail ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100'
                                                    }`}>
                                                        {vendor.vendor_name || vendor.vendor_code || vendor.vendor_id}
                                                    </p>
                                                    {isLocked && (
                                                        <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            ส่งแล้ว
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs mt-1">
                                                    <Mail size={12} className={missingEmail ? 'text-red-500' : 'text-gray-500'} />
                                                    <span className={`truncate ${missingEmail ? 'text-red-500 font-medium' : isLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {vendor.email_sent_to || 'ไม่มีอีเมลในระบบ'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Vendor code badge */}
                                            {vendor.vendor_code && (
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 shadow-sm border ${
                                                    isLocked
                                                        ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800'
                                                        : isSelected && !missingEmail
                                                            ? 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                                            : 'text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-gray-300/50 dark:border-gray-600'
                                                }`}>
                                                    {vendor.vendor_code}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>

                            {/* ===== DISPATCH METHODS ===== */}
                            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    <Send size={16} className="text-gray-500" />
                                    <span>ช่องทางการส่ง (Dispatch Methods)</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isEmailMethodSelected 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-800' 
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}>
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                            checked={isEmailMethodSelected}
                                            onChange={() => handleToggleMethod('EMAIL')}
                                        />
                                        <div className="flex flex-col">
                                            <span className={`font-medium text-sm ${isEmailMethodSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-700 dark:text-gray-300'}`}>ส่งอีเมล (Email)</span>
                                            <span className="text-xs text-gray-500">ส่งลิงก์เพื่อให้ผู้ขายเสนอราคาออนไลน์</span>
                                        </div>
                                    </label>
                                    
                                    <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        isPdfMethodSelected 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-800' 
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}>
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                            checked={isPdfMethodSelected}
                                            onChange={() => handleToggleMethod('PDF')}
                                        />
                                        <div className="flex flex-col">
                                            <span className={`font-medium text-sm ${isPdfMethodSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-700 dark:text-gray-300'}`}>พิมพ์เอกสาร (PDF)</span>
                                            <span className="text-xs text-gray-500">สร้างเอกสาร PDF สำหรับพิมพ์/ดาวน์โหลด</span>
                                        </div>
                                    </label>
                                </div>
                                
                                {selectedMethods.length === 0 && (
                                    <p className="text-xs text-red-500 mt-2 font-medium">กรุณาเลือกช่องทางการส่งอย่างน้อย 1 วิธี</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-auto">
                        {isPdfMethodSelected && selectedVendorIds.length > 0 && (
                            <button
                                type="button"
                                disabled={isLoading}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors whitespace-nowrap"
                            >
                                Print Preview
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors flex-1 sm:flex-none ${
                                isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!canConfirm}
                            className={`px-5 py-2 rounded-lg text-white font-bold shadow-sm transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap ${
                                canConfirm
                                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Send size={14} />
                            {isLoading
                                ? 'กำลังประมวลผล...'
                                : isAllSentMode 
                                    ? 'ส่งแล้ว (ครบกำหนด)'
                                    : `ยืนยันการดำเนินการ (${newSelectedVendors.length})`
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
