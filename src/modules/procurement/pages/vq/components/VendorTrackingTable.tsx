import React from 'react';
import { Users } from 'lucide-react';
import type { RFQVendor } from '@/modules/procurement/types';
import { formatThaiDate } from '@/shared/utils/dateUtils';

export type ExtendedVendor = RFQVendor & {
    vendor_name?: string;
    vendor_code?: string;
    vq_no?: string;
    sent_via?: string | null;
    email_sent_to?: string | null;
    reject_reason?: string | null;
    decline_reason?: string | null;
    cancel_note?: string | null;
};

interface VendorTrackingTableProps {
    vendors: ExtendedVendor[];
    actionComponent?: (vendor: ExtendedVendor) => React.ReactNode;
}

export const VendorTrackingTable: React.FC<VendorTrackingTableProps> = ({ vendors, actionComponent }) => {
    const repliedCount  = vendors.filter(v => v.status === 'RESPONDED').length;
    const declinedCount = vendors.filter(v => v.status === 'DECLINED').length;
    const waitingCount  = vendors.filter(v => v.status === 'SENT' || v.status === 'PENDING').length;

    /**
     * Determine if we should show the "Actions" (จัดการ) column.
     * Hidden if actionComponent is not provided AND no vendor has a QT number to display.
     */
    const hasAnyVq = vendors.some(v => !!v.vq_no);
    const showActions = !!actionComponent || hasAnyVq;

    /**
     * Shared Grid Configuration
     * 8-column vs 7-column layout based on showActions.
     */
    const GRID_LAYOUT = showActions 
        ? "grid-cols-[1.8fr_80px_1.5fr_120px_120px_130px_1.2fr_100px]"
        : "grid-cols-[1.8fr_80px_1.5fr_120px_120px_130px_1.2fr]";

    // Header label styling: Small, bold, muted uppercase
    const thCls = "text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight whitespace-nowrap min-w-0 truncate";

    return (
        <div className="space-y-4 pt-4">
            {/* ── Top Summary Section (Synchronized Padding & Perfect Centering) ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-6">
                <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-100 dark:border-teal-800/50 shadow-sm">
                        <Users size={20} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                        <h3 className="text-[16px] font-bold text-gray-900 dark:text-white leading-tight">
                            ผู้ขายที่ส่ง RFQ ({vendors.length} ราย)
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-widest font-bold">
                            Vendor Tracking Status
                        </p>
                    </div>
                </div>

                {/* Summary Pill with Status Dots (Balanced Spacing) */}
                <div className="flex items-center gap-6 bg-gray-100/60 dark:bg-gray-800/40 px-5 py-2.5 rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm mr-1">
                    <span className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        ตอบกลับแล้ว: {repliedCount}
                    </span>
                    <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600" />
                    <span className="flex items-center gap-2 text-[11px] font-extrabold text-rose-700 dark:text-rose-400">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                        ปฏิเสธ: {declinedCount}
                    </span>
                    <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600" />
                    <span className="flex items-center gap-2 text-[11px] font-extrabold text-blue-700 dark:text-blue-400">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        รอตอบกลับ: {waitingCount}
                    </span>
                </div>
            </div>

            {vendors.length === 0 ? (
                <div className="mx-6 text-center py-20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
                    <Users size={36} className="mx-auto text-gray-300 dark:text-gray-800 mb-4 opacity-40" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-semibold">ไม่พบข้อมูลผู้ขายที่ถูกส่ง RFQ</p>
                </div>
            ) : (
                <div className="relative border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#0b1120] shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        {/* Minimum width to prevent column collapse on tiny screens */}
                        <div className="min-w-[1000px]">
                            {/* ── Header Row (Strict Proportions & Matching Padding) ── */}
                            <div className={`grid ${GRID_LAYOUT} gap-x-6 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200/60 dark:border-gray-800/60 items-center`}>
                                <div className={thCls}>ชื่อผู้ขาย</div>
                                <div className={thCls}>ส่งทาง</div>
                                <div className={thCls}>EMAIL</div>
                                <div className={thCls}>วันที่ส่ง</div>
                                <div className={thCls}>วันที่ตอบกลับ</div>
                                <div className={thCls}>สถานะ</div>
                                <div className={thCls}>หมายเหตุ</div>
                                {showActions && <div className={`${thCls} text-right pr-2`}>จัดการ</div>}
                            </div>

                            {/* ── Data Rows (Synchronized) ── */}
                            <div className="divide-y divide-gray-100/80 dark:divide-gray-800/50">
                                {vendors.map((vendor, index) => {
                                    const isResponded = vendor.status === 'RESPONDED';
                                    const isDeclined  = vendor.status === 'DECLINED';
                                    const vendorName = [vendor.vendor_code, vendor.vendor_name].filter(Boolean).join(' - ') || '-';
                                    
                                    // Robust Fallback Sequence for Remark/Reason
                                    const remarkText = vendor.reject_reason || vendor.decline_reason || vendor.cancel_note || vendor.remark || '-';
                                    const hasValidRemark = remarkText !== '-';

                                    return (
                                        <div
                                            key={vendor.rfq_vendor_id || vendor.vendor_id || index}
                                            className={`grid ${GRID_LAYOUT} gap-x-6 px-6 py-5 items-center hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-all duration-200 group`}
                                        >
                                            {/* 1. Vendor Name */}
                                            <div className="min-w-0">
                                                <div className="font-bold text-[13.5px] text-gray-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" title={vendorName}>
                                                    {vendorName}
                                                </div>
                                            </div>

                                            {/* 2. Channel Badge */}
                                            <div className="min-w-0">
                                                <span className="px-2 py-0.5 text-[9px] font-black rounded-md border border-blue-200/50 bg-blue-50/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30 uppercase tracking-tighter">
                                                    {vendor.sent_via || 'EMAIL'}
                                                </span>
                                            </div>

                                            {/* 3. Email */}
                                            <div className="min-w-0">
                                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate block font-medium" title={vendor.email_sent_to || ''}>
                                                    {vendor.email_sent_to || '-'}
                                                </span>
                                            </div>

                                            {/* 4. Sent Date */}
                                            <div className="min-w-0">
                                                <span className="text-[13px] text-gray-900 dark:text-gray-200 font-semibold">
                                                    {vendor.sent_date ? formatThaiDate(vendor.sent_date) : '-'}
                                                </span>
                                            </div>

                                            {/* 5. Response Date */}
                                            <div className="min-w-0">
                                                <span className={`text-[13px] font-bold ${
                                                    isResponded ? 'text-emerald-600 dark:text-emerald-400'
                                                    : isDeclined ? 'text-rose-600 dark:text-rose-400'
                                                    : 'text-gray-400 dark:text-gray-600'
                                                }`}>
                                                    {vendor.response_date ? formatThaiDate(vendor.response_date) : '-'}
                                                </span>
                                            </div>

                                            {/* 6. Status Badge */}
                                            <div className="min-w-0">
                                                <div className="flex">
                                                    {isResponded ? (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/30">
                                                            ตอบกลับแล้ว
                                                        </span>
                                                    ) : isDeclined ? (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-100/80 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-700/30">
                                                            ปฏิเสธ
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100/50 dark:border-blue-700/30">
                                                            รอตอบกลับ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 7. Remark / Rejection Reason */}
                                            <div className="min-w-0">
                                                <span 
                                                    className={`text-[13px] truncate block ${
                                                        isDeclined && hasValidRemark 
                                                            ? 'text-rose-600 dark:text-rose-400 font-medium' 
                                                            : 'text-gray-400 dark:text-gray-500 italic'
                                                    }`} 
                                                    title={remarkText}
                                                >
                                                    {remarkText}
                                                </span>
                                            </div>

                                            {/* 8. Action Placeholder (Conditional) */}
                                            {showActions && (
                                                <div className="min-w-0 flex justify-end">
                                                    {actionComponent ? (
                                                        <div className="opacity-90 hover:opacity-100 transition-opacity">
                                                            {actionComponent(vendor)}
                                                        </div>
                                                    ) : vendor.vq_no ? (
                                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-700/40 whitespace-nowrap shadow-sm">
                                                            VQ: {vendor.vq_no}
                                                        </span>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800/40 flex items-center justify-center border border-gray-100 dark:border-gray-800/50 opacity-30">
                                                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
