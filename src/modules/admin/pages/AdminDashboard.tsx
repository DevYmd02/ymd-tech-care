/**
 * @file AdminDashboard.tsx
 * @description หน้า Dashboard หลักของ Admin (รุ่นพรีเมียมและโมเดิร์นที่สุด)
 * @route /admin
 * @purpose แสดงภาพรวมระบบ ERP ทั้งหมดด้วย UI/UX ระดับ State-of-the-Art
 */

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    Warehouse,
    FileText,
    Activity,
    DollarSign,
    ChevronRight,
    Clock,
    ArrowUpRight,
    RefreshCw,
    CheckCircle2,
    Cpu,
    Database,
    Network,
    HardDrive,
    Shield,
    Sparkles
} from 'lucide-react';
import { Card } from '@ui';
import { styles } from '@/shared/constants/styles';
import { ROUTES } from '@/core/config/routes';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// ====================================================================================
// MOCK DATA FOR CHARTS & STATS
// ====================================================================================

const chartData = {
    '7d': [
        { name: 'จ.', 'จัดซื้อ': 18, 'ขาย': 34, 'การเงิน': 12 },
        { name: 'อ.', 'จัดซื้อ': 24, 'ขาย': 45, 'การเงิน': 19 },
        { name: 'พ.', 'จัดซื้อ': 21, 'ขาย': 38, 'การเงิน': 15 },
        { name: 'พฤ.', 'จัดซื้อ': 35, 'ขาย': 58, 'การเงิน': 28 },
        { name: 'ศ.', 'จัดซื้อ': 29, 'ขาย': 50, 'การเงิน': 22 },
        { name: 'ส.', 'จัดซื้อ': 12, 'ขาย': 22, 'การเงิน': 8 },
        { name: 'อา.', 'จัดซื้อ': 8, 'ขาย': 15, 'การเงิน': 5 },
    ],
    '30d': [
        { name: 'สัปดาห์ที่ 1', 'จัดซื้อ': 85, 'ขาย': 165, 'การเงิน': 62 },
        { name: 'สัปดาห์ที่ 2', 'จัดซื้อ': 98, 'ขาย': 190, 'การเงิน': 80 },
        { name: 'สัปดาห์ที่ 3', 'จัดซื้อ': 115, 'ขาย': 220, 'การเงิน': 95 },
        { name: 'สัปดาห์ที่ 4', 'จัดซื้อ': 105, 'ขาย': 204, 'การเงิน': 88 },
    ]
};

// ====================================================================================
// MAIN COMPONENT - AdminDashboard (Premium Enterprise Edition)
// ====================================================================================

