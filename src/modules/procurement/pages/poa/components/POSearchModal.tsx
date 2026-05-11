import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, Loader2, Search } from 'lucide-react';
import { POAService } from '@/modules/procurement/services/poa.service';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import type { POListItem } from '@/modules/procurement/types';

interface POSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (po: POListItem) => void;
}

export const POSearchModal: React.FC<POSearchModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect 
}) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['pending-approval-pos'],
        queryFn: () => POAService.getList({ status: 'PENDING_APPROVAL' }),
        enabled: isOpen,
        staleTime: 0,
    });

    if (!isOpen) return null;

    // Handles raw data structure (might be wrapped in { success: true, data: [...] } or straight array)
    // Handles raw data structure (might be wrapped in { success: true, data: [...] } or straight array)
    const rawPoList = (data as unknown as { data?: POListItem[] })?.data || (data as unknown as POListItem[]) || [];
    
    // 🎯 Client-Side Filtering
    const filteredPoList = rawPoList.filter(item => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            String(item.po_no || '').toLowerCase().includes(s) ||
            String(item.vendor_name || '').toLowerCase().includes(s)
        );
    });

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10 rounded-t-lg">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">เลือกใบสั่งซื้อที่รออนุมัติ (Pending PO)</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body / Table Area */}
                <div className="p-4 flex-1 overflow-auto flex flex-col gap-4">
                    
                    {/* 🎯 NEW: Search Box */}
                    {!isLoading && !error && rawPoList.length > 0 && (
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="ค้นหาตามเลขที่ PO หรือชื่อผู้ขาย..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <span>กำลังดึงข้อมูล...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500">
                            เกิดข้อผิดพลาดในการดึงข้อมูล
                        </div>
                    ) : rawPoList.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            ไม่มีใบสั่งซื้อที่รออนุมัติในระบบ
                        </div>
                    ) : filteredPoList.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-12">ลำดับ</th>
                                        <th className="px-4 py-3">เลขที่ PO</th>
                                        <th className="px-4 py-3">วันที่สั่งซื้อ</th>
                                        <th className="px-4 py-3">ผู้ขาย</th>
                                        <th className="px-4 py-3 text-right">ยอดรวม</th>
                                        <th className="px-4 py-3 text-center w-20">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredPoList.map((item, index) => {
                                        const raw = item as unknown as Record<string, unknown>;
                                        const total = Number(
                                            item.total_amount ?? 
                                            item.base_total_amount ?? 
                                            raw.grand_total ?? 
                                            raw.net_amount ?? 
                                            raw.net_amt ?? 
                                            raw.amount ?? 
                                            raw.total ?? 
                                            0
                                        );
                                        return (
                                            <tr key={item.po_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{item.po_no}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatThaiDate(item.po_date)}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.vendor_name || '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                                    {Number(total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => onSelect(item)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
                                                    >
                                                        เลือก
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700 transition-colors"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
