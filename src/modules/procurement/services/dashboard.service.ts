import { POService } from './po.service';
import { POAService } from './poa.service';
import { AVService } from './av.service';
import { GRNService } from './grn.service';
import { logger } from '@/shared/utils/logger';
import type { 
    POListItem, 
    PRHeader, 
    GRNListItem, 
    ApprovalHeader
} from '../types';

export interface DashboardKPI {
    prPending: number;
    poPending: number;
    poPendingReceipt: number;
    pendingReceiptValue: number;
}

export interface DashboardSummary {
    monthlyPurchase: number;
    yearlyPurchase: number;
    avgLeadTime: number;
    conversionRate: number;
    statusOverview: {
        normal: number;
        approaching: number;
        overdue: number;
    };
}

export interface VendorPieItem {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

export interface TrendItem {
    month: string;
    value: number;
    [key: string]: string | number;
}

export interface LeadTimeItem {
    process: string;
    days: number;
    [key: string]: string | number;
}

export interface FollowUpItem {
    id: string;
    vendor: string;
    deliveryDate: string;
    status: string;
    daysLeft: number;
}

export interface DashboardData {
    kpi: DashboardKPI;
    summary: DashboardSummary;
    charts: {
        vendorPie: VendorPieItem[];
        purchaseTrend: TrendItem[];
        leadTimeData: LeadTimeItem[];
        followUpList: FollowUpItem[];
    };
    alerts: { message: string; type: string }[];
}

export const ProcurementDashboardService = {
    getDashboardData: async (): Promise<DashboardData> => {
        logger.info('[ProcurementDashboardService] Fetching Dashboard Data');

        try {
            // 1. Fetch data in parallel
            // 1. Fetch data in parallel (Combining PR list and PR approval list for accuracy)
            const [prRes, prAppRes, poRes, poaRes, grnRes] = await Promise.allSettled([
                AVService.getPendingPRs({ limit: 200 }), // Main PR list with PENDING status
                AVService.getApprovalList({ limit: 200 }), // PR Approval list
                POService.getList({ limit: 1000 }), 
                POAService.getList({ limit: 200 }),
                GRNService.getList({ limit: 1000 })
            ]);

            // Helper to extract data safely
            const extractData = <T>(res: PromiseSettledResult<unknown>): T[] => {
                if (res.status !== 'fulfilled') return [];
                const val = res.value as Record<string, unknown> | T[];
                if (Array.isArray(val)) return val;
                return (val.data || val.items || []) as T[];
            };

            const allPRs = extractData<PRHeader>(prRes);
            const allPRApps = extractData<ApprovalHeader>(prAppRes);
            const allPOs = extractData<POListItem>(poRes);
            const allPendingPOs = extractData<POListItem>(poaRes);
            const allGRNs = extractData<GRNListItem>(grnRes);

            // 2. Client-side Status Check (Handles WAITING/PENDING variation)
            const isPending = (s?: string): boolean => {
                const status = (s || '').toUpperCase();
                return ['PENDING', 'WAITING', 'PENDING_APPROVAL', 'WAITING_FOR_APPROVE', 'WAITING_FOR_APPROVAL'].includes(status);
            };

            // Combine PRs from both sources and ensure unique by PR number
            const combinedPendingPRs = [...allPRs, ...allPRApps].filter((pr) => {
                const raw = pr as unknown as Record<string, unknown>;
                const prInner = raw.pr as unknown as Record<string, unknown> | undefined;
                return isPending((raw.status as string) || (prInner && (prInner.status as string)));
            });
            const uniquePendingPRsMap = new Map<string, PRHeader | ApprovalHeader>();
            combinedPendingPRs.forEach(pr => {
                const raw = pr as unknown as Record<string, unknown>;
                const prInner = raw.pr as unknown as Record<string, unknown> | undefined;
                const prNo = (raw.pr_no || (prInner && prInner.pr_no) || raw.approval_no) as string | undefined;
                if (prNo && !uniquePendingPRsMap.has(prNo)) {
                    uniquePendingPRsMap.set(prNo, pr);
                }
            });
            const pendingPRs = Array.from(uniquePendingPRsMap.values());
            const pendingPOs = allPendingPOs.filter((po: POListItem) => isPending(po.status));

            // 3. Calculate KPIs
            const prPendingCount = pendingPRs.length;
            const poPendingCount = pendingPOs.length;
            
            // Helper to get amount safely (handles potential field name variations, strings, and nested headers)
            const getAmount = (item: unknown): number => {
                if (!item) return 0;
                const raw = item as unknown as Record<string, unknown>;
                const header = (raw.poHeader || raw.po_header || raw.pr || raw) as unknown as Record<string, unknown>;
                const val = (raw.total_amount ?? raw.base_total_amount ?? raw.net_amount ?? raw.grand_total ?? raw.total ??
                           header.total_amount ?? header.base_total_amount ?? header.net_amount ?? header.grand_total ?? header.total ?? 0) as string | number;
                return typeof val === 'string' ? parseFloat(val) || 0 : Number(val || 0);
            };

            // Helper to get date safely
            const getDateStr = (item: unknown): string | null => {
                if (!item) return null;
                const raw = item as unknown as Record<string, unknown>;
                const header = (raw.poHeader || raw.po_header || raw.pr || raw) as unknown as Record<string, unknown>;
                return (raw.po_date || raw.pr_date || raw.date || raw.created_at || 
                       header.po_date || header.pr_date || header.date || header.created_at || null) as string | null;
            };

            // PO Pending Receipt: POs that are APPROVED but not COMPLETED/RECEIVED
            const poPendingReceiptItems = allPOs.filter((po: POListItem) => 
                (po.status === 'APPROVED' || po.status === 'ISSUED') && 
                !allGRNs.some((grn: GRNListItem) => String((grn as unknown as Record<string, unknown>).po_no) === String(po.po_no))
            );
            const poPendingReceiptCount = poPendingReceiptItems.length;
            const pendingReceiptValue = poPendingReceiptItems.reduce((sum: number, po: POListItem) => sum + getAmount(po), 0);

            // 4. Calculate Summary
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            logger.debug(`[ProcurementDashboardService] Analyzing ${allPOs.length} POs. Current: ${currentMonth+1}/${currentYear}`);

            const monthlyPurchase = allPOs
                .filter((po: POListItem) => {
                    const ds = getDateStr(po);
                    if (!ds) return false;
                    const d = new Date(ds);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && po.status !== 'REJECTED' && po.status !== 'CANCELLED';
                })
                .reduce((sum: number, po: POListItem) => sum + getAmount(po), 0);

            const yearlyPurchase = allPOs
                .filter((po: POListItem) => {
                    const ds = getDateStr(po);
                    if (!ds) return false;
                    const d = new Date(ds);
                    return d.getFullYear() === currentYear && po.status !== 'REJECTED' && po.status !== 'CANCELLED';
                })
                .reduce((sum: number, po: POListItem) => sum + getAmount(po), 0);

            logger.debug(`[ProcurementDashboardService] Result -> Monthly: ${monthlyPurchase}, Yearly: ${yearlyPurchase}`);

            // Lead Time Calculation: Days between PR and PO
            let totalLeadTimeDays = 0;
            let leadTimeCount = 0;
            
            allPOs.forEach((po: POListItem) => {
                const poData = po as unknown as Record<string, unknown>;
                const poDateStr = getDateStr(po);
                const prDateStr = (poData.pr_date || (poData.pr && (poData.pr as unknown as Record<string, unknown>).pr_date) || poData.pr_created_at) as string | undefined;

                if (poDateStr && prDateStr) {
                    const poDate = new Date(poDateStr);
                    const prDate = new Date(prDateStr);
                    if (!isNaN(poDate.getTime()) && !isNaN(prDate.getTime())) {
                        const diffTime = poDate.getTime() - prDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays >= 0) {
                            totalLeadTimeDays += diffDays;
                            leadTimeCount++;
                        }
                    }
                }
            });
            const avgLeadTime = leadTimeCount > 0 ? Number((totalLeadTimeDays / leadTimeCount).toFixed(1)) : 0;

            // 5. Vendor Distribution (Pie Chart)
            const vendorTotals: Record<string, number> = {};
            allPOs.forEach((po: POListItem) => {
                if (po.status === 'REJECTED' || po.status === 'CANCELLED') return;
                const name = po.vendor_name || 'ไม่ระบุ';
                vendorTotals[name] = (vendorTotals[name] || 0) + getAmount(po);
            });

            const totalValue = Object.values(vendorTotals).reduce((a: number, b: number) => a + b, 0);
            const colors = ['#3b82f6', '#22c55e', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#64748b'];
            
            const vendorPie: VendorPieItem[] = Object.entries(vendorTotals)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, value], idx) => ({
                    name,
                    value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
                    color: colors[idx % colors.length]
                }));

