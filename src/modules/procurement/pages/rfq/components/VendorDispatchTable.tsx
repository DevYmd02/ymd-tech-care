import { Send } from 'lucide-react';
import type { RFQVendor } from '@/modules/procurement/types/rfq-types';
import { formatThaiDate } from '@/shared/utils/dateUtils';

interface VendorDispatchTableProps {
    vendors: (RFQVendor & { vendor_code?: string; vendor_name?: string })[];
}

export const VendorDispatchTable: React.FC<VendorDispatchTableProps> = ({ vendors }) => {
    // Label styling: Small, bold, muted
    const thCls = "text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight py-3 px-4";
    const tdCls = "py-4 px-4 text-sm text-gray-700 dark:text-gray-200";

    return (
        <div className="space-y-4 pt-4">
            {/* Header Section */}
            <div className="flex items-center gap-3.5 px-6 mb-2">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm">
                    <Send size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white leading-tight">
                        สรุปการส่งเอกสาร ({vendors.length} ราย)
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-widest font-bold">
                        Dispatch Summary (Recipients)
                    </p>
                </div>
            </div>

            {vendors.length === 0 ? (
                <div className="mx-6 text-center py-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-semibold">ไม่พบข้อมูลผู้รับเอกสาร</p>
                </div>
            ) : (
                <div className="mx-6 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#0b1120]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className={thCls}>ชื่อผู้ขาย (Vendor)</th>
                                <th className={thCls}>ช่องทางการส่ง (Method)</th>
                                <th className={thCls}>EMAIL / ที่อยู่</th>
                                <th className={thCls}>วันที่ส่ง (Sent Date)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {vendors.map((vendor, index) => {
                                const vendorName = [vendor.vendor_code, vendor.vendor_name].filter(Boolean).join(' - ') || '-';
                                return (
                                    <tr key={index} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                                        <td className={`${tdCls} font-bold`}>{vendorName}</td>
                                        <td className={tdCls}>
                                            <span className="px-2 py-0.5 text-[9px] font-black rounded-md border border-blue-200/50 bg-blue-50/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30 uppercase">
                                                {vendor.sent_via || 'EMAIL'}
                                            </span>
                                        </td>
                                        <td className={tdCls}>{vendor.email_sent_to || '-'}</td>
                                        <td className={`${tdCls} font-medium`}>
                                            {vendor.sent_date ? formatThaiDate(vendor.sent_date) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
