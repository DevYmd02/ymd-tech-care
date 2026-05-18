/**
 * @file ProcurementDashboard.tsx
 * @description Dashboard สำหรับระบบจัดซื้อ (Procurement Module)
 * @route /procurement/dashboard
 * @purpose แสดงภาพรวม KPI, Charts และรายการรออนุมัติ ในดีไซน์โมเดิร์นระดับ Premium ERP
 * @updated รองรับ Real Data และความปลอดภัยด้านเลย์เอาต์เต็มร้อย
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import {
    FileText,
    ShoppingCart,
    Package,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Banknote,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    Filter,
    Download,
    SlidersHorizontal,
    Activity,
} from 'lucide-react';
import { Card } from '@ui';
import { ProcurementDashboardService, type DashboardData } from '../../services';
import { logger } from '@/shared/utils';

// Lazy load heavy chart components
const ProcurementCharts = lazy(() => import('./components/ProcurementCharts'));

const ChartSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        <div className="lg:col-span-8 h-[400px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
        <div className="lg:col-span-4 h-[400px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
        <div className="lg:col-span-7 h-[350px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
        <div className="lg:col-span-5 h-[350px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
    </div>
);

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

function GrowthIndicator({ growth, trend }: { growth: number; trend: 'up' | 'down' }) {
    const isUp = trend === 'up';
    return (
        <div className={`flex items-center gap-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'} font-bold text-sm`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(growth)}%
        </div>
    );
}

function StatusCard({ normal, approaching, overdue, conversionRate }: { normal: number; approaching: number; overdue: number; conversionRate: number }) {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-lg shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">สถานะภาพรวมคำสั่งซื้อ</h4>
                    <p className="text-[10px] font-semibold text-slate-400">ระบบคัดกรองอัตโนมัติรายวัน</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>
            
            <div className="space-y-2.5 flex-1">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">ปกติ (Normal)</span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{normal}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">ใกล้ครบกำหนด</span>
                    </div>
                    <span className="font-black text-amber-600 dark:text-amber-400">{approaching}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-bounce" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">เกินกำหนดส่งมอบ</span>
                    </div>
                    <span className="font-black text-rose-500">{overdue}%</span>
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 dark:text-gray-400 font-bold">อัตราการเปลี่ยน PR เป็น PO</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{conversionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                        style={{ width: `${conversionRate}%` }} 
                    />
                </div>
            </div>
        </Card>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function ProcurementDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Dashboard Data
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                if (refreshKey > 0) setIsRefreshing(true);
                else setLoading(true);

                const result = await ProcurementDashboardService.getDashboardData();
                setData(result);
            } catch (error) {
                logger.error('[ProcurementDashboard] Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
                setIsRefreshing(false);
            }
        };
        fetchDashboard();
    }, [refreshKey]);

    // Format Thai date
    const thaiDate = currentTime.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    // Format time
    const timeString = currentTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    if (loading && !data) {
        return (
            <div className="p-6 space-y-8 animate-pulse bg-[#f8fafc] dark:bg-slate-950/20 min-h-screen">
                <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}
                </div>
                <ChartSkeleton />
            </div>
        );
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val).replace('THB', '฿');
    };

    const kpiCards = [
        { label: 'PR รออนุมัติ (Pending PRs)', value: data?.kpi.prPending || 0, icon: FileText, color: 'indigo', growth: 12.5, subtitle: 'รอการลงนามอนุมัติ' },
        { label: 'PO รออนุมัติ (Pending POs)', value: data?.kpi.poPending || 0, icon: ShoppingCart, color: 'amber', growth: -8.2, subtitle: 'เอกสารอยู่ในสถานะร่าง/ส่งอนุมัติ' },
        { label: 'PO ค้างรับส่งมอบ (Pending Receipts)', value: data?.kpi.poPendingReceipt || 0, icon: Package, color: 'cyan', growth: 4.1, subtitle: 'ผู้จำหน่ายเลยกำหนดจัดส่งสินค้า' },
        { label: 'มูลค่าคำสั่งซื้อค้างรับ (Receipt Value)', value: formatCurrency(data?.kpi.pendingReceiptValue || 0), icon: Banknote, color: 'emerald', growth: 15.6, subtitle: 'ยอดค้างส่งมอบสะสม YTD' },
    ];

    return (
        <div className="p-6 space-y-8 bg-[#f8fafc] dark:bg-slate-950/20 min-h-screen">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Procurement Dashboard
                        </h1>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                            <Clock className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                            <span className="text-sm font-medium">{thaiDate} • </span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{timeString}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button 
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="flex-1 lg:flex-none h-10 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-bold">รีเฟรชข้อมูล</span>
                    </button>
                    <button className="flex-1 lg:flex-none h-10 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 transition-all shadow-sm">
                        <Filter className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold">กรองช่วงเวลา</span>
                    </button>
                    <button className="flex-1 lg:flex-none h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25">
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">ส่งออกสถิติ</span>
                    </button>
                </div>
            </div>

            {/* Top AI Insight & Analytics Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* AI Predictive Systems Recommendation */}
                <Card className="bg-gradient-to-br from-indigo-50/90 to-purple-50/60 dark:from-indigo-950 dark:to-slate-900 text-indigo-950 dark:text-white border border-indigo-100/80 dark:border-none shadow-xl shadow-indigo-100/40 dark:shadow-indigo-950/20 p-6 flex flex-col justify-between xl:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-5 pointer-events-none">
                        <Sparkles className="w-64 h-64 text-indigo-600 dark:text-indigo-200" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-300 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">AI Procurement Intelligence</h3>
                                <h2 className="text-lg font-black text-indigo-950 dark:text-white">การรวบรวมและวิเคราะห์ข้อมูลซัพพลายเออร์</h2>
                            </div>
                        </div>
                        <p className="text-indigo-900/80 dark:text-indigo-100 text-xs sm:text-sm leading-relaxed mb-6 font-semibold dark:font-medium max-w-3xl">
                            จากการวิเคราะห์พฤติกรรมการส่งมอบของซัพพลายเออร์ในรอบ 90 วันที่ผ่านมา ระบบ AI ตรวจพบว่าคู่ค้าหลักในกลุ่มชิ้นส่วนบรรจุภัณฑ์มีโอกาสส่งของล่าช้าเพิ่มขึ้นเฉลี่ย 1.5 วันเนื่องจากฤดูกาล แนะนำให้เริ่มจัดหาผู้ให้บริการรายสำรอง หรือขยายเวลาแจ้งความต้องการล่วงหน้าเพื่อลดผลกระทบ
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-2">
                        <div className="bg-white/70 dark:bg-white/5 border border-indigo-100/80 dark:border-white/10 p-3.5 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-sm dark:shadow-none">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">ประหยัดต้นทุนทางอ้อม</span>
                                <p className="text-xs text-indigo-950 dark:text-slate-100 font-black dark:font-bold">แนะนำรวมยอดซื้อใบสั่งสินค้า (Consolidation)</p>
                            </div>
                        </div>
                        <div className="bg-white/70 dark:bg-white/5 border border-indigo-100/80 dark:border-white/10 p-3.5 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-sm dark:shadow-none">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">สัญญาณเตือนความเสี่ยง</span>
                                <p className="text-xs text-indigo-950 dark:text-slate-100 font-black dark:font-bold">ซัพพลายเออร์ 2 รายหลักเสี่ยงมีภาระส่งของทับซ้อน</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Operations Desk: Alerts & Quick Notification center */}
                <Card className="border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-4 flex-shrink-0">
                            <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-base font-black text-gray-900 dark:text-white">ศูนย์กลางการแจ้งเตือนด่วน</h3>
                        </div>
                        
                        <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1">
                            {data?.alerts.map((alert, index) => {
                                const isWarning = alert.type === 'warning';
                                return (
                                    <div key={index} className={`flex items-start gap-2.5 p-3 rounded-xl border ${isWarning ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-950 text-rose-800 dark:text-rose-400' : 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-950 text-blue-800 dark:text-blue-400'}`}>
                                        {isWarning ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" /> : <Activity className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />}
                                        <span className="text-xs font-semibold leading-normal">{alert.message}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
                        จัดการใบขอจัดซื้อ (PR) ทั้งหมด
                    </button>
                </Card>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((kpi, index) => {
                    const isIndigo = kpi.color === 'indigo';
                    const isAmber = kpi.color === 'amber';
                    const isCyan = kpi.color === 'cyan';
                    const iconColorClass = isIndigo 
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400' 
                        : isAmber 
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                        : isCyan 
                        ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400';

                    return (
                        <Card key={index} className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border-none shadow-lg shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColorClass} group-hover:scale-110 transition-transform duration-300`}>
                                    <kpi.icon className="w-5.5 h-5.5" />
                                </div>
                                <GrowthIndicator growth={kpi.growth} trend={kpi.growth > 0 ? 'up' : 'down'} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{kpi.value}</h3>
                                <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-2 font-medium">{kpi.subtitle}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Double Summary Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-lg shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">ยอดจัดซื้อสะสมเดือนนี้</h4>
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">Monthly</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {formatCurrency(data?.summary.monthlyPurchase || 0)}
                        </h3>
                    </div>
                    <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-3 font-semibold">
                        *เทียบกับงบประมาณเฉลี่ยรายเดือนของไตรมาสปัจจุบัน
                    </p>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-lg shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">ยอดจัดซื้อสะสมปีนี้</h4>
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">Yearly YTD</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {formatCurrency(data?.summary.yearlyPurchase || 0)}
                        </h3>
                    </div>
                    <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-3 font-semibold">
                        ยอดสะสมการสั่งซื้อมูลค่าสุทธิตั้งแต่เริ่มต้นปีงบประมาณ
                    </p>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 border-none shadow-lg shadow-slate-100 dark:shadow-none dark:bg-gray-900/40 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lead Time ดำเนินการเฉลี่ย</h4>
                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded-md">Lead Time</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                            {data?.summary.avgLeadTime || 0} วัน
                        </h3>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 flex-shrink-0">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${Math.min(100, ((data?.summary.avgLeadTime || 0) / 10) * 100)}%` }} />
                        </div>
                    </div>
                </Card>

                <StatusCard 
                    normal={data?.summary.statusOverview.normal || 0}
                    approaching={data?.summary.statusOverview.approaching || 0}
                    overdue={data?.summary.statusOverview.overdue || 0}
                    conversionRate={data?.summary.conversionRate || 0}
                />
            </div>

            {/* Charts & Interactive analytics */}
            <Suspense fallback={<ChartSkeleton />}>
                {data && (
                    <ProcurementCharts 
                        vendorPieData={data.charts.vendorPie}
                        trendData={data.charts.purchaseTrend}
                        leadTimeData={data.charts.leadTimeData}
                        followUpList={data.charts.followUpList}
                    />
                )}
            </Suspense>

        </div>
    );
}