            // 6. Purchase Trend (Line Chart)
            const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const trendData: TrendItem[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(1); // Set to 1st of month to avoid overflow issues (e.g. Feb 30 -> March)
                d.setMonth(d.getMonth() - i);
                const m = d.getMonth();
                const y = d.getFullYear();
                const monthLabel = months[m];
                const value = allPOs
                    .filter((po: POListItem) => {
                        const ds = getDateStr(po);
                        if (!ds) return false;
                        const pod = new Date(ds);
                        return pod.getMonth() === m && pod.getFullYear() === y && po.status !== 'REJECTED' && po.status !== 'CANCELLED';
                    })
                    .reduce((sum: number, po: POListItem) => sum + getAmount(po), 0);
                trendData.push({ month: monthLabel, value });
            }



            // 7. Follow-up List (Real Data)
            // Show POs that are nearing delivery or overdue and not yet received
            const followUpList: FollowUpItem[] = allPOs
                .filter((po: POListItem) => {
                    if (po.status !== 'APPROVED' && po.status !== 'ISSUED') return false;
                    const isReceived = allGRNs.some((grn: GRNListItem) => String((grn as unknown as Record<string, unknown>).po_no) === String(po.po_no));
                    if (isReceived) return false;
                    
                    const ddStr = (po.delivery_date || (po as unknown as Record<string, unknown>).delivery_date) as string | undefined;
                    if (!ddStr) return false;
                    
                    const dd = new Date(ddStr);
                    const diffDays = Math.ceil((dd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Show if overdue (negative) or due within next 7 days
                    return diffDays <= 7;
                })
                .sort((a: POListItem, b: POListItem) => {
                    const da = new Date((a.delivery_date || (a as unknown as Record<string, unknown>).delivery_date || 0) as string | number).getTime();
                    const db = new Date((b.delivery_date || (b as unknown as Record<string, unknown>).delivery_date || 0) as string | number).getTime();
                    return da - db;
                })
                .slice(0, 10)
                .map((po: POListItem) => {
                    const ddStr = (po.delivery_date || (po as unknown as Record<string, unknown>).delivery_date || '') as string;
                    const dd = new Date(ddStr);
                    const diffDays = Math.ceil((dd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return {
                        id: po.po_no || '-',
                        vendor: po.vendor_name || 'ไม่ระบุ',
                        deliveryDate: ddStr.split('T')[0],
                        status: diffDays < 0 ? 'Overdue' : (diffDays === 0 ? 'Due Today' : 'Upcoming'),
                        daysLeft: diffDays
                    };
                });

            // 8. Calculate Status Overview (Real Data)
            // Traffic Light System: Normal (Green), Approaching (Yellow - within 3 days), Overdue (Red - past due)
            let normalCount = 0;
            let approachingCount = 0; 
            let overdueCount = 0;

            const approachingThreshold = 3; // days

            // Check PRs (Pending and past Need By Date)
            pendingPRs.forEach((pr) => {
                const rawPr = pr as unknown as Record<string, unknown>;
                const prInner = rawPr.pr as unknown as Record<string, unknown> | undefined;
                const needByDateStr = (rawPr.need_by_date || (prInner && prInner.need_by_date)) as string | undefined;
                if (needByDateStr) {
                    const needByDate = new Date(needByDateStr);
                    const diffDays = Math.ceil((needByDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) overdueCount++;
                    else if (diffDays <= approachingThreshold) approachingCount++;
                    else normalCount++;
                } else {
                    normalCount++;
                }
            });

            // Check POs (Delivery vs Receipt)
            allPOs.forEach((po: POListItem) => {
                if (po.status === 'CANCELLED' || po.status === 'REJECTED' || po.status === 'DRAFT') return;
                
                const deliveryDateStr = (po.delivery_date || (po as unknown as Record<string, unknown>).delivery_date) as string | undefined;
                if (!deliveryDateStr) {
                    normalCount++;
                    return;
                }

                const deliveryDate = new Date(deliveryDateStr);
                const isReceived = allGRNs.some((grn: GRNListItem) => String((grn as unknown as Record<string, unknown>).po_no) === String(po.po_no));
                
                if (isReceived) {
                    // If received, it's either Normal or it WAS delayed (but for the current status overview, we count it as Normal/Completed)
                    normalCount++;
                } else {
                    const diffDays = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) overdueCount++;
                    else if (diffDays <= approachingThreshold) approachingCount++;
                    else normalCount++;
                }
            });

            const totalStatus = normalCount + approachingCount + overdueCount;
            const statusOverview = {
                normal: totalStatus > 0 ? Math.round((normalCount / totalStatus) * 100) : 100,
                approaching: totalStatus > 0 ? Math.round((approachingCount / totalStatus) * 100) : 0,
                overdue: totalStatus > 0 ? Math.round((overdueCount / totalStatus) * 100) : 0,
            };

            // 9. Calculate PO -> GRN Lead Time (Real Data)
            let totalPOtoGRNDays = 0;
            let poToGRNCount = 0;

            allGRNs.forEach((grn: GRNListItem) => {
                const po = allPOs.find((p: POListItem) => String(p.po_no) === String((grn as unknown as Record<string, unknown>).po_no));
                if (po) {
                    const poDate = new Date(getDateStr(po) || '');
                    const grnDate = new Date(getDateStr(grn) || '');
                    if (!isNaN(poDate.getTime()) && !isNaN(grnDate.getTime())) {
                        const diff = grnDate.getTime() - poDate.getTime();
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        if (days >= 0) {
                            totalPOtoGRNDays += days;
                            poToGRNCount++;
                        }
                    }
                }
            });
            const avgPOtoGRNTime = poToGRNCount > 0 ? Number((totalPOtoGRNDays / poToGRNCount).toFixed(1)) : 7;
            
            // 10. Alerts (Real Data)
            const alerts: { message: string; type: string }[] = [];
            allPOs.forEach((po: POListItem) => {
                if (po.status !== 'APPROVED' && po.status !== 'ISSUED') return;
                const deliveryDateStr = (po.delivery_date || (po as unknown as Record<string, unknown>).delivery_date) as string | undefined;
                if (deliveryDateStr) {
                    const deliveryDate = new Date(deliveryDateStr);
                    if (deliveryDate < now && !allGRNs.some((grn: GRNListItem) => String((grn as unknown as Record<string, unknown>).po_no) === String(po.po_no))) {
                        alerts.push({ message: `PO ${po.po_no} เกินกำหนดส่งของ`, type: 'warning' });
                    }
                }
            });

            if (prPendingCount > 10) {
                alerts.push({ message: `มีใบ PR รออนุมัติจำนวนมาก (${prPendingCount} รายการ)`, type: 'info' });
            }

            // 11. Calculate Conversion Rate (PR -> PO)
            // Analyzing conversion from the fetched set of PRs (allPRs contains various statuses)
            const totalPRsInSample = allPRs.length;
            const convertedPRsCount = allPRs.filter((pr) => {
                const rawPr = pr as unknown as Record<string, unknown>;
                const status = (rawPr.status || '').toString().toUpperCase();
                return status === 'COMPLETED' || status === 'APPROVED' || !!rawPr.po_no || !!rawPr.po_id;
            }).length;
            
            const conversionRate = totalPRsInSample > 0 ? Math.round((convertedPRsCount / totalPRsInSample) * 100) : 0;

            return {
                kpi: {
                    prPending: prPendingCount,
                    poPending: poPendingCount,
                    poPendingReceipt: poPendingReceiptCount,
                    pendingReceiptValue,
                },
                summary: {
                    monthlyPurchase,
                    yearlyPurchase,
                    avgLeadTime: avgLeadTime || 0,
                    statusOverview,
                    conversionRate: conversionRate || 0
                },
                charts: {
                    vendorPie,
                    purchaseTrend: trendData,
                    leadTimeData: [
                        { process: 'PR→PO (อนุมัติ)', days: avgLeadTime || 0 },
                        { process: 'PO→GRN (ส่งมอบ)', days: avgPOtoGRNTime || 0 },
                    ],
                    followUpList
                },
                alerts: alerts.length > 0 ? alerts : [
                    { message: 'ไม่มีการแจ้งเตือนเร่งด่วนในขณะนี้', type: 'info' }
                ]
            };


        } catch (error) {
            logger.error('[ProcurementDashboardService] Failed to fetch dashboard data', error);
            throw error;
        }
    }
};
