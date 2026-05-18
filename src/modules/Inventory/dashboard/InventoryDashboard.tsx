import { useState, useEffect, Suspense, lazy } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Filter,
    Download,
    RefreshCcw,
    Activity,
    Package,
    Warehouse,
    ArrowUpRight,
    ArrowDownRight,
    MoveRight,
    SlidersHorizontal,
    Sparkles,
    UserCheck,
    Clock,
} from 'lucide-react';
import { Card } from '@ui';

// Lazy load the charts component
const InventoryCharts = lazy(() => import('./components/InventoryCharts'));

const ChartSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        <div className="lg:col-span-8 h-[450px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
        <div className="lg:col-span-4 h-[450px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
        <div className="lg:col-span-7 h-[400px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
        <div className="lg:col-span-5 h-[400px] bg-slate-100 dark:bg-gray-800/40 rounded-2xl" />
    </div>
);

// ====================================================================================
// MOCK DATA
// ====================================================================================

const kpiData = [
    { label: 'มูลค่าสต็อกคงคลัง (Total Inventory Value)', value: '฿45,280,000', icon: Package, color: 'blue', growth: 4.2, trend: 'up', subtitle: 'เทียบกับไตรมาสก่อน' },
    { label: 'อัตราหมุนเวียนสินค้า (Turnover Rate)', value: '6.8x', icon: Activity, color: 'emerald', growth: 8.5, trend: 'up', subtitle: 'เกณฑ์มาตรฐานอุตสาหกรรม: 5.0x' },
    { label: 'สินค้าใกล้หมด (Low Stock Alerts)', value: '12 รายการ', icon: AlertTriangle, color: 'yellow', growth: -15.3, trend: 'down', subtitle: 'ลดลงจากเดือนที่แล้ว (ดี)' },
    { label: 'ความแม่นยำของยอดสต็อก (Stock Accuracy)', value: '99.78%', icon: CheckCircle2, color: 'purple', growth: 0.12, trend: 'up', subtitle: 'ประเมินล่าสุดเมื่อ 3 วันที่แล้ว' },
];

const flowData = [
    { month: 'ต.ค.', inbound: 1200, outbound: 1050 },
    { month: 'พ.ย.', inbound: 1450, outbound: 1300 },
    { month: 'ธ.ค.', inbound: 1900, outbound: 1650 },
    { month: 'ม.ค.', inbound: 1350, outbound: 1400 },
    { month: 'ก.พ.', inbound: 1600, outbound: 1500 },
    { month: 'มี.ค.', inbound: 1850, outbound: 1750 },
    { month: 'เม.ย.', inbound: 950, outbound: 800 }, // Partial month
];

const categoryData = [
    { name: 'วัตถุดิบโลหะ (Metal)', value: 41, amount: 18564800, color: '#3b82f6' },
    { name: 'ชิ้นส่วนอิเล็กทรอนิกส์ (Electronics)', value: 30, amount: 13584000, color: '#10b981' },
    { name: 'บรรจุภัณฑ์ (Packaging)', value: 15, amount: 6792000, color: '#f59e0b' },
    { name: 'สินค้าเคมี (Chemicals)', value: 10, amount: 4528000, color: '#ef4444' },
    { name: 'อื่นๆ (Others)', value: 4, amount: 1811200, color: '#8b5cf6' },
];

const zoneData = [
    { zone: 'โซน A (High-Rack ชั้นเก็บทรงสูง)', used: 5520, free: 480, utilization: 92 },
    { zone: 'โซน B (Bulk Pack กองสินค้าหนาแน่น)', used: 4680, free: 1320, utilization: 78 },
    { zone: 'โซน C (Cold Storage ควบคุมอุณหภูมิ)', used: 1920, free: 1080, utilization: 64 },
    { zone: 'โซน D (Hazardous พื้นที่ควบคุมสารเคมี)', used: 570, free: 430, utilization: 57 },
];

