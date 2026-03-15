import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Plus, Users, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { RFQService } from '@/modules/procurement/services';
import type { RFQDetailResponse } from '@/modules/procurement/types';
import { VendorTrackingTable, type ExtendedVendor } from './VendorTrackingTable';

// Define the wrapper type at top level
interface APIWrapped<T> {
    data: T;
    success?: boolean;
}

interface VQVendorTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    rfqId: number | null;
    rfqNo: string;
}

export const VQVendorTrackingModal: React.FC<VQVendorTrackingModalProps> = ({
    isOpen,
    onClose,
    rfqId,
    rfqNo
}) => {
    const navigate = useNavigate();

    // Data Fetching with React Query
    const { data: responseData, isLoading } = useQuery({
        queryKey: ['rfq-vendors', rfqId],
        queryFn: () => RFQService.getById(rfqId!),
        enabled: !!isOpen && !!rfqId,
        staleTime: 5000,
    });

    // 🛡️ API Wrapper Fallback (Handle Axios { data: ... } or direct object)
    const rfqHeader = React.useMemo(() => {
        if (!responseData) return null;
        // Handle data.data pattern from some backend responses
        const wrapped = responseData as unknown as APIWrapped<RFQDetailResponse>;
        const data = wrapped?.data;
        if (data && typeof data === 'object' && ('rfq_id' in data || 'rfq_no' in data)) {
            return data;
        }
        return responseData as RFQDetailResponse;
    }, [responseData]);

    // 🛡️ Fetch Vendor Master for Name Mapping
    const { data: vendorsData } = useQuery({
        queryKey: ['vendors', 'all'],
        queryFn: () => VendorService.getList(),
        staleTime: 5 * 60 * 1000,
    });
    
    const vendorMap = React.useMemo(() => {
        const map = new Map<number, string>();
        if (vendorsData?.items) {
            vendorsData.items.forEach((v: { vendor_id: number; vendor_name: string }) => {
                map.set(v.vendor_id, v.vendor_name);
            });
        }
        return map;
    }, [vendorsData]);

    // 🛡️ Snake Case Defensive Array unwrapping (Handle generic vendors array, or specific rfqVendors array based on backend)
    const vendors = React.useMemo(() => {
        if (!rfqHeader) return [] as ExtendedVendor[];
        const list = rfqHeader.vendors || rfqHeader.rfqVendors || [];
        return list as ExtendedVendor[];
    }, [rfqHeader]);

    const handleViewQT = (vendorName: string) => {
        navigate(`/procurement/vq?rfq_no=${encodeURIComponent(rfqNo)}&vendor_name=${encodeURIComponent(vendorName)}`);
    };

    const handleCreateQT = (vendorId: number) => {
        if (!rfqId) return;
        navigate(`/procurement/vq?create=true&rfq_id=${rfqId}&vendor_id=${vendorId}`);
    };

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={`ภาพรวมการตอบกลับของกลุ่ม RFQ (เลขที่: ${rfqNo || '-'})`}
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
                            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{rfqHeader?.rfq_no || rfqNo || '-'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">วัตถุประสงค์</label>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{rfqHeader?.purpose || rfqHeader?.remarks || '-'}</div>
                        </div>
                        <div className="flex items-start gap-6">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">ผู้ขายที่เชิญ</label>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{rfqHeader?.vendor_count ?? vendors.length}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider block mb-1">ตอบกลับแล้ว</label>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{rfqHeader?.responded_vendors_count ?? vendors.filter(v => v.status === 'RESPONDED' || v.status === 'RECORDED' || !!v.vq_no).length}</div>
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
                                vendorMap={vendorMap}
                                actionComponent={(vendor) => {
                                    const isPending = vendor.status === 'PENDING' || vendor.status === 'SENT' || vendor.status === 'RESPONDED';
                                    const isDeclined = vendor.status === 'DECLINED';
                                    const isRecorded = vendor.status === 'RECORDED' || !!vendor.vq_no;
                                    const isRespondedButNotRecorded = vendor.status === 'RESPONDED' && !vendor.vq_no;

                                    // Rule 1: Allow Record Price for PENDING/SENT/RESPONDED if no document exists
                                    const canRecordManual = (isPending || isRespondedButNotRecorded) && !isRecorded;

                                    if (isDeclined) {
                                        return (
                                            <div className="flex justify-end text-gray-400 font-bold pr-4">
                                                -
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex justify-end">
                                            {/* Show View if Recorded */}
                                            {isRecorded ? (
                                                <button
                                                    onClick={() => handleViewQT(vendor.vendor_name || '')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-700/40 dark:hover:bg-blue-900/40"
                                                >
                                                    <Eye size={12} />
                                                    ดู VQ
                                                </button>
                                            ) : canRecordManual ? (
                                                /* Show Record Price if Pending/Responded but unrecorded */
                                                <button
                                                    onClick={() => handleCreateQT(vendor.vendor_id)}
                                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                                                >
                                                    <Plus size={12} />
                                                    บันทึกราคา
                                                </button>
                                            ) : (
                                                <div className="flex justify-end text-gray-400 font-bold pr-4">-</div>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </WindowFormLayout>
    );
};