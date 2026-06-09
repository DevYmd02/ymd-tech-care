/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอใบเสนอราคา (Request for Quotation List)
 * @role "Request Manager & Monitor" — NO data-entry actions (ย้ายไป QT/QC แล้ว)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { FileText, Eye, Send, Edit, Search, Plus, Printer } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, RFQStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@/shared/utils';
// Services & Types
import { RFQService, PRService, AVService } from '@/modules/procurement/services';
import type { RFQFilterCriteria, RFQHeader, RFQStatus, SendRFQToVendorPayload, PRHeader, ApprovalHeader } from '@/modules/procurement/types';
import { RFQFormModal, RFQSendConfirmModal } from './components';




// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const RFQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SENT', label: 'ส่งแล้ว' },
    { value: 'CLOSED', label: 'ปิดแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================



// const RFQ_FILTER_CONFIG: FilterFieldConfig<RFQFilterKeys>[] = [
//     { name: 'search', label: 'เลขที่ RFQ', type: 'text', placeholder: 'RFQ-xxx' },
//     { name: 'search2', label: 'PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
//     { name: 'creator', label: 'ผู้สร้าง RFQ', type: 'text', placeholder: 'ชื่อผู้สร้าง' },
//     { name: 'status', label: 'สถานะ', type: 'select', options: RFQ_STATUS_OPTIONS },

// ];

// ====================================================================================
// HELPERS
// ====================================================================================

const deriveRFQCounter = (item: RFQHeader) => {
    // 🔒 FIX: Prioritize 'sent_vendors_count' (REQUIRED field) over legacy 'vendor_sent'
    // This ensures that when the backend is updated, the frontend picks up the new value correctly.
    const total = item.vendor_total ?? item.vendor_count ?? item.rfqVendors?.length ?? 0;
    
    // 🔒 FIX: Only count vendors as 'Sent' if they were explicitly sent (status = SENT or has sent_date)
    // This prevents the 'Sent' count from increasing automatically when a VQ is created for a pending vendor.
    const sentCount = item.sent_vendors_count ?? item.vendor_sent ?? item.rfqVendors?.filter((v) => {
        const status = String(v.status || '').toUpperCase();
        return status === 'SENT' || !!v.sent_date;
    }).length ?? 0;

    const respondedCount = item.responded_vendors_count ?? item.vendor_responded ?? item.rfqVendors?.filter((v) => 
        ['RESPONDED', 'DECLINED'].includes(String(v.status || '').toUpperCase())
    ).length ?? 0;
    
    return { total, sentCount, respondedCount };
};

const getDynamicStatus = (item: RFQHeader) => {
    // 1. Respect terminal statuses FIRST
    if (['CLOSED', 'CANCELLED'].includes(item.status)) {
        return item.status;
    }
    
    const { sentCount, total } = deriveRFQCounter(item);
    
    // 2. Apply dynamic logic for DRAFT vs SENT
    if (total > 0 && sentCount > 0) {
        return 'SENT';
    }
    
    return item.status; // Fallback
};

// ====================================================================================
// PR NUMBER HYDRATOR
// ====================================================================================

const PRNumberCell = ({ prId, fallbackNo }: { prId: number | null | undefined, fallbackNo?: string | null }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['pr', prId],
        queryFn: () => PRService.getDetail(prId!),
        enabled: !!prId && !fallbackNo,
    });

    const prNo = fallbackNo || data?.pr_no || (data as { header?: { pr_no?: string } })?.header?.pr_no;

    if (!prId && !fallbackNo) {
        return <span className="text-xs text-gray-400 dark:text-gray-600 italic">ไม่มี PR อ้างอิง</span>;
    }

    if (isLoading && !fallbackNo) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit animate-pulse">
                <span className="font-semibold text-gray-500">PR:</span>
                กำลังโหลด...
            </span>
        );
    }

    if (!prNo) {
        return <span className="text-xs text-gray-400 dark:text-gray-600 italic">ไม่มี PR อ้างอิง</span>;
    }

    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm whitespace-nowrap leading-tight" title="Purchase Requisition">
            {prNo}
        </span>
    );
};