const fastMovingProducts = [
    { id: '1', code: 'RM-STL-012', name: 'แผ่นเหล็กกล้าความหนา 12 มม. (Steel Plate)', picks: 142, qty: 15400, location: 'A-03-B2', speed: 'High' as const },
    { id: '2', code: 'EP-MCU-995', name: 'ชิปประมวลผลไมโครคอนโทรลเลอร์ V2', picks: 120, qty: 85000, location: 'C-12-A1', speed: 'High' as const },
    { id: '3', code: 'PK-BOX-024', name: 'กล่องกระดาษลูกฟูกขนาดมาตรฐาน M', picks: 98, qty: 42000, location: 'B-01-F3', speed: 'Medium' as const },
    { id: '4', code: 'RM-COP-301', name: 'ม้วนลวดทองแดงแกนเดี่ยว 2.5 มม.', picks: 75, qty: 6200, location: 'A-10-C4', speed: 'Medium' as const },
    { id: '5', code: 'CH-SLV-088', name: 'ตัวทำละลายอินทรีย์เกรดอุตสาหกรรม (Solvent)', picks: 43, qty: 1800, location: 'D-02-A2', speed: 'Low' as const },
];

const recentTransactions = [
    { id: 'TXN-00982', time: '14:32', ref: 'GRN-69051801', item: 'แผ่นเหล็กกล้าความหนา 12 มม.', type: 'Inbound', qty: 450, status: 'Completed', operator: 'สมพงษ์ ใจดี' },
    { id: 'TXN-00981', time: '13:15', ref: 'GI-69051804', item: 'ชิปไมโครคอนโทรลเลอร์ V2', type: 'Outbound', qty: 1200, status: 'Completed', operator: 'วรรณิกา รักดี' },
    { id: 'TXN-00980', time: '11:04', ref: 'TRF-69051802', item: 'ม้วนลวดทองแดงแกนเดี่ยว', type: 'Transfer', qty: 200, status: 'Completed', operator: 'ปิยะพงษ์ มั่นคง' },
    { id: 'TXN-00979', time: '09:45', ref: 'ADJ-69051801', item: 'กล่องกระดาษลูกฟูก M', type: 'Adjustment', qty: -2, status: 'Approved', operator: 'ชัชวาลย์ กล้าหาญ' },
    { id: 'TXN-00978', time: '08:30', ref: 'GRN-69051800', item: 'แผ่นอลูมิเนียมเกรด 6061', type: 'Inbound', qty: 800, status: 'Pending QC', operator: 'สมพงษ์ ใจดี' },
];

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

function GrowthIndicator({ growth, trend }: { growth: number, trend: string }) {
    const isUp = trend === 'up';
    return (
        <div className={`flex items-center gap-0.5 ${isUp ? 'text-emerald-500' : 'text-rose-500'} font-bold text-sm`}>
            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(growth)}%
        </div>
    );
}

// ====================================================================================
// MAIN DASHBOARD COMPONENT
// ====================================================================================

