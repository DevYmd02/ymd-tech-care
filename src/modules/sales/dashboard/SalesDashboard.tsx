import { useState, useEffect, Suspense, lazy } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    ShoppingCart,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    RefreshCcw,
    Zap,
    Target,
} from 'lucide-react';
import { Card } from '@ui';

// Lazy load the charts component
const SalesCharts = lazy(() => import('./components/SalesCharts'));

const ChartSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
    </div>
);

// ====================================================================================
// MOCK DATA
// ====================================================================================

const kpiData = [
    { label: 'รายได้รวม (Total Revenue)', value: '฿12,450,000', icon: CreditCard, color: 'emerald', growth: 12.5, trend: 'up' },
    { label: 'ลูกค้าที่ใช้งาน (Active Customers)', value: '1,284', icon: Users, color: 'blue', growth: 8.2, trend: 'up' },
    { label: 'จำนวนคำสั่งซื้อ (Total Orders)', value: '4,520', icon: ShoppingCart, color: 'amber', growth: -2.4, trend: 'down' },
    { label: 'ยอดขายเฉลี่ย (Avg Order Value)', value: '฿2,754', icon: Zap, color: 'purple', growth: 5.7, trend: 'up' },
];

const trendData = [
    { month: 'ต.ค.', revenue: 1850000, target: 1700000 },
    { month: 'พ.ย.', revenue: 2100000, target: 2000000 },
    { month: 'ธ.ค.', revenue: 2850000, target: 2500000 },
    { month: 'ม.ค.', revenue: 2450000, target: 2400000 },
    { month: 'ก.พ.', revenue: 2900000, target: 2700000 },
    { month: 'มี.ค.', revenue: 3200000, target: 3000000 },
    { month: 'เม.ย.', revenue: 1450000, target: 3500000 }, // Current month partial
];

const channelData = [
    { name: 'ขายตรง (Direct Sales)', value: 45, color: '#10b981' },
    { name: 'ออนไลน์ (Online Store)', value: 30, color: '#3b82f6' },
    { name: 'แฟรนไชส์ (Franchise)', value: 15, color: '#f59e0b' },
    { name: 'อื่นๆ (Others)', value: 10, color: '#8b5cf6' },
];

const topProducts = [
    { id: '1', name: 'Premium Tech Kit V2', orders: 842, revenue: 1250000, growth: 18.5 },
    { id: '2', name: 'Smart Office Hub', orders: 621, revenue: 985000, growth: 12.2 },
    { id: '3', name: 'Wireless Audio Pro', orders: 543, revenue: 540000, growth: -4.8 },
    { id: '4', name: 'Eco Charging Station', orders: 412, revenue: 325000, growth: 7.4 },
    { id: '5', name: 'Focus Keyboard Mech', orders: 328, revenue: 198000, growth: 22.1 },
];

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

function GrowthIndicator({ growth, trend }: { growth: number, trend: string }) {
    const isUp = trend === 'up';
    return (
        <div className={`flex items-center gap-1 ${isUp ? 'text-emerald-500' : 'text-rose-500'} font-bold text-sm`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(growth)}%
            <span className="text-gray-400 font-normal text-xs ml-1">เทียบกับเดือนที่แล้ว</span>
        </div>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function SalesDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const thaiDate = currentTime.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const timeString = currentTime.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div className="p-6 space-y-8 bg-[#f8fafc] dark:bg-slate-950/20 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Sales Dashboard</h1>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-0.5">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">{thaiDate} • </span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">{timeString}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={handleRefresh}
                        className="flex-1 md:flex-none h-11 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm font-bold">Refresh</span>
                    </button>
                    <button className="flex-1 md:flex-none h-11 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all shadow-sm active:scale-95">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-bold">Filters</span>
                    </button>
                    <button className="flex-1 md:flex-none h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25">
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-black uppercase tracking-wide">Export</span>
                    </button>
                </div>
            </div>

            {/* Target Progress Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 relative overflow-hidden group border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-gray-800/40">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white">ประสิทธิภาพตามเป้าหมายรายเดือน</h2>
                                <p className="text-sm text-gray-500 font-medium">ติดตามความสำเร็จสำหรับมิถุนายน 2026</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">82.4%</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">บรรลุเป้าหมาย (Achieved)</p>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">เป้าหมายรายได้ (Revenue Goal)</span>
                                    <span className="text-xs text-gray-500">฿10.2M / ฿12.4M</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)] dark:shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out w-[82.4%]" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">เฉลี่ยรายสัปดาห์ (Weekly Avg)</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">฿2.55M</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">ยอดที่ต้องทำตาม Forecast</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">฿2.20M</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                                    <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">การคาดการณ์ (Projection)</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">+5.2%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-0 shadow-xl shadow-indigo-500/20">
                    <div className="h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight">ข้อมูลเชิงลึกการเติบโต (Growth Insight)</h3>
                            </div>
                            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                                ยอดขายของคุณเพิ่มขึ้น <span className="font-bold text-white">12.5%</span> ในเดือนนี้ โดยมีปัจจัยหลักจากการเปิดตัว <span className="underline decoration-indigo-400 underline-offset-4">Premium Tech Kit V2</span> การคาดการณ์ระบุว่าไตรมาสนี้จะจบลงอย่างสวยงาม
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
                                <p className="text-xs font-bold text-indigo-200 uppercase mb-2">คำแนะนำอัจฉริยะ (Smart Recommendation)</p>
                                <p className="text-sm font-medium">เติมสต็อก Eco Charging Stations ภายในวันที่ 15 มิถุนายน เพื่อรอรับความต้องการที่กำลังเป็นเทรนด์</p>
                            </div>
                            <button className="w-full py-3 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg">
                                ดูรายงานฉบับเต็ม
                            </button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, index) => (
                    <Card key={index} className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border-none shadow-lg shadow-slate-200/50 dark:shadow-none dark:bg-gray-800/40">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${kpi.color}-100 dark:bg-${kpi.color}-900/30 group-hover:scale-110 transition-transform duration-300`}>
                                <kpi.icon className={`w-6 h-6 text-${kpi.color}-600 dark:text-${kpi.color}-400`} />
                            </div>
                            <GrowthIndicator growth={kpi.growth} trend={kpi.trend} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{kpi.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <Suspense fallback={<ChartSkeleton />}>
                <SalesCharts 
                    trendData={trendData}
                    channelData={channelData}
                    topProducts={topProducts}
                />
            </Suspense>

        </div>
    );
}