// ====================================================================================
// AV NUMBER HYDRATOR
// ====================================================================================

const AVNumberCell = ({ prNo, fallbackNo, approvalId }: { prNo?: string | null, fallbackNo?: string | null, approvalId?: number | null }) => {
    const hasFallback = !!(fallbackNo && fallbackNo.trim() !== '');
    
    const { data: approvalList, isLoading } = useQuery({
        queryKey: ['pr-approval-by-no', prNo],
        queryFn: async () => {
            if (!prNo) return null;
            const res = await AVService.getApprovalList({ pr_no: prNo });
            return res.data || [];
        },
        enabled: !!(prNo && !hasFallback),
        staleTime: 5 * 60 * 1000,
    });

    const avNo = useMemo(() => {
        if (hasFallback) return fallbackNo;
        if (!approvalList || approvalList.length === 0) return null;
        
        // 🎯 Precision Match: If we have an ID, find the exact matching approval
        if (approvalId) {
            const match = (approvalList as unknown as ApprovalHeader[]).find((a) => Number(a.approval_id) === Number(approvalId));
            if (match) return match.approval_no;
        }

        // 🎯 String Match Fallback: If we have a fallback number but no ID (Common in List API)
        if (fallbackNo && !approvalId) {
             const match = (approvalList as unknown as ApprovalHeader[]).find((a) => 
                a.approval_no === fallbackNo
             );
             if (match) return match.approval_no;
        }

        // 🛡️ Robust Fallback: If there's ONLY ONE AV record for this PR, it's safe to assume it's the one.
        if (approvalList.length === 1 && !approvalId) {
            const first = approvalList[0] as unknown as ApprovalHeader;
            return first.approval_no;
        }

        // ❌ Strict: If there are MULTIPLE AVs (e.g. 0008, 0009) and no ID/Number match, return null.
        return null;
    }, [hasFallback, fallbackNo, approvalList, approvalId]);

    if (isLoading && !hasFallback) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/40 px-1.5 py-0.5 rounded border border-violet-200/50 dark:border-violet-800/50 shadow-sm animate-pulse">
               กำลังโหลด...
            </span>
        );
    }

    if (!avNo) return null;

    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/40 px-1.5 py-0.5 rounded border border-violet-200/50 dark:border-violet-800/50 shadow-sm whitespace-nowrap leading-tight" title="Approval Number">
            {avNo}
        </span>
    );
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as 'ALL' | 'WAITING_CREATE') || 'ALL';

    const handleTabChange = useCallback((newTab: 'ALL' | 'WAITING_CREATE') => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', newTab);
            next.set('page', '1');
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    // URL-based Filter State
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'rfq_no',
            search2: 'pr_no',
            search3: 'creator_name'
        }
    });

    // Convert to API filter format using APPLIED filters (from URL)
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        creator_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching — driven by applied filters (URL params only)
    const { data, isLoading } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => RFQService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const { data: waitingCreateDataRaw, isLoading: isWaitingCreateLoading } = useQuery({
        queryKey: ['waiting-create-rfq'],
        queryFn: async () => {
            logger.info('[RFQListPage] Fetching PRs without RFQ from backend');
            const res = await RFQService.getApprovedPRsWithoutRFQ();
            const list = res.data || [];
            
            // Sort by date descending (Newest first)
            return [...list].sort((a, b) => {
                const dateA = new Date(a.pr_date || 0);
                const dateB = new Date(b.pr_date || 0);
                return dateB.getTime() - dateA.getTime();
            });
        },
        enabled: activeTab === 'WAITING_CREATE',
        staleTime: 1 * 60 * 1000,
    });

    const waitingCreateData = useMemo(() => {
        let list = waitingCreateDataRaw || [];
        // Support searching by PR No. when on WAITING_CREATE tab
        // Use 'filters' instead of 'localFilters' to wait for explicit search click/enter
        const searchPR = filters.search2?.toLowerCase() || '';
        const dateStart = filters.date_start ? new Date(filters.date_start) : null;
        const dateEnd = filters.date_end ? new Date(filters.date_end) : null;
        
        if (searchPR) {
            list = list.filter((pr) => pr.pr_no && pr.pr_no.toLowerCase().includes(searchPR));
        }

        if (dateStart || dateEnd) {
            list = list.filter((pr) => {
                if (!pr.pr_date) return false;
                const prDate = new Date(pr.pr_date);
                prDate.setHours(0, 0, 0, 0); // Normalize to start of day
                
                if (dateStart) {
                    dateStart.setHours(0, 0, 0, 0);
                    if (prDate < dateStart) return false;
                }
                
                if (dateEnd) {
                    dateEnd.setHours(0, 0, 0, 0);
                    if (prDate > dateEnd) return false;
                }
                
                return true;
            });
        }

        return list;
    }, [waitingCreateDataRaw, filters.search2, filters.date_start, filters.date_end]);

    const currentWaitingCreatePageData = useMemo(() => {
        return waitingCreateData.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
    }, [waitingCreateData, filters.page, filters.limit]);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Modal States (RFQ Form only — QT modal removed, belongs to QT page)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRFQId, setSelectedRFQId] = useState<number | null>(null);
    const [initialPRForCreate, setInitialPRForCreate] = useState<PRHeader | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isInviteMode, setIsInviteMode] = useState(false);

    // Send RFQ Modal State (replaces old ConfirmationModal)
    const [sendingRFQ, setSendingRFQ] = useState<RFQHeader | null>(null);

    // Handlers

    const handleCreate = () => {
        setInitialPRForCreate(null);
        setSelectedRFQId(null);
        setIsReadOnly(false);
        setIsInviteMode(false);
        setIsModalOpen(true);
    };

    const handleCreateWithPR = useCallback((pr: PRHeader) => {
        setInitialPRForCreate(pr);
        setSelectedRFQId(null);
        setIsReadOnly(false);
        setIsInviteMode(false);
        setIsModalOpen(true);
    }, []);

    const handleView = useCallback((id: number) => {
        setSelectedRFQId(id);
        setIsReadOnly(true);
        setIsInviteMode(false);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((item: RFQHeader) => {
        setSelectedRFQId(item.rfq_id);
        setIsReadOnly(false);
        setIsInviteMode(false);
        setIsModalOpen(true);
    }, []);


    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRFQId(null);
        setInitialPRForCreate(null);
        setIsReadOnly(false);
        setIsInviteMode(false);
    };

    // --- Send RFQ: opens Pre-flight modal ---
    const handleSendRFQ = useCallback((rfq: RFQHeader) => {
        setSendingRFQ(rfq);
    }, []);

    const executeSendRFQ = async (
        batchData: Array<{ rfqVendorId: number; payload: SendRFQToVendorPayload }>
    ) => {
        if (!sendingRFQ || batchData.length === 0) return;

        // 🚀 Optimistic Background: Close Modal instantly
        const rfqNo = sendingRFQ.rfq_no;
        toast(`กำลังส่งอีเมล RFQ ${rfqNo} รอดำเนินการ`, 'info');
        setSendingRFQ(null);

        Promise.allSettled(
            batchData.map(item => RFQService.sendToVendor(item.rfqVendorId, item.payload))
        ).then(results => {
            const failures = results.filter(r => r.status === 'rejected');
            const successes = results.filter(r => r.status === 'fulfilled');

            if (successes.length > 0) {
                toast(`ส่ง RFQ ${rfqNo} เรียบร้อยแล้ว (${successes.length} รายการ)`, 'success');
            }

            if (failures.length > 0) {
                logger.error('[RFQListPage] Some RFQ sends failed:', failures);
                // We keep it quiet on the UI if at least some succeeded, or show a gentle warning
                if (successes.length === 0) {
                    toast('การส่ง RFQ ล้มเหลว กรุณาตรวจสอบการตั้งค่าอีเมล', 'error');
                }
            }

            if (String(sendingRFQ.status || '').toUpperCase() === 'DRAFT' && failures.length < batchData.length) {
                // If at least 1 sent successfully
                const rfqData = sendingRFQ as unknown as Record<string, unknown>;
                const updatePayload: Record<string, unknown> = {
                    requested_by_user_id: Number(sendingRFQ.requested_by_user?.employee_id || rfqData.requested_by_user_id || 1),
                    rfq_date: sendingRFQ.rfq_date,
                    quotation_due_date: sendingRFQ.quotation_due_date || sendingRFQ.rfq_date,
                    pr_id: Number(sendingRFQ.pr_id || 0),
                    pr_approval_id: Number(sendingRFQ.pr_approval_id || (rfqData.pr_approval as Record<string, unknown>)?.approval_id || rfqData.prApprovalId || 0),
                    branch_id: Number(sendingRFQ.branch_id || 1),
                    rfq_base_currency_code: sendingRFQ.rfq_base_currency_code || 'THB',
                    rfq_quote_currency_code: sendingRFQ.rfq_quote_currency_code || 'THB',
                    rfq_exchange_rate: Number(sendingRFQ.rfq_exchange_rate || 1),
                    rfq_exchange_rate_date: sendingRFQ.rfq_exchange_rate_date || sendingRFQ.rfq_date,
                    requested_by: rfqData.requested_by || 
                                  (sendingRFQ.requested_by_user 
                                      ? `${sendingRFQ.requested_by_user.employee_firstname_th} ${sendingRFQ.requested_by_user.employee_lastname_th}`.trim() 
                                      : 'System'),
                    purpose: sendingRFQ.purpose || 'RFQ Dispatch',
                    responded_vendors_count: Number(sendingRFQ.responded_vendors_count || 0),
                    sent_vendors_count: Number(sendingRFQ.sent_vendors_count || 0),
                    status: 'SENT'
                };

                RFQService.update(sendingRFQ.rfq_id, updatePayload)
                    .then(() => {
                        toast('สถานะปรับเป็น ส่งแล้ว', 'info');
                        queryClient.invalidateQueries({ queryKey: ['rfqs'] });
                    }).catch(err => logger.error('[RFQListPage] Status update failed:', err));
            }

            // Always invalidate to get fresh X/Y counters
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['rfqs'] });
                handleApplyFilters();
            }, 100);
        }).catch(err => {
            logger.error('[RFQListPage] executeSendRFQ background error:', err);
        });
    };

    // Columns
    const columnHelper = createColumnHelper<RFQHeader>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full tabular-nums text-sm text-gray-600 dark:text-gray-400">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'ข้อมูล RFQ',
            cell: (info) => {
                const item = info.row.original;
                const prNumber = item.ref_pr_no || item.pr_no || item.pr?.pr_no;
                const itemData = item as unknown as Record<string, unknown>;

                return (
                    <div className="flex flex-col py-2 gap-1.5">
                        <span 
                            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors" 
                            title={info.getValue() as string}
                            onClick={() => handleView(item.rfq_id)}
                        >
                            {info.getValue() as string}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <PRNumberCell prId={item.pr_id} fallbackNo={prNumber} />
                            <AVNumberCell 
                                prNo={prNumber} 
                                fallbackNo={String(item.approved_pr_no || itemData.ref_approved_pr_no || itemData.refApprovedPrNo || itemData.pr_approval_no || itemData.approval_no || (itemData.pr_approval as Record<string, unknown>)?.approval_no || '')} 
                                approvalId={Number(item.pr_approval_id || (itemData.pr_approval as Record<string, unknown>)?.approval_id || 0)}
                            />
                        </div>
                    </div>
                );
            },
            size: 200,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'purpose',
            header: 'หมายเหตุ',
            cell: ({ row }) => {
                const item = row.original;
                // API list endpoint ไม่ส่ง `purpose` มาโดยตรง — fallback ไปใช้บรรทัดแรกของ remarks
                const purposeText = item.purpose || item.remarks?.split('\n')[0]?.trim() || '-';
                return (
                    <div className="max-w-[250px] truncate py-2" title={purposeText}>
                        {purposeText}
                    </div>
                );
            },
            size: 250,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'creator',
            header: 'ผู้สร้าง RFQ',
            cell: ({ row }) => {
                const item = row.original;
                const u = item.requested_by_user;
                const creatorName = u
                    ? `${u.employee_firstname_th} ${u.employee_lastname_th}`.trim()
                    : (item.created_by_name || item.creator_name || '-');
                return (
                    <div className="flex flex-col py-2">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {creatorName}
                        </span>
                        <span className="text-xs text-gray-400">
                            {formatThaiDate(item.rfq_date)}
                        </span>
                    </div>
                );
            },
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_due_date', {
            header: 'ครบกำหนด',
            cell: (info) => {
                const dateStr = info.getValue();
                if (!dateStr) return <span className="text-slate-400 py-2 block text-center">-</span>;

                // Smart date color: Overdue → rose, Approaching (0-3 days) → amber, Future → slate
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(dateStr);
                dueDate.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                let colorClass = 'text-slate-600 dark:text-slate-400'; // Future (> 3 days)
                if (diffDays < 0) {
                    colorClass = 'text-rose-600 dark:text-rose-400 font-semibold'; // Overdue
                } else if (diffDays <= 3) {
                    colorClass = 'text-amber-600 dark:text-amber-400 font-semibold'; // Approaching
                }

                return (
                    <span className={`${colorClass} whitespace-nowrap py-2 block`}>
                        {formatThaiDate(dateStr)}
                    </span>
                );
            },
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'vendors',
            header: () => <div className="flex justify-center items-center w-full h-full">ผู้ขาย (ส่ง/ทั้งหมด)</div>,
            cell: ({ row }) => {
                const item = row.original;
                const { sentCount, total } = deriveRFQCounter(item);

                return (
                    <div className="flex flex-col items-center justify-center h-full py-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium tabular-nums leading-none mb-0.5">
                            {`${sentCount} / ${total}`}
                        </span>
                    </div>
                );
            },
            size: 80,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="flex justify-center items-center w-full h-full">สถานะ</div>,
            cell: (info) => {
                const item = info.row.original;
                
                const dynamicStatus = getDynamicStatus(item);

                return (
                    <div className="flex justify-center items-center h-full py-2">
                        <RFQStatusBadge status={dynamicStatus as RFQStatus} />
                    </div>
                );
            },
            size: 100,
            enableSorting: false,
        }),
        // ==========================================================================
        // ACTION COLUMN — Strict State Machine
        // Role: RFQ = "Request Manager & Monitor" ONLY
        // Data entry → QTListPage | Comparison → QCListPage
        // ==========================================================================
        columnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full h-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                // const dynamicStatus = getDynamicStatus(item); // Unused for actions but available if needed
                const { sentCount, total } = deriveRFQCounter(item);
                const isTerminal = ['CLOSED', 'CANCELLED', 'COMPLETED'].includes(item.status);
                
                return (
                    <div className="flex flex-row items-center justify-center gap-2 w-full h-full py-1 whitespace-nowrap">
                        
                        {/* Eye — always visible */}
                        <button 
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                            title="ดูรายละเอียด"
                            onClick={() => handleView(item.rfq_id)}
                        >
                            <Eye size={16} />
                        </button>

                        {/* Print Preview — always visible */}
                        <button 
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all"
                            title="พิมพ์ / Print Preview"
                            onClick={() => window.open(`/print/rfq/${item.rfq_id}`, '_blank')}
                        >
                            <Printer size={16} />
                        </button>
                        
                        {!isTerminal && (
                            <>
                                {/* Always show Edit for active statuses */}
                                <button 
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                    title="แก้ไข"
                                    onClick={() => handleEdit(item)}
                                >
                                    <Edit size={14} />
                                    <span className="text-[10px] font-bold">แก้ไข</span>
                                </button>
                                
                                {/* Send More / Send RFQ: Show only if remaining vendors exist */}
                                {sentCount < total && (
                                    <button 
                                        className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                        title={sentCount === 0 ? "ส่ง RFQ" : "ส่งเพิ่ม"}
                                        onClick={() => handleSendRFQ(item)}
                                    >
                                        <Send size={12} /> {sentCount === 0 ? "ส่ง RFQ" : "ส่งเพิ่ม"}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                );
            },
            size: 220, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleView, handleEdit, handleSendRFQ]);

    const prColumnHelper = createColumnHelper<PRHeader>();

    const waitingCreateColumns = useMemo(() => [
        prColumnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full tabular-nums text-sm text-gray-600 dark:text-gray-400">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 60,
            enableSorting: false,
        }),
        prColumnHelper.accessor('pr_no', {
            header: 'เลขที่ PR',
            cell: (info) => (
                <span className="font-bold text-teal-700 dark:text-teal-400 py-2 block whitespace-nowrap">
                    {info.getValue() as string}
                </span>
            ),
            size: 150,
            enableSorting: false,
        }),
        prColumnHelper.accessor('pr_date', {
            header: 'วันที่',
            cell: (info) => {
                const val = info.getValue() as string;
                return (
                    <span className="text-gray-600 dark:text-gray-300 py-2 block whitespace-nowrap tabular-nums">
                        {formatThaiDate(val)}
                    </span>
                );
            },
            size: 120,
            enableSorting: false,
        }),
        prColumnHelper.accessor('requester_name', {
            header: 'ผู้ขอ',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 py-2 block whitespace-nowrap">
                    {info.getValue() as string || '-'}
                </span>
            ),
            size: 150,
            enableSorting: false,
        }),
        prColumnHelper.display({
            id: 'purpose',
            header: 'วัตถุประสงค์ / หมายเหตุ',
            cell: ({ row }) => {
                const item = row.original;
                const displayRemark = item.remark || item.purpose || '-';
                return (
                    <div className="max-w-[250px] truncate py-2 text-gray-500 dark:text-gray-400" title={displayRemark}>
                        {displayRemark}
                    </div>
                );
            },
            size: 200,
            enableSorting: false,
        }),
        prColumnHelper.display({
            id: 'total_amount',
            header: () => <div className="flex justify-end items-center h-full w-full">ยอดรวม</div>,
            cell: ({ row }) => {
                const item = row.original;
                const amount = item.total_amount != null ? item.total_amount : item.pr_base_total_amount;
                const displayTotal = amount != null && amount !== ''
                    ? Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '-';
                return (
                    <div className="flex justify-end items-center h-full text-gray-700 dark:text-gray-200 font-bold tabular-nums text-sm py-2 pr-2">
                        {displayTotal}
                    </div>
                );
            },
            size: 50,
            enableSorting: false,
        }),
        prColumnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center h-full w-full">จัดการ</div>,
            cell: ({ row }) => {
                const pr = row.original;
                return (
                    <div className="flex justify-center items-center h-full py-1">
                        <button
                            type="button"
                            onClick={() => handleCreateWithPR(pr)}
                            className="inline-flex items-center justify-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                        >
                            <Plus size={14} className="mr-1" />
                            สร้าง RFQ
                        </button>
                    </div>
                );
            },
            size: 120,
            enableSorting: false,
        })
    ], [prColumnHelper, filters.page, filters.limit, handleCreateWithPR]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    // Filter Config
    // Filter Config Removed in favor of manual layout

    return (
        <>
            <PageListLayout
                title="รายการขอใบเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="blue"
                totalCount={activeTab === 'WAITING_CREATE' ? waitingCreateData.length : data?.total}
                totalCountLoading={activeTab === 'WAITING_CREATE' ? isWaitingCreateLoading : isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ RFQ"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="RFQ-xxx"
                            accentColor="blue"
                            disabled={activeTab === 'WAITING_CREATE'}
                        />
                        <FilterField
                            label="PR อ้างอิง"
                            value={localFilters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ผู้สร้าง RFQ"
                            value={localFilters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="ชื่อผู้สร้าง"
                            accentColor="blue"
                            disabled={activeTab === 'WAITING_CREATE'}
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={localFilters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={RFQ_STATUS_OPTIONS}
                            accentColor="blue"
                            disabled={activeTab === 'WAITING_CREATE'}
                        />
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={localFilters.date_start || ''}
                            onChange={(val: string) => handleFilterChange('date_start', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={localFilters.date_end || ''}
                            onChange={(val: string) => handleFilterChange('date_end', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                >
                                    ล้างค่า
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้าง RFQ
                            </button>
                        </div>
                    </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
                    {/* ===== Tabs Header ===== */}
                    <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-4 px-2">
                        <button
                            onClick={() => handleTabChange('ALL')}
                            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'ALL'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            รายการขอใบเสนอราคาทั้งหมด
                        </button>
                        <button
                            onClick={() => handleTabChange('WAITING_CREATE')}
                            className={`flex justify-between items-center py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'WAITING_CREATE'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            รอสร้างใบเสนอราคา
                        </button>
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
                        {activeTab === 'ALL' && (
                            <SmartTable
                                data={data?.data ?? []}
                                columns={columns}
                                isLoading={isLoading}
                                pagination={{
                                    pageIndex: filters.page,
                                    pageSize: filters.limit,
                                    totalCount: data?.total ?? 0,
                                    onPageChange: handlePageChange,
                                    onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                                }}
                                sortConfig={sortConfig}
                                onSortChange={handleSortChange}
                                rowIdField="rfq_id"
                                className="flex-1"
                            />
                        )}
                        {activeTab === 'WAITING_CREATE' && (
                            <SmartTable
                                data={currentWaitingCreatePageData as PRHeader[]}
                                columns={waitingCreateColumns as ColumnDef<PRHeader>[]}
                                isLoading={isWaitingCreateLoading}
                                pagination={{
                                    pageIndex: filters.page,
                                    pageSize: filters.limit,
                                    totalCount: waitingCreateData.length,
                                    onPageChange: handlePageChange,
                                    onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                                }}
                                rowIdField="pr_id"
                                className="flex-1"
                            />
                        )}
                    </div>

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    {activeTab === 'ALL' && (
                        <MobileListContainer
                            isLoading={isLoading}
                            isEmpty={!data?.data.length}
                            pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                        >
                        {data?.data.map((item) => {
                            const prNumber = item.ref_pr_no || item.pr_no || item.pr?.pr_no;
                            const dynamicStatus = getDynamicStatus(item);
                            const sentCount = item.vendor_sent ?? item.sent_vendors_count ?? 0;
                            const total = item.vendor_total ?? item.vendor_count ?? 0;
                            const isTerminal = ['CLOSED', 'CANCELLED', 'COMPLETED'].includes(item.status);
                            
                            return (
                                <MobileListCard
                                    key={item.rfq_id}
                                    title={item.rfq_no}
                                    subtitle={formatThaiDate(item.rfq_date)}
                                    statusBadge={<RFQStatusBadge status={dynamicStatus} />}
                                    details={[
                                        ...((item.pr_id || prNumber) ? [{ label: 'PR / AV:', value: (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <PRNumberCell prId={item.pr_id} fallbackNo={prNumber} />
                                                <AVNumberCell 
                                                    prNo={prNumber}
                                                    fallbackNo={item.approved_pr_no} 
                                                />
                                            </div>
                                        ) }] : []),
                                        { label: 'ผู้สร้าง:', value: (() => {
                                            const u = item.requested_by_user;
                                            return u
                                                ? `${u.employee_firstname_th} ${u.employee_lastname_th}`.trim()
                                                : (item.created_by_name || item.creator_name || '-');
                                        })() },
                                        { label: 'Vendors:', value: (() => {
                                            const rfqVendors = item.rfqVendors || item.vendors;
                                            let sentCount = item.sent_vendors_count || 0;
                                            let total = item._count?.rfqVendors ?? item.vendor_count ?? 0;
                                            if (Array.isArray(rfqVendors)) {
                                                total = rfqVendors.length;
                                                sentCount = rfqVendors.filter(v => v.status === 'SENT').length;
                                            }
                                            return `${sentCount} / ${total} ราย`;
                                        })() },
                                        ...(item.quotation_due_date ? [{ label: 'ครบกำหนด:', value: formatThaiDate(item.quotation_due_date) }] : []),
                                    ]}
                                    actions={
                                        <>
                                            <button
                                                onClick={() => handleView(item.rfq_id)}
                                                className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>
                                            {!isTerminal && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="flex-1 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Edit size={14} /> แก้ไข
                                                    </button>
                                                    {sentCount < total && (
                                                        <button
                                                            onClick={() => handleSendRFQ(item)}
                                                            className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                        >
                                                            <Send size={14} /> {sentCount === 0 ? "ส่ง RFQ" : "ส่งเพิ่ม"}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    }
                                />
                            );
                        })}
                        </MobileListContainer>
                    )}

                    {activeTab === 'WAITING_CREATE' && (
                        <MobileListContainer
                            isLoading={isWaitingCreateLoading}
                            isEmpty={!currentWaitingCreatePageData.length}
                            pagination={waitingCreateData.length ? { page: filters.page, total: waitingCreateData.length, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                        >
                            {currentWaitingCreatePageData.map((item: PRHeader) => {
                                const amount = item.total_amount != null ? item.total_amount : item.pr_base_total_amount;
                                const displayTotal = amount != null && amount !== ''
                                    ? Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '-';
                                    
                                return (
                                    <MobileListCard
                                        key={item.pr_id}
                                        title={<span className="font-bold text-teal-700 dark:text-teal-400">{item.pr_no}</span>}
                                        subtitle={item.pr_date?.includes('T') ? item.pr_date.split('T')[0] : item.pr_date}
                                        statusBadge={<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">รอสร้าง</span>}
                                        details={[
                                            { label: 'ผู้ขอ:', value: item.requester_name || '-' },
                                            { label: 'ยอดรวม:', value: displayTotal },
                                            { label: 'วัตถุประสงค์:', value: item.remark || item.purpose || '-' }
                                        ]}
                                        actions={
                                            <button
                                                onClick={() => handleCreateWithPR(item)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <Plus size={14} /> สร้าง RFQ
                                            </button>
                                        }
                                    />
                                );
                            })}
                        </MobileListContainer>
                    )}
                </div>

            </PageListLayout>

            {isModalOpen && (
                <RFQFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    editId={selectedRFQId}
                    initialPR={initialPRForCreate}
                    readOnly={isReadOnly}
                    isInviteMode={isInviteMode}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['rfqs'] });
                        handleApplyFilters();
                        handleCloseModal();
                    }}
                />
            )}

            {/* ===== Pre-flight Review: ส่ง RFQ ===== */}
            <RFQSendConfirmModal
                isOpen={!!sendingRFQ}
                rfq={sendingRFQ}
                onClose={() => setSendingRFQ(null)}
                onConfirm={executeSendRFQ}
                isLoading={false}
            />
        </>
    );
}