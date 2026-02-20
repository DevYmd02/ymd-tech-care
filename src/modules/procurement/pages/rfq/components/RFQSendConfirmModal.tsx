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

// ====================================================================================
// TYPES
// ====================================================================================

/** Vendor data returned from detail API (embedded in response) */
interface VendorDetail {
    rfq_vendor_id: string;
    vendor_id: string;
    vendor_name?: string;
    vendor_code?: string;
    email_sent_to: string | null;
    status: string;
}

interface RFQSendConfirmModalProps {
    isOpen: boolean;
    rfq: RFQHeader | null;
    onClose: () => void;
    onConfirm: (selectedVendorIds: string[]) => void;
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
    const [vendors, setVendors] = useState<VendorDetail[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch vendor data when modal opens
    useEffect(() => {
        if (!isOpen || !rfq) {
            setVendors([]);
            setFetchError(null);
            return;
        }

        let cancelled = false;
        const fetchVendors = async () => {
            setIsFetching(true);
            setFetchError(null);
            try {
                const detail = await RFQService.getById(rfq.rfq_id);
                if (cancelled) return;

                // The detail response now includes vendors[] from mock handler
                const vendorList: VendorDetail[] = (detail as unknown as { vendors?: VendorDetail[] }).vendors || [];
                setVendors(vendorList);
            } catch (err) {
                if (!cancelled) {
                    setFetchError('ไม่สามารถโหลดข้อมูลผู้ขายได้');
                    console.error('[RFQSendConfirmModal] Fetch error:', err);
                }
            } finally {
                if (!cancelled) setIsFetching(false);
            }
        };

        fetchVendors();
        return () => { cancelled = true; };
    }, [isOpen, rfq]);

    const hasVendors = vendors.length > 0;
    const canConfirm = hasVendors && !isLoading && !isFetching;

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

                    {/* ===== VENDOR READ ONLY LIST ===== */}
                    {!isFetching && !fetchError && hasVendors && (
                        <>
                            {/* Header bar */}
                            <div className="flex items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Users size={16} className="text-gray-500" />
                                    <span>ผู้ขายที่จะส่ง RFQ ({vendors.length} ราย)</span>
                                </div>
                            </div>

                            {/* Vendor rows */}
                            <div className="space-y-2">
                                {vendors.map((vendor) => (
                                    <div
                                        key={vendor.vendor_id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 transition-colors"
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {vendor.vendor_name || vendor.vendor_code || vendor.vendor_id}
                                            </p>
                                            {vendor.email_sent_to && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <Mail size={12} />
                                                    <span className="truncate">{vendor.email_sent_to}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Vendor code badge */}
                                        {vendor.vendor_code && (
                                            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full shrink-0 shadow-sm border border-gray-300/50 dark:border-gray-600">
                                                {vendor.vendor_code}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(vendors.map(v => v.vendor_id))}
                        disabled={!canConfirm}
                        className={`px-5 py-2 rounded-lg text-white font-bold shadow-sm transition-all flex items-center gap-2 ${
                            canConfirm
                                ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Send size={14} />
                        {isLoading
                            ? 'กำลังส่ง...'
                            : `ยืนยันการส่ง (${vendors.length} ราย)`
                        }
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
