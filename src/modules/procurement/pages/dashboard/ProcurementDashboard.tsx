/**
 * @file ProcurementDashboard.tsx
 * @description Dashboard สำหรับระบบจัดซื้อ (Procurement Module)
 * @route /procurement/dashboard
 * @purpose แสดงภาพรวม KPI, Charts และรายการรออนุมัติ
 * @updated รองรับ Dark/Light Mode
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import {
    FileText,
    ShoppingCart,
    Package,
    Receipt,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    ChevronRight,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { StatCard } from '@/shared/components/ui/StatCard';

// Lazy load heavy chart components
const ProcurementCharts = lazy(() => import('./components/ProcurementCharts'));

const ChartSkeleton = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
        </div>
    </div>
);

// ====================================================================================
// MOCK DATA
// ====================================================================================

const kpiData = [
    { label: 'PR รออนุมัติ', value: 12, icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'PO รออนุมัติ', value: 8, icon: ShoppingCart, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'PO ค้างรับ', value: 25, icon: Package, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'บิลรอ Match', value: 15, icon: Receipt, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

const summaryData = [
    { label: 'ยอดซื้อเดือนนี้', value: '฿2,450,000', icon: TrendingUp, color: 'green' as const },
    { label: 'ยอดซื้อปีนี้', value: '฿28,500,000', icon: TrendingUp, color: 'blue' as const },
    { label: 'Lead Time เฉลี่ย', value: '5.2 วัน', icon: Clock, color: 'purple' as const },
];

const statusData = {
    normal: 85,
    delayed: 12,
    overdue: 3,
};

const vendorPieData = [
    { name: 'เทคโนโลยีดิจิทัล', value: 30, color: '#3b82f6' },
    { name: 'เซ็พพลาย', value: 22, color: '#22c55e' },
    { name: 'Global Trading', value: 20, color: '#f97316' },
    { name: 'ไทยคอมเมิร์ซ', value: 15, color: '#eab308' },
    { name: 'อื่นๆ', value: 13, color: '#8b5cf6' },
];

const trendData = [
    { month: 'ก.ค.', value: 2200000 },
    { month: 'ส.ค.', value: 2500000 },
    { month: 'ก.ย.', value: 2300000 },
    { month: 'ต.ค.', value: 2800000 },
    { month: 'พ.ย.', value: 3100000 },
    { month: 'ธ.ค.', value: 2900000 },
    { month: 'ม.ค.', value: 2450000 },
];

const leadTimeData = [
    { process: 'PR→PO', days: 3 },
    { process: 'PO→GRN', days: 7 },
    { process: 'GRN→INV', days: 2 },
    { process: 'รวม', days: 12 },
];

const pendingApprovals = [
    { id: 'PR-202601-001', type: 'PR', requester: 'สมชาย ใจดี', approver: 'ผู้จัดการไอที', amount: 175000 },
    { id: 'PO-202601-001', type: 'PO', requester: 'สมชาย ใจดี', approver: 'CFO', amount: 176550 },
];

const alerts = [
    { message: 'PO-202601-005 เกินกำหนดส่งของ 3 วัน', type: 'warning' },
    { message: 'มีใบแจ้งหนี้ 5 ใบที่ยังไม่ได้ทำ 3-Way Match', type: 'warning' },
    { message: 'PR-202601-008 รออนุมัติเกิน 5 วันทำการ', type: 'warning' },
];

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

function KPICard({ label, value, icon: Icon, color, bgColor }: {
    label: string;
    value: number;
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


function StatusCard() {
    return (
        <Card>
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">สถานะภาพรวม</p>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">ปกติ</span>
                    <span className="text-green-600 font-semibold">{statusData.normal}%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">ล่าช้า</span>
                    <span className="text-orange-600 font-semibold">{statusData.delayed}%</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">เกินกำหนด</span>
                    <span className="text-red-600 font-semibold">{statusData.overdue}%</span>
                </div>
            </div>
        </Card>
    );
}

function ApprovalItem({ id, type, requester, approver, amount }: {
    id: string;
    type: string;
    requester: string;
    approver: string;
    amount: number;
}) {
    return (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-3">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        type === 'PR' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' 
                                       : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
                    }`}>
                        {type}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{id}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">฿{amount.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ผู้ขอ: {requester}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">ผู้อนุมัติ: {approver}</p>
            <div className="flex gap-2">
                <button className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" /> อนุมัติ
                </button>
                <button className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4" /> ไม่อนุมัติ
                </button>
            </div>
        </div>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function ProcurementDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Procurement Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard ระบบจัดซื้อ - ภาพรวมและสถานะการดำเนินงาน</p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{thaiDate}</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{timeString}</p>
                </div>
            </div>

            {/* KPI Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                ))}
            </div>

            {/* Summary Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryData.map((item, index) => (
                    <StatCard 
                        key={index} 
                        label={item.label}
                        value={item.value}
                        color={item.color}
                        icon={<item.icon className={`w-6 h-6 text-${item.color}-600`} />}
                    />
                ))}
                <StatusCard />
            </div>

            {/* Charts & Summary Row */}
            <Suspense fallback={<ChartSkeleton />}>
                <ProcurementCharts 
                    vendorPieData={vendorPieData}
                    trendData={trendData}
                    leadTimeData={leadTimeData}
                />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* This empty div matches the grid layout if needed, 
                    or we can keep the Pending Approvals here which was originally next to the Bar Chart */}
                <div className="hidden lg:block h-0" /> 
                
                {/* Pending Approvals */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">งานรออนุมัติ</h3>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            ดูทั้งหมด <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto">
                        {pendingApprovals.map((item, index) => (
                            <ApprovalItem key={index} {...item} />
                        ))}
                    </div>
                </Card>
            </div>

            {/* Alert Section */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">การแจ้งเตือนสำคัญ</h3>
                </div>
                <ul className="space-y-2">
                    {alerts.map((alert, index) => (
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
