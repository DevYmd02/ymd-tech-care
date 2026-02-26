import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, AlertCircle, Calendar, DollarSign, Wallet, FileText, CheckCircle, Clock } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { POService } from '@/modules/procurement/services';
import type { POListItem } from '@/modules/procurement/types';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { logger } from '@/shared/utils/logger';

interface POApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    poId: string;
    onSuccess: () => void;
}

export const POApprovalModal: React.FC<POApprovalModalProps> = ({ isOpen, onClose, poId, onSuccess }) => {
    // Queries
    const { data: po, isLoading, isError } = useQuery<POListItem | null>({
        queryKey: ['po-detail', poId],
        queryFn: () => POService.getById(poId),
        enabled: isOpen && !!poId,
        staleTime: 0,
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [remark, setRemark] = useState('');

    // Reset form when opening new PO
    useEffect(() => {
        if (isOpen) {
            setRemark('');
        }
    }, [isOpen, poId]);
    
    const handleApprove = async () => {
        if (!confirm('ยืนยันการอนุมัติใบสั่งซื้อนี้?')) return;
        
        setActionLoading(true);
        try {
            await POService.approve(poId, remark);
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('[POApprovalModal] handleApprove error:', error);
            alert('เกิดข้อผิดพลาดในการอนุมัติ');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!remark) {
           alert('กรุณาระบุเหตุผลในการปฏิเสธ');
           return;
        }
        if (!confirm('ยืนยันการปฏิเสธใบสั่งซื้อนี้?')) return;

        setActionLoading(true);
        try {
            await POService.reject(poId, remark);
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('[POApprovalModal] handleReject error:', error);
            alert('เกิดข้อผิดพลาดในการปฏิเสธ');
        } finally {
            setActionLoading(false);
        }
    };

    // If closed, return null
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden min-h-[600px]">
                {/* Header - Fixed/Shared */}
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">อนุมัติใบสั่งซื้อ (Purchase Order Approval)</h2>
                            <p className="text-blue-100 text-sm opacity-90">ตรวจสอบและอนุมัติใบสั่งซื้อ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body Content - Swaps based on state */}
                {(() => {
                    if (isLoading) {
                        return (
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 space-y-6">
                                {/* Alert Banner Skeleton */}
                                <div className="bg-gray-200 dark:bg-gray-800 animate-pulse h-20 rounded-lg w-full"></div>

                                {/* PO Header Info Skeleton */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4"></div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                            <div key={i}>
                                                <div className="h-3 bg-gray-100 dark:bg-gray-700 animate-pulse rounded w-1/2 mb-2"></div>
                                                <div className="h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4"></div>
                                            </div>
                                        ))}
                                        <div className="md:col-span-3">
                                            <div className="h-3 bg-gray-100 dark:bg-gray-700 animate-pulse rounded w-1/6 mb-2"></div>
                                            <div className="h-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items Skeleton */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4"></div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded w-12"></div>
                                                <div className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded flex-1"></div>
                                                <div className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded w-24"></div>
                                                <div className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded w-24"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (isError || !po) {
                        return (
                            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{isError ? 'เกิดข้อผิดพลาด' : 'ไม่พบข้อมูล'}</h3>
                                <p className="text-gray-500 mb-6 font-medium">
                                    {isError 
                                        ? 'ไม่สามารถดึงข้อมูลได้ในขณะนี้ กรุณาลองใหม่ภายหลัง' 
                                        : 'ไม่สามารถโหลดข้อมูลใบสั่งซื้อได้ หรือข้อมูลอาจถูกลบไปแล้ว'}
                                </p>
                                <button onClick={onClose} className={styles.btnSecondary}>ปิดหน้าต่าง</button>
                            </div>
                        );
                    }

                    const data = po; // Narrowed to non-null

                    return (
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 space-y-6">
                            {/* Alert Banner */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 flex gap-3 rounded-r-lg">
                                <AlertCircle className="text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" size={20} />
                                <div>
                                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400">รอการอนุมัติของคุณ</h3>
                                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                        กรุณาตรวจสอบรายละเอียดใบสั่งซื้อและดำเนินการอนุมัติหรือปฏิเสธ
                                    </p>
                                </div>
                            </div>

                            {/* PO Header Info */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg">ข้อมูลใบสั่งซื้อ (PO Header)</h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">เลขที่ PO</label>
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{data.po_no}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">วันที่ PO</label>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400"/> {formatThaiDate(data.po_date)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">สถานะ</label>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 gap-1.5">
                                            <Clock size={14} /> รออนุมัติ
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">ผู้ขาย</label>
                                        <div className="font-bold text-gray-900 dark:text-gray-100">{data.vendor_name || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">สาขา</label>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{data.branch_name || 'สำนักงานใหญ่'}</div>
                                    </div>
                                     <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">คลังสินค้า</label>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">คลังสินค้าหลัก</div>
                                    </div>

                                     <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">สกุลเงิน</label>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                             <DollarSign size={16} className="text-gray-400"/> {data.currency_code || 'THB'}
                                        </div>
                                    </div>
                                     <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">เครดิตเทอม</label>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                             <Wallet size={16} className="text-gray-400"/> {data.payment_term_days || 30} วัน
                                        </div>
                                    </div>
                                     <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">ผู้สร้าง</label>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{data.created_by_name || 'สมชาย ใจดี'}</div>
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">หมายเหตุ</label>
                                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm min-h-[60px]">
                                            {data.remarks || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                    <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg">รายการสินค้า (PO Line Items)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                                            <tr>
                                                <th className="px-6 py-3 w-12 text-center">#</th>
                                                <th className="px-6 py-3">รหัสสินค้า</th>
                                                <th className="px-6 py-3">ชื่อสินค้า/รายละเอียด</th>
                                                <th className="px-6 py-3 text-right">จำนวน</th>
                                                <th className="px-6 py-3 text-center">หน่วย</th>
                                                <th className="px-6 py-3 text-right">ราคา/หน่วย</th>
                                                <th className="px-6 py-3 text-right text-red-500">ส่วนลด</th>
                                                <th className="px-6 py-3 text-right">ภาษี</th>
                                                <th className="px-6 py-3 text-right font-bold text-gray-700 dark:text-gray-300">ยอดสุทธิ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                           {/* Mock Items for now */}
                                           <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 text-center text-gray-500">1</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">ITM001</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">คอมพิวเตอร์ Notebook Dell Inspiron 15</div>
                                                    <div className="text-xs text-gray-500 mt-1">สำหรับพนักงานใหม่</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">3.000</td>
                                                <td className="px-6 py-4 text-center">PCS</td>
                                                <td className="px-6 py-4 text-right text-gray-600">25,000.00</td>
                                                <td className="px-6 py-4 text-right text-red-500">-150.00</td>
                                                <td className="px-6 py-4 text-right text-gray-500">VAT7</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">74,850.00</td>
                                           </tr>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 text-center text-gray-500">2</td>
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">ITM002</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">เมาส์ไร้สาย Logitech M185</div>
                                                    <div className="text-xs text-gray-500 mt-1">เมาส์สำหรับคอมพิวเตอร์ใหม่</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">3.000</td>
                                                <td className="px-6 py-4 text-center">PCS</td>
                                                <td className="px-6 py-4 text-right text-gray-600">350.00</td>
                                                <td className="px-6 py-4 text-right text-red-500">-50.00</td>
                                                <td className="px-6 py-4 text-right text-gray-500">VAT7</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">1,000.00</td>
                                           </tr>
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <td colSpan={6}></td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-500">รวมก่อนภาษี:</td>
                                                <td colSpan={2} className="px-6 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">75,850.00 บาท</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6}></td>
                                                <td className="px-6 py-2 text-right text-sm font-medium text-gray-500">ภาษีมูลค่าเพิ่ม 7%:</td>
                                                <td colSpan={2} className="px-6 py-2 text-right text-sm font-bold text-gray-900 dark:text-white">5,309.50 บาท</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6}></td>
                                                <td className="px-6 py-4 text-right text-base font-bold text-blue-600 dark:text-blue-400">รวมสุทธิ:</td>
                                                <td colSpan={2} className="px-6 py-4 text-right text-xl font-bold text-blue-600 dark:text-blue-400">81,159.50 บาท</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Approval Workflow Visualization */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                 <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                     ขั้นตอนการอนุมัติ (Approval Workflow)
                                 </h3>
                                 <div className="space-y-4">
                                    {/* Step 1: Approved */}
                                     <div className="flex bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 gap-4 items-start">
                                         <div className="bg-green-500 rounded-full p-1.5 shrink-0 text-white shadow-sm mt-1">
                                             <CheckCircle size={20} />
                                         </div>
                                         <div className="flex-1">
                                             <div className="flex flex-wrap justify-between items-start gap-2">
                                                 <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">ระดับที่ 1</span>
                                                        <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-green-200">อนุมัติแล้ว</span>
                                                    </div>
                                                    <div className="font-bold text-gray-900 dark:text-white text-base">สมชาย ใจดี <span className="text-gray-400 text-xs font-normal ml-1">(PROCUREMENT_OFFICER)</span></div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <Clock size={12}/> 2024-02-01 10:30:00
                                                    </div>
                                                 </div>
                                             </div>
                                             <div className="mt-3 bg-white dark:bg-gray-900 border border-green-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                 <span className="font-semibold text-gray-900 dark:text-white mr-1">หมายเหตุ:</span>
                                                 เห็นชอบตามที่เสนอ
                                             </div>
                                         </div>
                                     </div>

                                     {/* Step 2: Pending (Current) */}
                                     <div className="flex bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400 border-y border-r border-yellow-200 dark:border-gray-700 rounded-r-lg p-4 gap-4 items-start relative overflow-hidden">
                                         {/* Highlight Indicator */}
                                         <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                                         
                                         <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-2 shrink-0 text-yellow-600 dark:text-yellow-400 shadow-sm mt-1">
                                             <Clock size={18} />
                                         </div>
                                         <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wide">ระดับที่ 2</span>
                                                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-yellow-200">รออนุมัติ</span>
                                              </div>
                                              <div className="font-bold text-gray-900 dark:text-white text-base">สมหญิง รักดี <span className="text-gray-400 text-xs font-normal ml-1">(FIN_MANAGER)</span></div>
                                         </div>
                                     </div>
                                 </div>
                            </div>

                            {/* Action Section */}
                             <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
                                 <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">การอนุมัติ (Your Action)</h3>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                         หมายเหตุ (Remarks) <span className="text-gray-400 font-normal text-xs">(จำเป็นสำหรับกรณีปฏิเสธ)</span>
                                     </label>
                                     <textarea 
                                        value={remark}
                                        onChange={(e) => setRemark(e.target.value)}
                                        className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none shadow-sm"
                                        placeholder="ระบุหมายเหตุหรือเหตุผลสำหรับการอนุมัติ/ปฏิเสธ..."
                                     />
                                 </div>
                             </div>
                        </div>
                    );
                })()}

                {/* Footer - Shared and visible during loading/error but disabled if loading */}
                <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium hidden md:block">
                        ผู้อนุมัติ: <span className="text-gray-900 dark:text-white font-bold">สมหญิง รักดี (FIN_MANAGER)</span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button 
                            onClick={handleReject}
                            disabled={actionLoading || isLoading || !po}
                            className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X size={18} /> ปฏิเสธ (Reject)
                        </button>
                        <button 
                            onClick={handleApprove}
                            disabled={actionLoading || isLoading || !po}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={18} /> อนุมัติ (Approve)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
