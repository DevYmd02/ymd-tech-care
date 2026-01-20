/**
 * @file ITGCDashboard.tsx
 * @description Dashboard สำหรับ IT General Controls (ITGC)
 * @purpose แสดงภาพรวมของระบบควบคุม IT ประกอบด้วย:
 *   - Access Control (การควบคุมการเข้าถึง)
 *   - Security Metrics (ตัวชี้วัดความปลอดภัย)
 *   - Change Management (การจัดการการเปลี่ยนแปลง)
 *   - IT Operations & Job Monitoring (การดำเนินงาน IT)
 */

import {
    Shield,
    Users,
    Key,
    Lock,
    Smartphone,
    AlertTriangle,
    Clock,
    GitBranch,
    Server,
    Check,
    CheckCircle,
    ExternalLink
} from 'lucide-react';
import { PageBanner } from '../../components/shared/PageBanner';
import { styles } from '../../constants';

// ====================================================================================
// MOCK DATA - ข้อมูลจำลองสำหรับ Dashboard
// ====================================================================================

/**
 * ข้อมูลสถิติ Access Control
 * แสดงจำนวนผู้ใช้, Roles, SSO และ MFA
 */
const accessControlStats = [
    { id: 'active-users', value: '247', label: 'Active Users', icon: Users, bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'active-roles', value: '13', label: 'Active Roles', icon: Key, bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'sso-enabled', value: 'Yes', label: 'SSO Enabled', icon: Lock, bgColor: 'bg-yellow-50', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { id: 'mfa-users', value: '98%', label: 'MFA Users', icon: Smartphone, bgColor: 'bg-pink-50', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
];

/**
 * ข้อมูลตัวชี้วัดความปลอดภัย (Security Metrics)
 * แสดงสถานะ normal, warning หรือ critical
 */
const securityMetrics = [
    { id: 'failed-login', value: '12', label: 'Failed Login Attempts (24h)', status: 'normal', statusColor: 'bg-green-100 text-green-700' },
    { id: 'session-timeout', value: '30 min', label: 'Session Timeouts', status: 'normal', statusColor: 'bg-green-100 text-green-700' },
    { id: 'password-expiry', value: '90 days', label: 'Password Expiry', status: 'normal', statusColor: 'bg-green-100 text-green-700' },
    { id: 'inactive-users', value: '5', label: 'Inactive Users (90d+)', status: 'warning', statusColor: 'bg-orange-100 text-orange-700' },
];

/**
 * ข้อมูลคำขอเปลี่ยนแปลงระบบ (Change Request)
 * แสดงสถานะ: Approved, In Review, Deployed, Pending
 */
const changeManagementData = [
    { id: 'CHG-2026-001', title: 'Update GL Posting Rules', requester: 'John Doe', date: '2026-01-05', status: 'Approved', statusColor: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'CHG-2026-002', title: 'Add New Warehouse Location', requester: 'Jane Smith', date: '2026-01-06', status: 'In Review', statusColor: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'CHG-2026-003', title: 'Modify AP Approval Workflow', requester: 'Mike Johnson', date: '2026-01-04', status: 'Deployed', statusColor: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'CHG-2026-004', title: 'Update Tax Calculation Logic', requester: 'Sarah Lee', date: '2026-01-07', status: 'Pending', statusColor: 'bg-purple-100 text-purple-700 border-purple-200' },
];

/**
 * ข้อมูล Scheduled Jobs ของระบบ IT
 * แสดงสถานะการรัน: Success, Pending, Failed
 */
const itOperationsJobs = [
    { id: 'db-backup', name: 'Database Backup', frequency: 'Daily', lastRun: 'Last: 2 hours ago', nextRun: 'Next: In 22 hours', status: 'Success', statusColor: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, iconColor: 'text-green-500' },
    { id: 'mrp-calc', name: 'MRP Calculation', frequency: 'Daily', lastRun: 'Last: 5 hours ago', nextRun: 'Next: In 19 hours', status: 'Success', statusColor: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, iconColor: 'text-green-500' },
    { id: 'depreciation', name: 'Depreciation Run', frequency: 'Monthly', lastRun: 'Last: 1 day ago', nextRun: 'Next: In 29 days', status: 'Success', statusColor: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, iconColor: 'text-green-500' },
    { id: 'period-close', name: 'Period Close Job', frequency: 'Monthly', lastRun: 'Last: 30 days ago', nextRun: 'Next: Manual', status: 'Pending', statusColor: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock, iconColor: 'text-yellow-500' },
    { id: 'restore-test', name: 'Restore Test', frequency: 'Weekly', lastRun: 'Last: 7 days ago', nextRun: 'Next: In 7 days', status: 'Success', statusColor: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, iconColor: 'text-green-500' },
];

// ====================================================================================
// COMPONENT - ITGCDashboard
// ====================================================================================

export default function ITGCDashboard() {
    return (
        <div className={styles.pageContainer}>

            {/* ==================== HEADER BANNER ==================== */}
            <PageBanner
                icon={<Lock size={32} />}
                title="IT General Controls (ITGC)"
                subtitle="Access Control • Change Management • IT Operations"
            />

            {/* ==================== ACCESS CONTROL SECTION ==================== */}
            {/* แสดงสถิติการควบคุมการเข้าถึงระบบ */}
            <div className={`${styles.cardGlass} p-6`}>
                {/* Section Header */}
                <div className="flex items-center space-x-2 mb-6">
                    <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Access Control</h2>
                </div>

                {/* Stats Grid - 4 คอลัมน์ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accessControlStats.map((stat) => (
                        <div key={stat.id} className={`${stat.bgColor} dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600`}>
                            {/* Icon & Checkmark */}
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 ${stat.iconBg} dark:bg-opacity-30 rounded-lg flex items-center justify-center`}>
                                    <stat.icon size={20} className={stat.iconColor} />
                                </div>
                                <Check size={18} className="text-green-500" />
                            </div>
                            {/* Value & Label */}
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ==================== SECURITY METRICS SECTION ==================== */}
            {/* แสดงตัวชี้วัดความปลอดภัยของระบบ */}
            <div className={`${styles.cardGlass} p-6`}>
                {/* Section Header */}
                <div className="flex items-center space-x-2 mb-6">
                    <AlertTriangle size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Security Metrics</h2>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {securityMetrics.map((metric) => (
                        <div key={metric.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-600">
                            {/* Status Badge */}
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${metric.statusColor}`}>
                                    {metric.status}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">→</span>
                            </div>
                            {/* Value & Label */}
                            <div className="text-2xl font-bold text-gray-800 dark:text-white">{metric.value}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ==================== CHANGE MANAGEMENT SECTION ==================== */}
            {/* ตารางแสดงรายการคำขอเปลี่ยนแปลงระบบ */}
            <div className={`${styles.cardGlass} p-6`}>
                {/* Section Header */}
                <div className="flex items-center space-x-2 mb-6">
                    <GitBranch size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Change Management</h2>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        {/* Table Header */}
                        <thead>
                            <tr className={styles.tableHeader}>
                                <th className={styles.tableTh}>Change ID</th>
                                <th className={styles.tableTh}>Title</th>
                                <th className={styles.tableTh}>Requester</th>
                                <th className={styles.tableTh}>Date</th>
                                <th className={styles.tableTh}>Status</th>
                                <th className={styles.tableTh}>Actions</th>
                            </tr>
                        </thead>
                        {/* Table Body */}
                        <tbody>
                            {changeManagementData.map((change) => (
                                <tr key={change.id} className={styles.tableTr}>
                                    <td className={`${styles.tableTd} font-medium text-blue-600 dark:text-blue-400`}>{change.id}</td>
                                    <td className={`${styles.tableTd} text-gray-700 dark:text-gray-200`}>{change.title}</td>
                                    <td className={styles.tableTd}>{change.requester}</td>
                                    <td className={styles.tableTd}>{change.date}</td>
                                    <td className={styles.tableTd}>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded border ${change.statusColor}`}>
                                            {change.status}
                                        </span>
                                    </td>
                                    <td className={styles.tableTd}>
                                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center">
                                            View Details <ExternalLink size={14} className="ml-1" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==================== IT OPERATIONS & JOB MONITORING ==================== */}
            {/* แสดงสถานะ Scheduled Jobs ของระบบ */}
            <div className={`${styles.cardGlass} p-6`}>
                {/* Section Header */}
                <div className="flex items-center space-x-2 mb-6">
                    <Server size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">IT Operations & Job Monitoring</h2>
                </div>

                {/* Job List */}
                <div className="space-y-3">
                    {itOperationsJobs.map((job) => (
                        <div key={job.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 flex items-center justify-between">
                            {/* Job Info (Left) */}
                            <div className="flex items-center space-x-4">
                                {/* Status Icon */}
                                <div className={`w-10 h-10 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center border ${job.iconColor === 'text-green-500' ? 'border-green-200 dark:border-green-600' : 'border-yellow-200 dark:border-yellow-600'}`}>
                                    <job.icon size={20} className={job.iconColor} />
                                </div>
                                {/* Job Details */}
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-gray-800 dark:text-white">{job.name}</span>
                                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{job.frequency}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {job.lastRun} • {job.nextRun}
                                    </div>
                                </div>
                            </div>
                            {/* Status Badge (Right) */}
                            <span className={`text-xs font-semibold px-3 py-1 rounded border ${job.statusColor}`}>
                                {job.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ==================== BOTTOM INFO CARDS ==================== */}
            {/* 3 cards สรุปคุณสมบัติหลักของ ITGC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1: Access Control Features */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                        <Shield size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Access Control</h3>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>RBAC Implementation</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Password Policy Enforcement</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>MFA for Critical Roles</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Change Management Features */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-4">
                        <GitBranch size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Change Management</h3>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Approval Workflow</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Deployment Tracking</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Version Control</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: IT Operations Features */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                        <Server size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">IT Operations</h3>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Automated Backups</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Restore Testing</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Job Monitoring</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
