import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Users, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { RFQService } from '@/modules/procurement/services';
import type { RFQDetailResponse } from '@/modules/procurement/types';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { VendorTrackingTable, type ExtendedVendor } from './VendorTrackingTable';
import { logger } from '@/shared/utils/logger';

interface QTVendorTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    rfqId: string | null;
    rfqNo: string;
}

export const QTVendorTrackingModal: React.FC<QTVendorTrackingModalProps> = ({
    isOpen,
    onClose,
    rfqId,
    rfqNo
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [vendors, setVendors] = useState<ExtendedVendor[]>([]);
    const [rfqHeader, setRfqHeader] = useState<RFQDetailResponse | null>(null);

    useEffect(() => {
        const fetchVendors = async () => {
            if (!isOpen || !rfqId) return;

            setIsLoading(true);
            try {
                const rfqDetail: RFQDetailResponse = await RFQService.getById(rfqId);
                const vendorList = (rfqDetail.vendors || []) as ExtendedVendor[];
                setVendors(vendorList);
                setRfqHeader(rfqDetail);
            } catch (error) {
                logger.error('[QTVendorTrackingModal] Failed to fetch RFQ vendors:', error);
                toast('ไม่สามารถดึงข้อมูลผู้ขายได้', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendors();
    }, [isOpen, rfqId, toast]);

    const handleViewQT = (vendorName: string) => {
        navigate(`/procurement/qt?rfq_no=${encodeURIComponent(rfqNo)}&vendor_name=${encodeURIComponent(vendorName)}`);
    };

    const handleCreateQT = (vendorId: string) => {
        if (!rfqId) return;
        navigate(`/procurement/qt?create=true&rfq_id=${rfqId}&vendor_id=${vendorId}`);
    };

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={`สถานะการตอบกลับใบเสนอราคา (จาก RFQ: ${rfqNo || '-'})`}
            titleIcon={<div className="bg-white/20 p-1 rounded-md shadow-sm"><Users size={14} strokeWidth={3} /></div>}
            headerColor="bg-teal-600"
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-white dark:bg-gray-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            }
        >
            {/* Body — matches POApprovalModal: bg-gray-50 dark:bg-gray-900, p-6, space-y-6 */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900 space-y-6 min-h-[500px]">
                {/* RFQ Summary Card — same pattern as POApprovalModal header card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-bold text-teal-600 dark:text-teal-400 text-lg">ข้อมูล RFQ</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">เลขที่ RFQ</label>
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{rfqNo || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">วัตถุประสงค์</label>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{rfqHeader?.purpose || '-'}</div>
                        </div>
                        <div className="flex items-start gap-6">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">ผู้ขายที่เชิญ</label>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{rfqHeader?.vendor_count || 0}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">ตอบกลับแล้ว</label>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{rfqHeader?.responded_vendors_count || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendor Tracking Section — inside a card wrapper */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูลผู้ขาย...</span>
                            </div>
                        ) : (
                            <VendorTrackingTable
                                vendors={vendors}
                                actionComponent={(vendor) => (
                                    <div className="flex justify-end">
                                        {vendor.qt_no ? (
                                            <button
                                                onClick={() => handleViewQT(vendor.vendor_name || '')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                                                           text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100
                                                           dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-700/40 dark:hover:bg-blue-900/40"
                                            >
                                                <Eye size={12} />
                                                ดู QT
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleCreateQT(vendor.vendor_id)}
                                                disabled={vendor.status === 'DECLINED'}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                    vendor.status === 'DECLINED'
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                                                }`}
                                            >
                                                <Plus size={12} />
                                                บันทึกราคา
                                            </button>
                                        )}
                                    </div>
                                )}
                            />
                        )}
                    </div>
                </div>
            </div>
        </WindowFormLayout>
    );
};