export default function AdminDashboard() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        // ฟังก์ชันตรวจสอบความกว้างของแถบ Sidebar ใน DOM จริง
        const checkSidebarState = () => {
            const sidebar = document.querySelector('.bg-white.dark\\:bg-gray-800.border-r') || 
                            document.querySelector('.transition-all.duration-300.ease-in-out.group.overflow-hidden');
            if (sidebar) {
                const rect = sidebar.getBoundingClientRect();
                // ถ้า sidebar มีความกว้างมากกว่า 50px ถือว่าเปิดอยู่
                setIsSidebarOpen(rect.width > 50);
            }
        };

        // ตรวจสอบทันทีที่หน้าโหลด
        checkSidebarState();

        // สังเกตการณ์การเปลี่ยนแปลงของคลาส/ความกว้าง (DOM MutationObserver)
        const observer = new MutationObserver(() => {
            checkSidebarState();
        });

        // สังเกตความเปลี่ยนแปลงใน body ทั้งหมดแบบ real-time
        observer.observe(document.body, { 
            attributes: true, 
            childList: true, 
            subtree: true, 
            attributeFilter: ['class', 'style'] 
        });

        window.addEventListener('resize', checkSidebarState);

        // ทำการตรวจจับความกว้างเป็นระยะในช่วงเวลาทรานซิชันเปิด/ปิด
        const transitionTimer = setInterval(checkSidebarState, 100);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', checkSidebarState);
            clearInterval(transitionTimer);
        };
    }, []);

    // ฟังก์ชันจัดการชื่อผู้ใช้ให้เป็นสากลและอบอุ่น (Corporate Friendly)
    const getFormattedName = () => {
        const rawName = user?.employee?.employee_fullname || user?.username || 'ผู้ดูแลระบบ';
        
        // รายชื่อผู้ใช้ระบบ บัญชีทดสอบ หรือบทบาทแอดมินที่ไม่ควรเติม "คุณ" นำหน้า
        const systemKeywords = ['admin', 'system', 'ทดสอบ', 'แอดมิน', 'test', 'guest'];
        const isSystem = systemKeywords.some(keyword => rawName.toLowerCase().includes(keyword));
        
        if (isSystem) {
            return rawName;
        }
        
        // สำหรับบัญชีคนจริง: ถ้ามีคำนำหน้าชื่อทางกฎหมาย เช่น นาย/นาง/นางสาว ให้เปลี่ยนเป็น "คุณ"
        // แต่ถ้าไม่มีคำนำหน้า ให้เติม "คุณ " เพื่อความสุภาพเป็นมิตรในองค์กร
        let formatted = rawName.trim();
        if (formatted.startsWith('นาย ')) {
            formatted = 'คุณ ' + formatted.substring(4);
        } else if (formatted.startsWith('นาย')) {
            formatted = 'คุณ ' + formatted.substring(3);
        } else if (formatted.startsWith('นางสาว ')) {
            formatted = 'คุณ ' + formatted.substring(7);
        } else if (formatted.startsWith('นางสาว')) {
            formatted = 'คุณ ' + formatted.substring(6);
        } else if (formatted.startsWith('นาง ')) {
            formatted = 'คุณ ' + formatted.substring(4);
        } else if (formatted.startsWith('นาง')) {
            formatted = 'คุณ ' + formatted.substring(3);
        } else if (!formatted.startsWith('คุณ')) {
            formatted = 'คุณ ' + formatted;
        }
        
        return formatted;
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');
    const [pinging, setPinging] = useState(false);
    const [pingResults, setPingResults] = useState({
        db: 14,
        api: 8,
        cache: 2,
        storage: 22
    });

    // อัปเดตเวลาเรียลไทม์
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ฟังก์ชันจำลองการทดสอบเชื่อมต่อ (Ping Check)
    const handlePingCheck = () => {
        setPinging(true);
        setTimeout(() => {
            setPingResults({
                db: Math.floor(Math.random() * 15) + 5,
                api: Math.floor(Math.random() * 10) + 3,
                cache: Math.floor(Math.random() * 3) + 1,
                storage: Math.floor(Math.random() * 25) + 10
            });
            setPinging(false);
        }, 800);
    };

    // ฟอร์แมตวันที่แบบไทย
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // ฟอร์แมตเวลา
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const modules = [
        {
            icon: <ShoppingBag size={28} className="text-blue-500 group-hover:text-blue-400 transition-colors" />,
            title: 'ระบบจัดซื้อ',
            description: 'จัดการใบขอซื้อ ใบสั่งซื้อ ซัพพลายเออร์ และการรับเข้าสินค้าแบบบูรณาการ',
            href: '/procurement/dashboard',
            color: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
            borderHover: 'hover:border-blue-500/50',
            badge: 'Procurement'
        },
        {
            icon: <Warehouse size={28} className="text-purple-500 group-hover:text-purple-400 transition-colors" />,
            title: 'ระบบคลังสินค้า',
            description: 'ควบคุมสต็อกสินค้าคงคลัง ความเคลื่อนไหว และตำแหน่งจัดเก็บชั้นวาง',
            href: '/inventory/dashboard',
            color: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
            borderHover: 'hover:border-purple-500/50',
            badge: 'Inventory'
        },
        {
            icon: <TrendingUp size={28} className="text-emerald-500 group-hover:text-emerald-400 transition-colors" />,
            title: 'ระบบขาย',
            description: 'ใบเสนอราคา ใบสั่งขาย ข้อมูลลูกค้า และวิเคราะห์แนวโน้มยอดขาย',
            href: ROUTES.SALES.DASHBOARD,
            color: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
            borderHover: 'hover:border-emerald-500/50',
            badge: 'Sales & Distribution'
        },
        {
            icon: <DollarSign size={28} className="text-orange-500 group-hover:text-orange-400 transition-colors" />,
            title: 'ระบบบัญชี',
            description: 'สมุดบัญชีทั่วไป เจ้าหนี้ ลูกหนี้ ภาษี และงบแสดงฐานะทางการเงิน',
            href: '/accounting/dashboard',
            color: 'from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20',
            borderHover: 'hover:border-orange-500/50',
            badge: 'Accounting & GL'
        }
    ];

    const stats = [
        {
            icon: <FileText size={24} />,
            label: 'เอกสารรอดำเนินการ',
            value: '24',
            subLabel: '8 ขอซื้อ • 16 สั่งขาย',
            change: '+14% สัปดาห์นี้',
            trendUp: true,
            colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
        },
        {
            icon: <Users size={24} />,
            label: 'ผู้ใช้งานออนไลน์',
            value: '12',
            subLabel: 'มีกิจกรรมช่วง 15 นาที',
            change: '+3 เซสชัน',
            trendUp: true,
            colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
            pulse: true
        },
        {
            icon: <Activity size={24} />,
            label: 'ธุรกรรมวันนี้',
            value: '156',
            subLabel: 'ความเร็วเฉลี่ย 1.2 วินาที',
            change: '+12.4% คึกคัก',
            trendUp: true,
            colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30'
        },
        {
            icon: <Shield size={24} />,
            label: 'สถานะระบบโดยรวม',
            value: '99.9%',
            subLabel: 'ทำงานเต็มประสิทธิภาพ',
            change: 'สมบูรณ์แบบ',
            trendUp: true,
            colorClass: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
        }
    ];

    const recentActivities = [
        { user: 'แอดมินระบบ', action: 'สร้างใบขอซื้อ PR-2026-0001', time: '5 นาทีที่แล้ว', module: 'Procurement', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
        { user: 'สมชาย ใจดี', action: 'อนุมัติใบสั่งซื้อ PO-2026-0023', time: '15 นาทีที่แล้ว', module: 'Procurement', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
        { user: 'วิภา พลอยงาม', action: 'รับสินค้าเข้าพัสดุ GRN-2026-0045', time: '1 ชั่วโมงที่แล้ว', module: 'Inventory', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
        { user: 'แอดมินระบบ', action: 'เพิ่มพันธมิตรการค้าซัพพลายเออร์ใหม่', time: '2 ชั่วโมงที่แล้ว', module: 'Procurement', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' }
    ];

    const systemStatus = [
        { name: 'Database Server', status: 'Online', delay: `${pingResults.db}ms`, color: 'bg-emerald-500', icon: <Database size={16} /> },
        { name: 'API Gateway', status: 'Online', delay: `${pingResults.api}ms`, color: 'bg-emerald-500', icon: <Network size={16} /> },
        { name: 'Cache Storage (Redis)', status: 'Online', delay: `${pingResults.cache}ms`, color: 'bg-emerald-500', icon: <Cpu size={16} /> },
        { name: 'File Storage (S3)', status: 'Online', delay: `${pingResults.storage}ms`, color: 'bg-emerald-500', icon: <HardDrive size={16} /> }
    ];

    return (
        <div className={`${styles.pageContainer} ${isSidebarOpen ? 'max-w-7xl' : 'max-w-none w-full px-2 md:px-6'} mx-auto space-y-8 animate-fade-in transition-all duration-300`}>

            {/* ==================== 1. PRESTIGE GREETING HERO HEADER ==================== */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-100/70 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-800 dark:text-white p-6 md:p-8 shadow-sm dark:shadow-xl border border-indigo-100 dark:border-indigo-800/30">
                {/* Glowing Background Glows */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* User and Welcome Message */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold tracking-wide uppercase">
                            <Sparkles size={16} className="animate-pulse" />
                            <span>ERP Control Command Center</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight leading-normal">
                            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-blue-400 dark:to-indigo-200 bg-clip-text text-transparent inline-block pt-2.5 pb-1">{getFormattedName()}</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
                            ระบบทำงานปกติ ปราศจากความผิดพลาด ยินดีต้อนรับสู่แดชบอร์ดหลักสำหรับบริหารจัดการโมดูลทั้งหมดขององค์กรคุณในที่เดียว
                        </p>
                    </div>

                    {/* Dynamic Real-Time Ticking Clock Widget */}
                    <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-xl border border-indigo-100 dark:border-slate-700/50 self-start md:self-auto shadow-sm dark:shadow-inner">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-600/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Clock size={22} className="animate-spin-slow" />
                        </div>
                        <div>
                            <div className="text-lg font-bold tracking-wider font-mono text-indigo-950 dark:text-blue-200">
                                {formatTime(currentTime)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {formatDate(currentTime)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== 2. ADVANCED KPI METRIC STATS ROW ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`${styles.cardGlass} p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg dark:hover:shadow-indigo-950/20 border-slate-200/80 dark:border-slate-800`}
                    >
                        {/* Interactive border accent on hover */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    {stat.label}
                                </span>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                                        {stat.value}
                                    </h3>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        {stat.subLabel}
                                    </p>
                                </div>
                            </div>

                            <div className={`p-3 rounded-xl ${stat.colorClass} relative`}>
                                {stat.icon}
                                {stat.pulse && (
                                    <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Trend indicator footer */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                ความเคลื่อนไหว
                            </span>
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight size={14} />
                                <span>{stat.change}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== 3. DYNAMIC TRANSACTIONS AREA CHART ==================== */}
            <Card className="p-6 border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-indigo-600 dark:text-indigo-400" size={20} />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">กราฟแสดงกิจกรรมและธุรกรรมรายวัน</h2>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            วิเคราะห์สถิติจำนวนเอกสารธุรกรรมที่ผ่านระบบแยกตามฝ่าย
                        </p>
                    </div>

                    {/* Period Switcher Pills */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
                        <button
                            onClick={() => setChartPeriod('7d')}
                            className={`px-4 py-1.5 rounded-md transition-all ${chartPeriod === '7d' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            7 วันล่าสุด
                        </button>
                        <button
                            onClick={() => setChartPeriod('30d')}
                            className={`px-4 py-1.5 rounded-md transition-all ${chartPeriod === '30d' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            30 วันล่าสุด
                        </button>
                    </div>
                </div>

                {/* Recharts Wrapper */}
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData[chartPeriod]}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAccounting" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(79, 70, 229, 0.2)',
                                    color: '#f8fafc',
                                    fontSize: '13px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="จัดซื้อ"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorPurchase)"
                            />
                            <Area
                                type="monotone"
                                dataKey="ขาย"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                            />
                            <Area
                                type="monotone"
                                dataKey="การเงิน"
                                stroke="#f97316"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAccounting)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart Legends */}
                <div className="flex flex-wrap justify-center items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">ฝ่ายจัดซื้อ (PR/PO)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">ฝ่ายขาย (QT/SO)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">การเงิน/บัญชี</span>
                    </div>
                </div>
            </Card>

            {/* ==================== 4. MODERN GLASS GRID MODULE ACCESS ==================== */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>ระบบงานหลักในองค์กร (ERP Modules)</span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            คลิกเข้าสู่แผงควบคุมหลักแยกตามโมดูลที่คุณมีสิทธิ์บริหารจัดการ
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((module, index) => (
                        <a
                            key={index}
                            href={module.href}
                            className={`group relative overflow-hidden bg-gradient-to-br ${module.color} hover:from-indigo-600 hover:to-indigo-800 dark:hover:from-indigo-900 dark:hover:to-indigo-800 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-transparent ${module.borderHover} hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-[210px]`}
                        >
                            {/* Decorative light ring background on hover */}
                            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 translate-y-10 group-hover:scale-150 transition-transform duration-500"></div>

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        {module.icon}
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-900/10 dark:bg-white/10 group-hover:bg-white/20 text-slate-600 dark:text-slate-300 group-hover:text-white rounded-full tracking-wide uppercase transition-colors">
                                        {module.badge}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-white transition-colors mb-2">
                                    {module.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-100 transition-colors line-clamp-2">
                                    {module.description}
                                </p>
                            </div>

                            {/* Arrow Call-To-Action */}
                            <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-white mt-4 transition-colors">
                                <span>เข้าจัดการโมดูล</span>
                                <ChevronRight size={16} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* ==================== 5. SPLIT VIEW: LIVE LOGS & CYBER DIAGNOSTICS ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* COLUMN 1: System Live Log Feed */}
                <Card className="p-6 border-slate-200/80 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
                                <span>บันทึกกิจกรรมล่าสุด (Recent Activity)</span>
                            </h3>
                            <p className="text-xs text-slate-400">ประวัติการสร้างเอกสารและอนุมัติล่าสุดภายในระบบ ERP</p>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
                            ดูทั้งหมด <ChevronRight size={14} className="ml-0.5" />
                        </button>
                    </div>

                    <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="relative pl-6 group">
                                {/* Timeline Dot */}
                                <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform"></span>

                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {activity.action}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="font-medium text-slate-600 dark:text-slate-300">
                                                {activity.user}
                                            </span>
                                            <span>•</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activity.badgeColor}`}>
                                                {activity.module}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {activity.time}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* COLUMN 2: Cyber Diagnostics & Status Control Deck */}
                <Card className="p-6 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    <span>สุขภาพของระบบและฐานข้อมูล (Status & Diagnostics)</span>
                                </h3>
                                <p className="text-xs text-slate-400">รายงานการเชื่อมต่อเซิร์ฟเวอร์แบบ Real-Time PING</p>
                            </div>

                            <button
                                onClick={handlePingCheck}
                                disabled={pinging}
                                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${pinging ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600' : 'bg-white hover:bg-slate-50 border-slate-200 text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-indigo-400'}`}
                            >
                                <RefreshCw size={12} className={`${pinging ? 'animate-spin' : ''}`} />
                                <span>{pinging ? 'กำลังตรวจ...' : 'ตรวจสอบอีกครั้ง'}</span>
                            </button>
                        </div>

                        {/* Grid list of Server delays */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {systemStatus.map((system, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                                            {system.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{system.name}</h4>
                                            <p className="text-[10px] text-slate-400">{system.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{system.delay}</span>
                                        <div className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress Bar Metrics */}
                    <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ประสิทธิภาพทรัพยากร (Resource Utilization)</h4>
                        {[
                            { label: 'ใช้งาน Storage หลัก', value: '65%', widthClass: 'w-[65%]', color: 'from-blue-500 to-indigo-500' },
                            { label: 'โควตาคำขอ API (วันนี้)', value: '2,340 / 5,000', widthClass: 'w-[47%]', color: 'from-emerald-500 to-teal-500' },
                            { label: 'Active Concurrent Users', value: '23 / 100', widthClass: 'w-[23%]', color: 'from-purple-500 to-pink-500' }
                        ].map((stat, index) => (
                            <div key={index} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-600 dark:text-slate-400">{stat.label}</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold">{stat.value}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 shadow-inner">
                                    <div className={`bg-gradient-to-r ${stat.color} h-2 rounded-full ${stat.widthClass} transition-all duration-500`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
