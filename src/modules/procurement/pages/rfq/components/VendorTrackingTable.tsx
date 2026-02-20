import React from 'react';
import { Users } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import type { RFQVendor } from '@/modules/procurement/types/rfq-types';

interface VendorTrackingTableProps {
    vendors: (RFQVendor & { vendor_name?: string; vendor_code?: string })[];
}

export const VendorTrackingTable: React.FC<VendorTrackingTableProps> = ({ vendors }) => {
    // Calculate summary counts
    const repliedCount = vendors.filter(v => v.status === 'RESPONDED').length;
    const declinedCount = vendors.filter(v => v.status === 'DECLINED').length;
    const waitingCount = vendors.filter(v => v.status === 'SENT' || v.status === 'PENDING').length;

    const labelStyle = "text-[13px] font-medium text-teal-700 dark:text-teal-400/90 mb-1.5 block";
    const valueStyle = "text-sm text-gray-900 dark:text-gray-100 font-medium";

    return (
        <div className="p-4">
            {/* Header / Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <Users size={18} />
                    <span className="font-semibold text-sm">สถานะการตอบกลับของผู้ขาย (Vendor Tracking)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        ตอบกลับแล้ว: {repliedCount}
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        ปฏิเสธ: {declinedCount}
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        รอตอบกลับ: {waitingCount}
                    </div>
                </div>
            </div>

            {/* Vendor Cards List */}
            <div className="space-y-3">
                {vendors.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">ไม่มีข้อมูลผู้ขาย</p>
                    </div>
                ) : (
                    vendors.map((vendor, index) => {
                        // Status Pill Logic
                        let statusPill;
                        if (vendor.status === 'RESPONDED') {
                            statusPill = <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded text-xs font-medium border border-green-200 dark:border-green-800/50 inline-block">ตอบกลับแล้ว</span>;
                        } else if (vendor.status === 'DECLINED') {
                            statusPill = <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2.5 py-0.5 rounded text-xs font-medium border border-rose-200 dark:border-rose-800/50 inline-block">ปฏิเสธ</span>;
                        } else {
                            statusPill = <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-800/50 inline-block">รอตอบกลับ</span>;
                        }

                        // Date logic styling for visual hierarchy
                        const repliedDateStyle = vendor.status === 'RESPONDED' 
                            ? 'text-green-600 dark:text-green-400 font-semibold'
                            : vendor.status === 'DECLINED' 
                                ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                                : 'text-gray-500 dark:text-gray-400';

                        return (
                            <div key={vendor.rfq_vendor_id || vendor.vendor_id || index} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 relative hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-6">
                                    {/* Col 1: Vendor Name */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className={labelStyle}>ชื่อผู้ขาย</label>
                                        <div className={valueStyle}>
                                            {vendor.vendor_code ? `${vendor.vendor_code} - ` : ''}
                                            {vendor.vendor_name || '-'}
                                        </div>
                                    </div>
                                    
                                    {/* Col 2: Sent Date */}
                                    <div className="col-span-1">
                                        <label className={labelStyle}>วันที่ส่ง</label>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {vendor.sent_date ? formatThaiDate(vendor.sent_date) : '-'}
                                        </div>
                                    </div>

                                    {/* Col 3: Action Date */}
                                    <div className="col-span-1">
                                        <label className={labelStyle}>วันที่ตอบกลับ</label>
                                        <div className={`text-sm ${repliedDateStyle}`}>
                                            {vendor.response_date ? formatThaiDate(vendor.response_date) : '-'}
                                        </div>
                                    </div>

                                    {/* Col 4: Status */}
                                    <div className="col-span-1">
                                        <label className={labelStyle}>สถานะ</label>
                                        <div>
                                            {statusPill}
                                        </div>
                                    </div>

                                    {/* Col 5: Remark */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className={labelStyle}>หมายเหตุ</label>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate" title={vendor.remark || ''}>
                                            {vendor.remark || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
