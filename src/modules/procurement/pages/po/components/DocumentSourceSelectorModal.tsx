import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, PackageSearch, AlertCircle, Search } from 'lucide-react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { QCService } from '@/modules/procurement/services/qc.service';
import { PRService } from '@/modules/procurement/services/pr.service';
// import type { PRListParams } from '@/modules/procurement/services/pr.service';
import { VQService } from '@/modules/procurement/services/vq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VQListItem, PRHeader } from '@/modules/procurement/types';
import type { IReadyForPOPR, QCListItem, QCListParams } from '@/modules/procurement/schemas/qc-schemas';
import { ModalLayout } from '@/shared/components/ui/layout';
import { cn } from '@/shared/utils/cn';

interface DocumentSourceSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSource: (sourceType: 'QC' | 'BLANK', prId?: number, qcId?: number, vendorId?: number, winningVqId?: number, qcNo?: string) => void;
}

interface VendorDetail {
    vendor_id: number;
    vendor_name: string;
}

export const DocumentSourceSelectorModal: React.FC<DocumentSourceSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelectSource
}) => {
    const [selectedPrId, setSelectedPrId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // 🔍 TRIPLE SCAN: Fetch from 3 sources for maximum resilience
    // 1. Specialized Ready endpoint
    // 2. Broad Approved PRs list (Dynamic search)
    // 3. Broad Completed QCs list (Dynamic search + Targeted Trace)
    const { data: readyPRs = [], isLoading, isError } = useQuery({
        queryKey: ['pr-ready-for-po-triple', searchQuery],
        enabled: isOpen, // 🎯 Only run when modal is open to avoid duplicate queries and overhead
        queryFn: async () => {
            try {
                const trimmedQuery = searchQuery.trim();
                const qcParams: QCListParams = { limit: 100 }; // 🎯 DRAFT DISCOVERY: Broad search

                if (trimmedQuery) {
                    if (trimmedQuery.startsWith('QC-')) {
                        qcParams.qc_no = trimmedQuery;
                    } else {
                        // General search
                        qcParams.qc_no = trimmedQuery;
                    }
                }

                const [specializedData, allApprovedPRs, allCompletedQCs, targetedQCRes] = await Promise.all([
                    QCService.getReadyForPO(),
                    PRService.getList({ status: 'ALL' as any, limit: 100 }), // 🎯 Metadata Registry (No 'q' to bypass backend search bug)
                    QCService.getList(qcParams),
                    // 🎯 DIAGNOSTIC TRACE: Specifically look for the missing QC regardless of status
                    trimmedQuery.startsWith('QC-') ? QCService.getList({ qc_no: trimmedQuery, limit: 10 }) : Promise.resolve(null)
                ]);

                const items1 = Array.isArray(specializedData) ? specializedData : [];
                // PR Headers from broad scan
                const items2Raw = (allApprovedPRs as unknown as { data?: PRHeader[]; items?: PRHeader[] })?.data || 
                                 (allApprovedPRs as unknown as { data?: PRHeader[]; items?: PRHeader[] })?.items || [];
                const items2 = Array.isArray(items2Raw) ? items2Raw : [];
                
                // QC List Items from broad scan
                const items3Raw = (allCompletedQCs as unknown as { data?: QCListItem[]; items?: QCListItem[] })?.data || 
                                 (allCompletedQCs as unknown as { data?: QCListItem[]; items?: QCListItem[] })?.items || [];
                
                // Add targeted trace results to items3 to see why they might be excluded
                const itemsTargeted = (targetedQCRes as unknown as { data?: QCListItem[]; items?: QCListItem[] })?.data || 
                                     (targetedQCRes as unknown as { data?: QCListItem[]; items?: QCListItem[] })?.items || [];
                


                const items3 = [...(Array.isArray(items3Raw) ? items3Raw : []), ...itemsTargeted];

                // 🏗️ MERGE & DEDUPLICATE (Registry by pr_no for maximum resilience against missing IDs)
                const mergedMap = new Map<string, IReadyForPOPR>();
                
                // Priority 1: Specialized data (Ground Truth for flow)
                items1.forEach(item => {
                    const key = item.pr_no || `ID_${item.pr_id}`;
                    if (key) mergedMap.set(key, item);
                });

                // 🔍 Pre-build maps from broad PR scan for cross-reference
                const prStatusMap = new Map<string, string>();
                const prRequesterMap = new Map<string, string>();
                items2.forEach((item: any) => {
                    const prNo = item.pr_no || `ID_${item.pr_id}`;
                    if (prNo) {
                        prStatusMap.set(prNo, item.status);
                        // Try all possible name fields
                        const name = item.requester_name || item.created_by_name || item.user_name || item.requester?.name;
                        if (name) prRequesterMap.set(prNo, name);
                    }
                });

                const readyPrKeys = new Set(items1.map(i => i.pr_no || `ID_${i.pr_id}`));

                // Priority 2: Broad QC Scan (Fixes search by QC Number and handles DRAFTs)
                items3.forEach(qc => {
                    const qcAny = qc as any;
                    const prNo = qc.pr_no || `ID_${qc.pr_id}`;
                    const key = prNo || `QC_${qc.qc_no || qc.qc_id}`;
                    
                    // 🎯 ADOPT WINNER DETECTION LOGIC (Mirrors QCListPage.tsx)
                    const winnerVqId = (qc.winning_vq_id || qcAny.vq_header_id || qcAny.winning_vq_header_id || 0) as number;
                    const winnerVendorId = (qc.winning_vendor_id || qcAny.vendor_id) as number | undefined;
                    const isWinnerSelected = winnerVqId > 0;
                    const effectiveStatus = isWinnerSelected ? 'COMPLETED' : qc.status;

                    // 🛡️ AUTHORITY FILTER: Supplemental scans should NOT add APPROVED items that backend items1 ignored.
                    // If an APPROVED doc is missing from specialized list, it's likely already converted or not ready.
                    // We ONLY supplement for true DRAFTs or PARTIAL discovery.
                    const currentPrStatus = prStatusMap.get(prNo || '') || (qc as any).pr_status;
                    if (currentPrStatus === 'APPROVED' && !readyPrKeys.has(key)) return;
                    if (qc.status !== 'DRAFT' && !readyPrKeys.has(key)) return;

                    if (!mergedMap.has(key)) {
                        mergedMap.set(key, {
                            pr_id: qc.pr_id || (qcAny.pr_header_id as number) || (-(qc.qc_id || 0)),
                            pr_no: qc.pr_no || `(No PR Reference)`,
                            base_currency_code: 'THB', 
                            pr_base_total_amount: Number(qc.vq_total_amount || 0),
                            requester_name: prRequesterMap.get(prNo || '') || qcAny.requester_name || qcAny.created_by_name || 
                                            (qcAny.created_by_id === 1 || qcAny.created_by === 1 ? 'แอดมิน แอดมิน' : '-'), 
                            preferred_vendor: winnerVendorId ? {
                                vendor_id: winnerVendorId,
                                vendor_name: qc.vendor_name || 'ไม่ระบุชื่อผู้ขาย'
                            } : null,
                            qcHeaders: [{
                                qc_id: qc.qc_id || 0,
                                qc_no: qc.qc_no || 'QC-UNKNOWN',
                                pr_id: qc.pr_id || 0,
                                winning_vq_id: winnerVqId,
                                winning_vendor_id: winnerVendorId,
                                status: effectiveStatus as unknown as any, 
                                raw_status: qc.status,
                                created_at: qc.created_at || ''
                            }]
                        } as IReadyForPOPR);
                    } else {
                        // Enrich existing record with QC header if not already present
                        const existing = mergedMap.get(key)!;
                        const hasThisQC = existing.qcHeaders?.some(h => h.qc_id === qc.qc_id || h.qc_no === qc.qc_no);
                        
                        if (!hasThisQC) {
                            if (!existing.qcHeaders) existing.qcHeaders = [];
                            existing.qcHeaders.push({
                                qc_id: qc.qc_id || 0,
                                qc_no: qc.qc_no || 'QC-UNKNOWN',
                                pr_id: existing.pr_id,
                                winning_vq_id: winnerVqId,
                                winning_vendor_id: winnerVendorId,
                                status: effectiveStatus as unknown as any,
                                raw_status: qc.status,
                                created_at: qc.created_at || ''
                            });
                        }
                    }
                });

                // Priority 3: Broad PR Scan (Catch leftover PRs)
                items2.forEach(item => {
                    const pr = item as PRHeader;
                    const key = pr.pr_no || `ID_${pr.pr_id}`;
                    if (key && !mergedMap.has(key)) {
                        const prAny = pr as unknown as Record<string, unknown>;
                        const qcs = (prAny.qcHeaders as IReadyForPOPR['qcHeaders']) || [];
                        
                        const readyPrKeys = new Set(items1.map(i => i.pr_no || `ID_${i.pr_id}`));
                        
                        // 🛡️ AUTHORITY & DISCOVERY FILTER:
                        // - APPROVED: Skip if missing from items1 (Backend authority).
                        // - PARTIAL/DRAFT: Allow for discovery (Discovery path).
                        const isApproved = pr.status === 'APPROVED';
                        const isDiscoveryStatus = pr.status === 'PARTIAL' || pr.status === 'DRAFT';
                        
                        if (isApproved && !readyPrKeys.has(key)) return;
                        if (!isApproved && !isDiscoveryStatus) return;

                        // Map qcs to include raw_status for discovery logic
                        const richQcs = qcs.map(h => ({
                            ...h,
                            raw_status: (h as any).status // Preserve raw status
                        }));

                        mergedMap.set(key, {
                            pr_id: pr.pr_id,
                            pr_no: pr.pr_no,
                            base_currency_code: (prAny.pr_base_currency_code as string) || (prAny.base_currency_code as string) || 'THB',
                            pr_base_total_amount: Number(pr.pr_base_total_amount || pr.total_amount || 0),
                            requester_name: pr.requester_name || '-',
                            preferred_vendor: pr.preferred_vendor_id ? {
                                vendor_id: pr.preferred_vendor_id,
                                vendor_name: pr.vendor_name || 'ไม่ระบุชื่อผู้ขาย'
                            } : null,
                            qcHeaders: richQcs as any
                        } as IReadyForPOPR);
                    } else if (key) {
                        // 🔍 ENRICHMENT: Even if it's already there, if the name is missing, fill it in from PR Scan
                        const existing = mergedMap.get(key)!;
                        if ((!existing.requester_name || existing.requester_name === '-') && pr.requester_name) {
                            existing.requester_name = pr.requester_name;
                        }
                    }
                });

                // 🎯 FINAL ENRICHMENT: If any discovery items STILL lack a requester name (due to broken PR search),
                // we should ideally fetch them by ID. However, to keep it simple and responsive:
                // We'll prioritize the 'created_by_name' from the QC object if it's ever added by backend.
                
                const mergedResult = Array.from(mergedMap.values())
                    .filter(pr => {
                        const key = pr.pr_no || `ID_${pr.pr_id}`;
                        if (readyPrKeys.has(key)) return true;
                        return pr.qcHeaders?.some(h => h.raw_status === 'DRAFT');
                    });

                return mergedResult;
            } catch (err) {
                console.error('[DocumentSourceSelectorModal] Triple scan failed:', err);
                return QCService.getReadyForPO();
            }
        },
    });

    // Batch fetch VQ details for winning quotations (Deduplicated to avoid Duplicate Queries warning)
    const winningVqIds = Array.from(new Set(
        readyPRs
            .map(pr => pr.qcHeaders?.[0]?.winning_vq_id)
            .filter((id): id is number => id !== undefined && id !== null && id > 0)
    ));
    
    const vqQueries = useQueries({
        queries: winningVqIds.map(id => ({
            queryKey: ['vq-detail', id],
            queryFn: () => VQService.getById(id),
            enabled: isOpen && !!id,
        }))
    });

    const vqMap = vqQueries.reduce((acc, query, index) => {
        if (query.data) {
            const id = winningVqIds[index];
            acc[id] = query.data as VQListItem;
        }
        return acc;
    }, {} as Record<number, VQListItem>);

    // Batch fetch Vendor details for winning quotations (Waterfall from VQ Detail - Deduplicated)
    const winningVendorIds = Array.from(new Set(
        Object.values(vqMap)
            .map(vq => vq.vendor_id)
            .filter((id): id is number => id !== undefined && id !== null && id > 0)
    ));
    
    const vendorQueries = useQueries({
        queries: winningVendorIds.map(id => ({
            queryKey: ['vendor-detail', id],
            queryFn: () => VendorService.getById(id),
            enabled: isOpen && !!id,
        }))
    });

    const vendorMap = vendorQueries.reduce((acc, query, index) => {
        if (query.data) {
            const id = winningVendorIds[index];
            acc[id] = query.data as VendorDetail;
        }
        return acc;
    }, {} as Record<number, VendorDetail>);
    
    // Filter logic based on search query
    const filteredPRs = readyPRs.filter(pr => {
        const query = searchQuery.toLowerCase();
        const prNoMatch = pr.pr_no?.toLowerCase().includes(query);
        const requesterMatch = pr.requester_name?.toLowerCase().includes(query);
        const vendorMatch = pr.preferred_vendor?.vendor_name?.toLowerCase().includes(query);
        
        // Also search in associated QCs if any
        const qcMatch = pr.qcHeaders?.some(qc => qc.qc_no?.toLowerCase().includes(query));
        
        return prNoMatch || requesterMatch || vendorMatch || qcMatch;
    });

    const handleConfirm = () => {
        if (selectedPrId) {
            const selectedPr = readyPRs.find(pr => pr.pr_id === selectedPrId);
            // If there's a QC associated, pick the first one (or winning one) to pass as sourceQcId
            const firstQC = selectedPr?.qcHeaders?.[0];
            const winningVqId = firstQC?.winning_vq_id;
            const vqDetail = winningVqId ? vqMap[winningVqId] : null;

            onSelectSource(
                'QC', 
                selectedPrId, 
                firstQC?.qc_id, 
                vqDetail?.vendor_id || firstQC?.winning_vendor_id || selectedPr?.preferred_vendor?.vendor_id,
                firstQC?.winning_vq_id,
                firstQC?.qc_no
            );
        } else {
            onSelectSource('BLANK');
        }
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบสั่งซื้อ (PO)"
            titleIcon={<FileText size={20} />}
            subtitle="กรุณาเลือกแหล่งที่มาของข้อมูลเพื่อลดการบันทึกซ้ำซ้อน"
            size="md"
        >
            <div className="flex flex-col space-y-6">
                {/* 1. Blank PO Option */}
                <div 
                    className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedPrId === null 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-800"
                    )}
                    onClick={() => setSelectedPrId(null)}
                >
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full",
                            selectedPrId === null ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                        )}>
                            <Plus size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn("font-bold", selectedPrId === null ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300")}>
                                สร้างเอกสารเปล่า
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                กรอกข้อมูลใหม่ทั้งหมดด้วยตนเอง
                            </p>
                        </div>
                        {selectedPrId === null && <CheckCircle className="text-blue-600" size={20} />}
                    </div>
                </div>

                {/* 2. QC selection Option */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white dark:bg-gray-800 px-3 text-sm font-medium text-gray-500">หรือดึงข้อมูลจากใบเปรียบเทียบราคา (QC)</span>
                    </div>
                </div>

                {/* Search Bar section */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาด้วยเลข QC, PR หรือชื่อผู้ขาย..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 mt-3 animate-pulse">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : isError ? (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm">เกิดข้อผิดพลาดในการดึงข้อมูลใบขอซื้อ กรุณาลองใหม่อีกครั้ง</p>
                        </div>
                    ) : readyPRs.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <PackageSearch size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 dark:text-gray-400 font-medium">ไม่มีรายการใบขอซื้อที่รอออก PO</p>
                            <p className="text-xs text-gray-500 mt-1">รายการจะปรากฏเมื่อผ่านการอนุมัติหรือทำ QC เรียบร้อยแล้ว</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            {filteredPRs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                                    ไม่พบรายการที่ตรงกับการค้นหา
                                </div>
                            ) : (
                                filteredPRs.map((pr) => {
                                    const hasQC = pr.qcHeaders && pr.qcHeaders.length > 0;
                                    const firstQC = pr.qcHeaders?.[0];
                                    const displayQcNo = hasQC ? firstQC?.qc_no : null;
                                    const winningVqId = firstQC?.winning_vq_id;
                                    const vqDetail = winningVqId ? vqMap[winningVqId] : null;
                                    const winningVendorId = pr.qcHeaders?.[0]?.winning_vendor_id || vqDetail?.vendor_id;
                                    
                                    const vendorDetail = winningVendorId ? vendorMap[winningVendorId] : null;
                                    
                                    const vendorName = vendorDetail?.vendor_name || vqDetail?.vendor?.vendor_name || vqDetail?.vendor_name || pr.preferred_vendor?.vendor_name || (pr as unknown as { vendor_name?: string }).vendor_name || (hasQC ? 'มีผู้ชนะใน QC' : 'ไม่ระบุผู้ขาย');
                                    const displayAmount = vqDetail ? Number(vqDetail.base_total_amount || 0) : pr.pr_base_total_amount;

                                    return (
                                        <div 
                                            key={pr.pr_id}
                                            className={cn(
                                                "p-4 rounded-xl border-2 cursor-pointer transition-all shrink-0",
                                                selectedPrId === pr.pr_id 
                                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                                                    : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 bg-white dark:bg-gray-800"
                                            )}
                                            onClick={() => setSelectedPrId(pr.pr_id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                                                    selectedPrId === pr.pr_id ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={cn("font-bold text-sm truncate flex items-center gap-2", selectedPrId === pr.pr_id ? "text-emerald-700 dark:text-emerald-400" : "text-gray-800 dark:text-gray-200")}>
                                                            {pr.pr_no}
                                                        </h4>
                                                        <span className="text-xs text-indigo-500 font-medium whitespace-nowrap ml-2">
                                                            {displayAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {pr.base_currency_code}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-semibold text-gray-500">ผู้ขาย:</span> 
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{vendorName}</span>
                                                        </span>
                                                        {displayQcNo && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="font-semibold text-gray-500">อ้างอิง QC:</span> 
                                                                <span className="text-blue-600 dark:text-blue-400 font-medium">{displayQcNo}</span>
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <span className="font-semibold text-gray-500">ผู้ขอซื้อ:</span> {pr.requester_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                {selectedPrId === pr.pr_id && <CheckCircle className="text-emerald-600 shrink-0" size={20} />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading && !isError}
                    className={cn(
                        "px-6 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-colors",
                        selectedPrId 
                            ? "bg-emerald-600 hover:bg-emerald-700" 
                            : "bg-blue-600 hover:bg-blue-700",
                        (isLoading && !isError) ? "opacity-50 cursor-not-allowed" : ""
                    )}
                >
                    ดำเนินการต่อ
                </button>
            </div>
        </ModalLayout>
    );
};

