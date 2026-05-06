/**
 * @file ProcurementDashboard.tsx
 * @description Dashboard สำหรับระบบจัดซื้อ (Procurement Module)
 * @route /procurement/dashboard
 * @purpose แสดงภาพรวม KPI, Charts และรายการรออนุมัติ
 * @updated รองรับ Real Data จาก API
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import {
    FileText,
    ShoppingCart,
    Package,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    Banknote,
} from 'lucide-react';
import { Card, StatCard } from '@ui';
import { ProcurementDashboardService, type DashboardData } from '../../services';
import { logger } from '@/shared/utils';

// Lazy load heavy chart components
const ProcurementCharts = lazy(() => import('./components/ProcurementCharts'));

const ChartSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
    </div>
);

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

function KPICard({ label, value, icon: Icon, color, bgColor }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}) {
    return (
        <Card className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </Card>
    );
}

function StatusCard({ normal, approaching, overdue, conversionRate }: { normal: number, approaching: number, overdue: number, conversionRate: number }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">สถานะภาพรวม</p>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">ปกติ</span>
                    </div>
                    <span className="font-bold text-green-600">{normal}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-gray-600 dark:text-gray-400">ใกล้ครบกำหนด</span>
                    </div>
                    <span className="font-bold text-yellow-600">{approaching}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-600 dark:text-gray-400">เกินกำหนด</span>
                    </div>
                    <span className="font-bold text-red-600">{overdue}%</span>
                </div>
                
                <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">อัตราการเปลี่ยน PR เป็น PO</span>
                        <span className="text-blue-600 font-bold">{conversionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full transition-all duration-1000" 
                            style={{ width: `${conversionRate}%` }} 
                        />
                    </div>
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

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Dashboard Data
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const result = await ProcurementDashboardService.getDashboardData();
                setData(result);
            } catch (error) {
                logger.error('[ProcurementDashboard] Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
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
    });

    if (loading && !data) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
                </div>
                <ChartSkeleton />
            </div>
        );
    }

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const kpiCards = [
        { label: 'PR รออนุมัติ', value: data?.kpi.prPending || 0, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'PO รออนุมัติ', value: data?.kpi.poPending || 0, icon: ShoppingCart, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
        { label: 'PO ค้างรับ', value: data?.kpi.poPendingReceipt || 0, icon: Package, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
        { label: 'มูลค่าค้างรับ', value: formatNumber(data?.kpi.pendingReceiptValue || 0), icon: Banknote, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Procurement Dashboard</h1>
                        <button 
                            onClick={() => setRefreshKey(prev => prev + 1)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="รีเฟรชข้อมูล"
                        >
                            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard ระบบจัดซื้อ - ภาพรวมและสถานะการดำเนินงาน</p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{thaiDate}</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{timeString}</p>
                </div>
            </div>

            {/* KPI Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                ))}
            </div>

            {/* Summary Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="ยอดซื้อเดือนนี้"
                    value={`฿${(data?.summary.monthlyPurchase || 0).toLocaleString()}`}
                    color="green"
                    icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                />
                <StatCard 
                    label="ยอดซื้อปีนี้"
                    value={`฿${(data?.summary.yearlyPurchase || 0).toLocaleString()}`}
                    color="blue"
                    icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                />
                <StatCard 
                    label="Lead Time เฉลี่ย"
                    value={`${data?.summary.avgLeadTime || 0} วัน`}
                    color="purple"
                    icon={<Clock className="w-6 h-6 text-purple-600" />}
                />
                <StatusCard 
                    normal={data?.summary.statusOverview.normal || 0}
                    approaching={data?.summary.statusOverview.approaching || 0}
                    overdue={data?.summary.statusOverview.overdue || 0}
                    conversionRate={data?.summary.conversionRate || 0}
                />
            </div>

            {/* Charts & Summary Row */}
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

            {/* Alert Section */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">การแจ้งเตือนสำคัญ</h3>
                </div>
                <ul className="space-y-2">
                    {data?.alerts.map((alert, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                            <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full" />
                            {alert.message}
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}