/**
 * @file ProcurementDashboard.tsx
 * @description Dashboard สำหรับระบบจัดซื้อ (Procurement Module)
 * @route /procurement/dashboard
 * @purpose แสดงภาพรวมของการจัดซื้อ
 * @refactored ใช้ Card และ StatCard components
 */

import {
    TrendingUp,
    Users,
    Package,
    Target,
    FileText,
    CreditCard,
    BarChart3,
    UserPlus,
    ChevronRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { styles } from '../../constants';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    iconBgColor: string;
}

interface ActivityItemProps {
    orderId: string;
    user: string;
    time: string;
    amount: string;
    status: string;
}

// ====================================================================================
// SUB-COMPONENTS
// ====================================================================================

function QuickActionCard({ icon, label, iconBgColor }: QuickActionProps) {
    return (
        <button className={`${styles.cardHover} p-6 text-left w-full`}>
            <div className={`w-10 h-10 ${iconBgColor} bg-opacity-10 dark:bg-opacity-20 rounded-lg flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</div>
        </button>
    );
}

function ActivityItem({ orderId, user, time, amount, status }: ActivityItemProps) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded flex items-center justify-center">
                    <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{orderId}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Created by {user} • {time}</div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-bold text-gray-800 dark:text-white">฿{amount}</div>
                <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                    {status}
                </span>
            </div>
        </div>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function ProcurementDashboard() {

    // ==================== MOCK DATA ====================

    const metrics = [
        { icon: <TrendingUp size={24} className="text-blue-600" />, label: 'Total Revenue', value: '฿2,456,890', change: '+12.5%', color: 'blue' as const },
        { icon: <Users size={24} className="text-green-600" />, label: 'Active Customers', value: '1,234', change: '+8.2%', color: 'green' as const },
        { icon: <Package size={24} className="text-purple-600" />, label: 'Pending Orders', value: '567', change: '-3.1%', color: 'purple' as const },
        { icon: <Target size={24} className="text-orange-600" />, label: 'Fulfillment Rate', value: '98.5%', change: '+1.3%', color: 'orange' as const }
    ];

    const quickActions = [
        { icon: <FileText size={20} className="text-red-600" />, label: 'Create New Order', iconBgColor: 'bg-red-600' },
        { icon: <CreditCard size={20} className="text-green-600" />, label: 'Process Payment', iconBgColor: 'bg-green-600' },
        { icon: <BarChart3 size={20} className="text-purple-600" />, label: 'Generate Report', iconBgColor: 'bg-purple-600' },
        { icon: <UserPlus size={20} className="text-blue-600" />, label: 'Add Customer', iconBgColor: 'bg-blue-600' }
    ];

    const recentActivities = [
        { orderId: 'Sales Order #SO-2024-1001', user: 'Admin User', time: '2 hours ago', amount: '84011.79', status: 'Confirmed' },
        { orderId: 'Sales Order #SO-2024-1002', user: 'Admin User', time: '2 hours ago', amount: '92609.12', status: 'Confirmed' },
        { orderId: 'Sales Order #SO-2024-1003', user: 'Admin User', time: '2 hours ago', amount: '85982.78', status: 'Confirmed' },
        { orderId: 'Sales Order #SO-2024-1004', user: 'Admin User', time: '2 hours ago', amount: '72894.33', status: 'Confirmed' }
    ];

    return (
        <div className={styles.pageContainer}>

            {/* ==================== METRICS GRID ==================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => (
                    <StatCard key={index} {...metric} />
                ))}
            </div>

            {/* ==================== QUICK ACTIONS ==================== */}
            <Card>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <QuickActionCard key={index} {...action} />
                    ))}
                </div>
            </Card>

            {/* ==================== RECENT ACTIVITY ==================== */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Activity</h2>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                        View All <ChevronRight size={16} className="ml-1" />
                    </button>
                </div>
                <div className="space-y-0">
                    {recentActivities.map((activity, index) => (
                        <ActivityItem key={index} {...activity} />
                    ))}
                </div>
            </Card>
        </div>
    );
}
