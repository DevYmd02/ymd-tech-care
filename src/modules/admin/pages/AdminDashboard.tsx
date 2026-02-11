/**
 * @file AdminDashboard.tsx
 * @description หน้า Dashboard หลักของ Admin
 * @route /admin
 * @purpose แสดงภาพรวมระบบ ERP ทั้งหมด
 * @refactored ใช้ Card และ QuickAccessCard components จาก ui folder
 */

import {
    TrendingUp,
    Users,
    ShoppingBag,
    Warehouse,
    FileText,
    Settings,
    Activity,
    DollarSign,
    ChevronRight
} from 'lucide-react';
import { Card } from '@ui/Card';
import { StatCard, QuickAccessCard } from '@ui/StatCard';
import { styles } from '@/shared/constants/styles';

// ====================================================================================
// MAIN COMPONENT - AdminDashboard
// ====================================================================================

export default function AdminDashboard() {

    // ==================== MOCK DATA ====================

    /**
     * Main Modules - รายการโมดูลหลักของระบบ ERP
     * แสดงเป็น Quick Access Cards
     */
    const modules = [
        {
            icon: <ShoppingBag size={28} className="text-blue-600" />,
            title: 'ระบบจัดซื้อ',
            description: 'จัดการใบขอซื้อ ใบสั่งซื้อ และซัพพลายเออร์',
            href: '/procurement/dashboard',
            color: 'bg-blue-600'
        },
        {
            icon: <Warehouse size={28} className="text-purple-600" />,
            title: 'ระบบคลังสินค้า',
            description: 'จัดการสินค้าคงคลัง รับเข้า-จ่ายออก',
            href: '/inventory/dashboard',
            color: 'bg-purple-600'
        },
        {
            icon: <TrendingUp size={28} className="text-green-600" />,
            title: 'ระบบขาย',
            description: 'จัดการใบเสนอราคา ใบสั่งขาย ลูกค้า',
            href: '/sales',
            color: 'bg-green-600'
        },
        {
            icon: <DollarSign size={28} className="text-orange-600" />,
            title: 'ระบบบัญชี',
            description: 'บัญชีจ่าย บัญชีรับ สมุดบัญชีทั่วไป',
            href: '/accounting',
            color: 'bg-orange-600'
        }
    ];

    /**
     * Stats - สถิติสำคัญแสดงด้านบนสุด
     */
    const stats = [
        { icon: <FileText size={24} className="text-blue-600" />, label: 'เอกสารรอดำเนินการ', value: '24', color: 'blue' as const },
        { icon: <Users size={24} className="text-green-600" />, label: 'ผู้ใช้งานออนไลน์', value: '12', change: '+3', color: 'green' as const },
        { icon: <Activity size={24} className="text-purple-600" />, label: 'ธุรกรรมวันนี้', value: '156', change: '+12%', color: 'purple' as const },
        { icon: <Settings size={24} className="text-orange-600" />, label: 'ระบบทั้งหมด', value: '14', color: 'orange' as const }
    ];

    // Recent Activity Data
    const recentActivities = [
        { user: 'Admin User', action: 'สร้างใบขอซื้อ PR-2026-0001', time: '5 นาทีที่แล้ว', module: 'Procurement' },
        { user: 'John Doe', action: 'อนุมัติใบสั่งซื้อ PO-2026-0023', time: '15 นาทีที่แล้ว', module: 'Procurement' },
        { user: 'Jane Smith', action: 'รับเข้าสินค้าพัสดุ GRN-2026-0045', time: '1 ชั่วโมงที่แล้ว', module: 'Inventory' },
        { user: 'Admin User', action: 'เพิ่มซัพพลายเออร์ใหม่', time: '2 ชั่วโมงที่แล้ว', module: 'Procurement' }
    ];

    // System Status Data
    const systemStatus = [
        { name: 'Database Server', status: 'Online', color: 'bg-green-500' },
        { name: 'API Gateway', status: 'Online', color: 'bg-green-500' },
        { name: 'Cache Server', status: 'Online', color: 'bg-green-500' },
        { name: 'File Storage', status: 'Online', color: 'bg-green-500' }
    ];

    // ==================== RENDER ====================
    return (
        <div className={styles.pageContainer}>

            {/* ==================== HEADER ==================== */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">ยินดีต้อนรับสู่ระบบ ERP - จัดการทุกโมดูลได้ที่นี่</p>
            </div>

            {/* ==================== STATS GRID ==================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* ==================== QUICK ACCESS MODULES ==================== */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">โมดูลหลัก</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">เข้าถึงระบบต่างๆ อย่างรวดเร็ว</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((module, index) => (
                        <QuickAccessCard key={index} {...module} />
                    ))}
                </div>
            </div>

            {/* ==================== RECENT ACTIVITY ==================== */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">กิจกรรมล่าสุด</h2>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                        ดูทั้งหมด <ChevronRight size={16} className="ml-1" />
                    </button>
                </div>
                <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                        {activity.user.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.action}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {activity.user} • {activity.module}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* ==================== SYSTEM STATUS & QUICK STATS ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* System Status */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">สถานะระบบ</h3>
                    <div className="space-y-3">
                        {systemStatus.map((system, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{system.name}</span>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 ${system.color} rounded-full`}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{system.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Quick Stats - Progress Bars */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'ใช้งาน Storage', value: '65%', widthClass: 'w-[65%]', color: 'bg-blue-600' },
                            { label: 'API Calls (วันนี้)', value: '2,340', widthClass: 'w-[45%]', color: 'bg-green-600' },
                            { label: 'Active Sessions', value: '23', widthClass: 'w-[30%]', color: 'bg-purple-600' }
                        ].map((stat, index) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">{stat.label}</span>
                                    <span className="text-gray-800 dark:text-gray-200 font-medium">{stat.value}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className={`${stat.color} h-2 rounded-full ${stat.widthClass}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