export default function InventoryDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeWarehouse, setActiveWarehouse] = useState('ALL');

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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Warehouse className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Inventory Dashboard
                        </h1>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-1">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">{thaiDate} • </span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{timeString}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Warehouse Filter */}
                    <div className="flex bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
                        <button 
                            onClick={() => setActiveWarehouse('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeWarehouse === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'}`}
                        >
                            คลังทั้งหมด
                        </button>
                        <button 
                            onClick={() => setActiveWarehouse('WH1')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeWarehouse === 'WH1' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'}`}
                        >
                            คลังหลัก (Main)
                        </button>
                        <button 
                            onClick={() => setActiveWarehouse('WH2')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeWarehouse === 'WH2' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'}`}
                        >
                            คลังย่อย
                        </button>
                    </div>

                    <button 
                        onClick={handleRefresh}
                        className="flex-1 lg:flex-none h-10 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCcw className={`w-4 h-4 text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-bold">รีเฟรช</span>
                    </button>
                    <button className="flex-1 lg:flex-none h-10 px-4 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-750 transition-all shadow-sm">
                        <Filter className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold">ตัวกรองเสริม</span>
                    </button>
                    <button className="flex-1 lg:flex-none h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25">
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">ส่งออก PDF/Excel</span>
                    </button>
                </div>
            </div>

            {/* Top Operational Section: Capacity & AI Insights */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Warehouse Space Utilization Card */}
                <Card className="xl:col-span-2 relative overflow-hidden border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Warehouse className="w-40 h-40 text-indigo-900" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <Warehouse className="w-5 h-5 text-indigo-500" />
                                    การใช้งานพื้นที่เก็บสินค้า (Warehouse Space Utilization)
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    รายงานความหนาแน่นและขีดจำกัดของชั้นวางสินค้า (Total Pallet Capacity: 15,000 Pallets)
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">84.6%</span>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">ของความจุทั้งหมด</p>
                            </div>
                        </div>

                        {/* Progress Bar Grid */}
                        <div className="space-y-4">
                            {zoneData.map((item, idx) => {
                                const isCritical = item.utilization >= 90;
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {item.zone}
                                            </span>
                                            <span className={`text-xs font-black ${isCritical ? 'text-rose-500' : 'text-gray-500'}`}>
                                                {item.used.toLocaleString()} / {(item.used + item.free).toLocaleString()} Pallets ({item.utilization}%)
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isCritical ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'}`}
                                                style={{ width: `${item.utilization}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>

                {/* AI Smart recommendation Card */}
                <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-xl shadow-indigo-950/20 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <Sparkles className="w-5 h-5 text-indigo-300 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300">AI Predictive Systems</h3>
                                <h2 className="text-base font-black text-white">ระบบจัดการคลังอัจฉริยะ (AI Suggestions)</h2>
                            </div>
                        </div>
                        <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                            จากการวิเคราะห์ความเร็วการเบิกจ่ายสินค้าและการคาดการณ์ยอดสั่งซื้อเฉลี่ยในอีก 7 วันข้างหน้า แนะนำให้ดำเนินการดังต่อไปนี้เพื่อลดคอขวดในคลังสินค้า
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-1.5">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">ความเสี่ยงสต็อกขาดแคลน</span>
                            </div>
                            <p className="text-xs text-slate-100">
                                สินค้า <span className="font-bold text-white">Steel Plate 12mm</span> อัตราการใช้เร่งตัวขึ้น แนะนำให้เริ่มสั่งซื้อล่วงหน้าเพื่อหลีกเลี่ยงกระบวนการค้างส่งมอบ
                            </p>
                        </div>
                        
                        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
                            อนุมัติใบสั่งโอนย้ายอัตโนมัติ
                        </button>
                    </div>
                </Card>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, index) => {
                    const isYellow = kpi.color === 'yellow';
                    const isRose = kpi.color === 'rose';
                    const isEmerald = kpi.color === 'emerald';
                    const iconColorClass = isYellow 
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' 
                        : isRose 
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                        : isEmerald 
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400';

                    return (
                        <Card key={index} className="hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border-none shadow-lg shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconColorClass} group-hover:scale-110 transition-transform duration-300`}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                                <GrowthIndicator growth={kpi.growth} trend={kpi.trend} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{kpi.value}</h3>
                                <p className="text-[10px] text-gray-400 mt-1">{kpi.subtitle}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Section */}
            <Suspense fallback={<ChartSkeleton />}>
                <InventoryCharts 
                    flowData={flowData}
                    categoryData={categoryData}
                    zoneData={zoneData}
                    fastMovingProducts={fastMovingProducts}
                />
            </Suspense>

            {/* Operations Desk: Recent Transactions Table */}
            <Card className="border-none shadow-xl shadow-slate-100 dark:shadow-none dark:bg-gray-900/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                            ตารางติดตามการทำงานรายวัน (Warehouse Operations Desk)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            แสดงกิจกรรมล่าสุด 5 รายการในการรับเข้า จ่ายออก โอนย้าย หรือปรับปรุงยอดในคลัง
                        </p>
                    </div>
                    <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/20 px-3.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        ดูประวัติการทำรายการทั้งหมด <MoveRight className="w-4.5 h-4.5" />
                    </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-gray-800">
                        <thead className="bg-slate-50 dark:bg-gray-800/60">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">เวลา / วันนี้</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">รหัสเอกสารอ้างอิง</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">ประเภทรายการ</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">รายการสินค้า</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">จำนวน</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">สถานะ</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">ผู้ทำรายการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-slate-100 dark:divide-gray-800">
                            {recentTransactions.map((txn, idx) => {
                                const typeColors = {
                                    Inbound: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30',
                                    Outbound: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30',
                                    Transfer: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30',
                                    Adjustment: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30',
                                }[txn.type];

                                const statusColors = {
                                    Completed: 'bg-emerald-500/10 text-emerald-500',
                                    Approved: 'bg-purple-500/10 text-purple-500',
                                    'Pending QC': 'bg-yellow-500/10 text-yellow-500',
                                }[txn.status];

                                return (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500 dark:text-gray-400">
                                            {txn.time}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-900 dark:text-white">
                                            {txn.ref}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${typeColors}`}>
                                                {txn.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                                            {txn.item}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-right text-gray-950 dark:text-gray-100 tabular-nums">
                                            {txn.qty > 0 ? `+${txn.qty}` : txn.qty}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                                            <span className={`px-2 py-0.5 rounded-full font-black ${statusColors}`}>
                                                ● {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                {txn.operator}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
}
