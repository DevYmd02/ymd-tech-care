/**
 * @file RFQSendConfirmModal.tsx
 * @description Pre-flight Review Modal before sending RFQ to vendors.
 * Layout (top → bottom):
 *   1. Modal Header
 *   2. Sleek Email Dispatch pill-toggle bar
 *   3. Smart Vendor Cards (checkbox + info + badge + print | inline animated email accordion)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Send, AlertTriangle, Users, Loader2, Mail, Printer } from 'lucide-react';
import type { RFQHeader } from '@/modules/procurement/types';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { logger } from '@/shared/utils/logger';
import { MultiEmailInput } from '@/shared/components/ui/inputs/MultiEmailInput';

// ====================================================================================
// TYPES
// ====================================================================================

interface VendorDetailDisplay {
    rfq_vendor_id: string;
    vendor_id: string;
    vendor_name: string;
    vendor_code: string;
    email_sent_to: string | null;
    status: string;
    sent_date: string | null;
}

export interface VendorEmailConfig {
    to: string[];
    cc: string[];
    sendEmail: boolean;
}

interface RFQSendConfirmModalProps {
    isOpen: boolean;
    rfq: RFQHeader | null;
    onClose: () => void;
    onConfirm: (
        selectedVendorIds: string[],
        methods: string[],
        emailConfig: Record<string, VendorEmailConfig>
    ) => void;
    isLoading?: boolean;
}

// ====================================================================================
// SUB-COMPONENT: VendorSmartCard
// Unified card: header (checkbox + info + badge + print) + inline animated email body
// ====================================================================================

interface VendorSmartCardProps {
    vendor: VendorDetailDisplay;
    isSelected: boolean;
    isLocked: boolean;
    emailConfig: VendorEmailConfig;
    onToggle: () => void;
    onEmailToggle: (checked: boolean) => void;
    onEmailConfigChange: (config: VendorEmailConfig) => void;
    onPrintPreview: (e: React.MouseEvent) => void;
}

const VendorSmartCard: React.FC<VendorSmartCardProps> = ({
    vendor,
    isSelected,
    isLocked,
    emailConfig,
    onToggle,
    onEmailToggle,
    onEmailConfigChange,
    onPrintPreview,
}) => {
    // Outer accordion: expands if vendor is selected & not locked
    const isExpanded = isSelected && !isLocked;
    // Inner accordion: expands if email toggle is ON
    const showEmailInputs = emailConfig.sendEmail;
    const hasMissingTo = emailConfig.sendEmail && emailConfig.to.length === 0;

    const handleToChange = useCallback(
        (emails: string[]) => onEmailConfigChange({ ...emailConfig, to: emails }),
        [emailConfig, onEmailConfigChange]
    );
    const handleCcChange = useCallback(
        (emails: string[]) => onEmailConfigChange({ ...emailConfig, cc: emails }),
        [emailConfig, onEmailConfigChange]
    );

    return (
        <div className={`rounded-lg border overflow-hidden transition-colors ${
            isLocked
                ? 'border-gray-200 dark:border-gray-700 opacity-75'
                : hasMissingTo
                    ? 'border-red-300 dark:border-red-700'
                    : isSelected
                        ? 'border-emerald-300 dark:border-emerald-700'
                        : 'border-gray-200 dark:border-gray-700'
        }`}>

            {/* ===== CARD HEADER ===== */}
            <div className={`flex items-center justify-between gap-3 px-3.5 py-3 transition-colors ${
                isLocked
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : isSelected
                        ? hasMissingTo
                            ? 'bg-red-50 dark:bg-red-900/10'
                            : 'bg-emerald-50 dark:bg-emerald-900/10'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40'
            }`}>

                {/* Left: Checkbox + Vendor Info */}
                <label className={`flex items-center gap-3 min-w-0 flex-1 ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input
                        type="checkbox"
                        className={`rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0 ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={onToggle}
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-semibold text-sm truncate ${
                                isLocked
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : isSelected && !hasMissingTo
                                        ? 'text-emerald-900 dark:text-emerald-100'
                                        : 'text-gray-900 dark:text-gray-100'
                            }`}>
                                {vendor.vendor_name || vendor.vendor_code || vendor.vendor_id}
                            </span>
                            {isLocked && (
                                <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                                    ส่งแล้ว
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Mail size={11} className={hasMissingTo ? 'text-red-400' : 'text-gray-400'} />
                            <span className={`text-xs truncate max-w-[220px] ${
                                hasMissingTo
                                    ? 'text-red-500 dark:text-red-400 font-medium'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {vendor.email_sent_to || 'ไม่มีอีเมลในระบบ'}
                            </span>
                        </div>
                    </div>
                </label>

                {/* Right: Badge + Print Button (always clickable) */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {hasMissingTo && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold whitespace-nowrap hidden sm:inline">
                            ต้องระบุ To
                        </span>
                    )}
                    {vendor.vendor_code && (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                            isLocked
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                                : isSelected && !hasMissingTo
                                    ? 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                        }`}>
                            {vendor.vendor_code}
                        </span>
                    )}
                    {/* Print Preview — always clickable, regardless of accordion state */}
                    <button
                        type="button"
                        onClick={onPrintPreview}
                        className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        title="ดูตัวอย่างเอกสาร (Print Preview)"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ===== CARD BODY: Nested CSS Grid slide-down ===== */}
            <div className={`grid transition-all duration-300 ease-in-out ${
                isExpanded
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}>
                <div className="overflow-hidden">
                    <div className="p-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 space-y-3">
                        
                        {/* 1. The Per-Vendor Email Toggle Row */}
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 shadow-sm">
                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                                <Mail size={16} className={emailConfig.sendEmail ? 'text-indigo-500' : 'text-gray-400'} />
                                <span className="text-sm font-medium">ส่งเอกสารผ่านอีเมล</span>
                            </div>
                            <input
                                type="checkbox"
                                className="w-4.5 h-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={emailConfig.sendEmail}
                                onChange={(e) => onEmailToggle(e.target.checked)}
                            />
                        </div>

                        {/* 2. Inner Accordion: Email Inputs (Visible if Toggle is ON) */}
                        <div className={`grid transition-all duration-300 ease-in-out ${
                            showEmailInputs
                                ? 'grid-rows-[1fr] opacity-100 mt-3'
                                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                        }`}>
                            <div className="overflow-hidden">
                                <div className="space-y-3 pt-1">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider uppercase">
                                            To (ถึง) <span className="text-red-400">*</span>
                                        </label>
                                        <MultiEmailInput
                                            value={emailConfig.to}
                                            onChange={handleToChange}
                                            placeholder="ระบุอีเมลผู้รับหลัก"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider uppercase">
                                            Cc (สำเนา)
                                        </label>
                                        <MultiEmailInput
                                            value={emailConfig.cc}
                                            onChange={handleCcChange}
                                            placeholder="ระบุอีเมล Cc (ถ้ามี)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export const RFQSendConfirmModal: React.FC<RFQSendConfirmModalProps> = ({
    isOpen,
    rfq,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    const [vendors, setVendors] = useState<VendorDetailDisplay[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
    const [emailConfig, setEmailConfig] = useState<Record<string, VendorEmailConfig>>({});

    useEffect(() => {
        if (!isOpen || !rfq) {
            setVendors([]);
            setFetchError(null);
            setSelectedVendorIds([]);
            setEmailConfig({});
            return;
        }

        let cancelled = false;
        const fetchVendors = async () => {
            setIsFetching(true);
            setFetchError(null);
            try {
                const response = await RFQService.getById(rfq.rfq_id);
                if (cancelled) return;

                const vendorList: VendorDetailDisplay[] = response.vendors.map(v => ({
                    rfq_vendor_id: v.rfq_vendor_id,
                    vendor_id: v.vendor_id,
                    vendor_name: v.vendor_name || '',
                    vendor_code: v.vendor_code || '',
                    email_sent_to: v.email_sent_to,
                    status: v.status,
                    sent_date: v.sent_date,
                }));

                setVendors(vendorList);
                // Clean initial state — no vendors pre-selected; user must consciously choose

                // Pre-fill To from vendor email, safe null guard
                const initialConfig: Record<string, VendorEmailConfig> = {};
                vendorList.forEach(v => {
                    const safeEmail = v.email_sent_to?.trim() ?? '';
                    initialConfig[v.vendor_id] = { 
                        to: safeEmail ? [safeEmail] : [], 
                        cc: [], 
                        sendEmail: false 
                    };
                });
                setEmailConfig(initialConfig);
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

    const handleToggleVendor = useCallback((vendorId: string) => {
        setSelectedVendorIds(prev =>
            prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
        );
    }, []);

    const handleSelectAllVendors = () => {
        const interactive = vendors.filter(v => v.status === 'PENDING');
        const allSelected = interactive.every(v => selectedVendorIds.includes(v.vendor_id));
        if (allSelected) {
            setSelectedVendorIds(vendors.filter(v => v.status !== 'PENDING').map(v => v.vendor_id));
        } else {
            setSelectedVendorIds(vendors.map(v => v.vendor_id));
        }
    };

    const handleEmailConfigChange = useCallback((vendorId: string, config: VendorEmailConfig) => {
        setEmailConfig(prev => ({ ...prev, [vendorId]: config }));
    }, []);

    const handlePerVendorEmailToggle = useCallback((vendorId: string, checked: boolean) => {
        setEmailConfig(prev => ({
            ...prev,
            [vendorId]: { ...prev[vendorId], sendEmail: checked },
        }));
    }, []);

    const handlePrintPreview = useCallback((e: React.MouseEvent, vendor: VendorDetailDisplay) => {
        e.stopPropagation();
        logger.info('Opening print preview for vendor:', vendor.vendor_code);
        // TODO: Implement PDF generation/preview
    }, []);

    const handleConfirm = () => {
        const newVendorIdsToSend = vendors
            .filter(v => v.status === 'PENDING' && selectedVendorIds.includes(v.vendor_id))
            .map(v => v.vendor_id);

        // Dynamic methods: if at least one selected vendor has email ON, include 'EMAIL'
        const isAnyEmailEnabled = newVendorIdsToSend.some(id => emailConfig[id]?.sendEmail);
        const dynamicMethods = isAnyEmailEnabled ? ['EMAIL'] : [];

        logger.info('[RFQSendConfirmModal] Confirm payload:', {
            vendor_ids: newVendorIdsToSend,
            methods: dynamicMethods,
            emailConfig,
        });
        onConfirm(newVendorIdsToSend, dynamicMethods, emailConfig);
    };

    // ====================================================================================
    // DERIVED STATE
    // ====================================================================================

    const hasVendors = vendors.length > 0;
    const isAllSentMode = vendors.length > 0 && vendors.every(v => v.status !== 'PENDING');
    const newSelectedVendors = vendors.filter(v => v.status === 'PENDING' && selectedVendorIds.includes(v.vendor_id));

    // Block confirm only if a selected vendor has email toggle ON and is missing a To address
    const hasEmptyToConfig = newSelectedVendors.some(v => {
        const cfg = emailConfig[v.vendor_id];
        return cfg?.sendEmail === true && (!cfg.to || cfg.to.length === 0);
    });

    // Email OFF = valid (print-only flow); no method-count gate
    const canConfirm = newSelectedVendors.length > 0 && !hasEmptyToConfig && !isLoading && !isFetching;

    if (!isOpen || !rfq) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">ตรวจสอบก่อนส่ง RFQ</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{rfq.rfq_no}</p>
                        </div>
                    </div>
                </div>

                {/* ===== BODY ===== */}
                <div className="px-6 py-4 max-h-[65vh] overflow-y-auto space-y-4">

                    {/* Loading */}
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

                    {/* Zero-vendor trap */}
                    {!isFetching && !fetchError && !hasVendors && (
                        <div className="flex flex-col items-center gap-3 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg">
                            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-amber-800 dark:text-amber-200 mb-1">ไม่พบรายชื่อผู้ขาย</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    กรุณากลับไปแก้ไข RFQ ใบนี้และเพิ่มผู้ขายก่อนทำการส่ง
                                </p>
                            </div>
                        </div>
                    )}

                    {!isFetching && !fetchError && hasVendors && (
                        <>
                            {/* ============================================================ */}
                            {/* VENDOR LIST — Smart Cards with inline nested accordions     */}
                            {/* ============================================================ */}
                            <div>
                                {/* List header + Select All */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Users size={15} className="text-gray-500" />
                                        <span>ผู้ขายที่จะส่ง RFQ ({vendors.length} ราย)</span>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                                            checked={selectedVendorIds.length === vendors.length && vendors.length > 0}
                                            onChange={handleSelectAllVendors}
                                        />
                                        เลือกทั้งหมด
                                    </label>
                                </div>

                                {/* Smart Vendor Cards */}
                                <div className="flex flex-col gap-2">
                                    {vendors.map(vendor => {
                                        const isSelected = selectedVendorIds.includes(vendor.vendor_id);
                                        const isLocked = vendor.status !== 'PENDING';
                                        return (
                                            <VendorSmartCard
                                                key={vendor.vendor_id}
                                                vendor={vendor}
                                                isSelected={isSelected}
                                                isLocked={isLocked}
                                                emailConfig={emailConfig[vendor.vendor_id] ?? { to: [], cc: [], sendEmail: false }}
                                                onToggle={() => !isLocked && handleToggleVendor(vendor.vendor_id)}
                                                onEmailToggle={checked => handlePerVendorEmailToggle(vendor.vendor_id, checked)}
                                                onEmailConfigChange={cfg => handleEmailConfigChange(vendor.vendor_id, cfg)}
                                                onPrintPreview={e => handlePrintPreview(e, vendor)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:w-auto min-h-[20px]">
                        {hasEmptyToConfig && (
                            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                                กรุณาระบุอีเมลผู้รับ (To) ให้ครบทุกผู้ขาย
                            </p>
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
