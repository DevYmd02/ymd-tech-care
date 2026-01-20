/**
 * @file RolesDashboard.tsx
 * @description Dashboard สำหรับจัดการบทบาทและสิทธิ์การเข้าถึงระบบ
 * @route /roles/dashboard
 * @purpose แสดงภาพรวมของระบบ Roles & Permissions:
 *   - Stats Cards: จำนวน Roles, Permission Actions, Approval Workflow
 *   - Permission Actions: รายการ Actions มาตรฐาน (VIEW, CREATE, EDIT, etc.)
 *   - Roles Grid: รายการ Roles ทั้งหมดในระบบ
 *   - Permission Matrix: ตาราง Role vs Permission
 *   - Security Features & Best Practices: คุณสมบัติด้านความปลอดภัย
 */

import {
    Shield,
    Users,
    Settings,
    Eye,
    Plus,
    Edit,
    CheckCircle,
    Send,
    XCircle,
    Download,
    UserCog,
    Check,
    X,
    Zap,
    Building2,
    Calculator,
    CreditCard,
    Coins,
    BookOpen,
    Landmark,
    Package,
    Factory,
    ShoppingCart,
    Scale,
    Search
} from 'lucide-react';
import { PageBanner } from '../../components/shared/PageBanner';
import { styles } from '../../constants';

// ====================================================================================
// MOCK DATA - ข้อมูลจำลองสำหรับ Dashboard
// ====================================================================================

/**
 * Permission Actions - รายการ Actions มาตรฐานในระบบ
 * แต่ละ Action มี: id, label, description, icon, color
 */
const permissionActions = [
    { id: 'view', label: 'VIEW', description: 'ดูข้อมูล', icon: Eye, color: 'bg-blue-100 text-blue-600' },
    { id: 'create', label: 'CREATE', description: 'สร้างรายการ', icon: Plus, color: 'bg-green-100 text-green-600' },
    { id: 'edit', label: 'EDIT', description: 'แก้ไขเฉพาะไฟล์', icon: Edit, color: 'bg-orange-100 text-orange-600' },
    { id: 'approve', label: 'APPROVE', description: 'อนุมัติ (Maker-Checker)', icon: CheckCircle, color: 'bg-purple-100 text-purple-600' },
    { id: 'post', label: 'POST', description: 'โพสต์บัญชี/ยืนยันเอกสาร', icon: Send, color: 'bg-blue-100 text-blue-600' },
    { id: 'void', label: 'VOID', description: 'ยกเลิก/ย้อนรายการ (ต้องบทบาท)', icon: XCircle, color: 'bg-red-100 text-red-600' },
    { id: 'export', label: 'EXPORT', description: 'ส่งออก/พิมพ์', icon: Download, color: 'bg-teal-100 text-teal-600' },
    { id: 'admin', label: 'ADMIN', description: 'ตั้งค่า/มาสเตอร์/สิทธิ์', icon: UserCog, color: 'bg-pink-100 text-pink-600' },
];

/**
 * Roles Data - รายการ Roles ทั้งหมดในระบบ
 * แต่ละ Role มี: id, name, description, จำนวน permissions, icon, colors
 */
const rolesData = [
    { id: 'sys_admin', name: 'SYS_ADMIN', description: 'จัดการผู้ใช้/สิทธิ์/ตั้งค่าระบบ', perms: 8, icon: Zap, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', iconBg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30', darkBorder: 'dark:border-yellow-700/50', darkIconBg: 'dark:bg-yellow-800/50', iconColor: 'text-yellow-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'cfo', name: 'CFO', description: 'อนุมัติสูงสุด/ป้องกัน/บทบาทเงิน', perms: 4, icon: Building2, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconBg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', darkBorder: 'dark:border-blue-700/50', darkIconBg: 'dark:bg-blue-800/50', iconColor: 'text-blue-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'fin_manager', name: 'FIN_MANAGER', description: 'คุมทีมบัญชี/อนุมัติระดับกลาง', perms: 5, icon: Calculator, bgColor: 'bg-purple-50', borderColor: 'border-purple-200', iconBg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', darkBorder: 'dark:border-purple-700/50', darkIconBg: 'dark:bg-purple-800/50', iconColor: 'text-purple-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'ap_officer', name: 'AP_OFFICER', description: 'จัดการบัญชีเจ้าหนี้', perms: 4, icon: CreditCard, bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', iconBg: 'bg-cyan-100', darkBg: 'dark:bg-cyan-900/30', darkBorder: 'dark:border-cyan-700/50', darkIconBg: 'dark:bg-cyan-800/50', iconColor: 'text-cyan-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'ar_officer', name: 'AR_OFFICER', description: 'จัดการบัญชีลูกหนี้', perms: 4, icon: Coins, bgColor: 'bg-orange-50', borderColor: 'border-orange-200', iconBg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', darkBorder: 'dark:border-orange-700/50', darkIconBg: 'dark:bg-orange-800/50', iconColor: 'text-orange-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'gl_accountant', name: 'GL_ACCOUNTANT', description: 'บันทึกบัญชีแยกประเภท', perms: 5, icon: BookOpen, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', iconBg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', darkBorder: 'dark:border-indigo-700/50', darkIconBg: 'dark:bg-indigo-800/50', iconColor: 'text-indigo-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'POST', 'EXPORT'] },
    { id: 'cashier', name: 'CASHIER', description: 'จัดการเงินสดและธนาคาร', perms: 4, icon: Landmark, bgColor: 'bg-pink-50', borderColor: 'border-pink-200', iconBg: 'bg-pink-100', darkBg: 'dark:bg-pink-900/30', darkBorder: 'dark:border-pink-700/50', darkIconBg: 'dark:bg-pink-800/50', iconColor: 'text-pink-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'procurement_officer', name: 'PROCUREMENT_OFFICER', description: 'จัดการการจัดซื้อ', perms: 4, icon: Package, bgColor: 'bg-green-50', borderColor: 'border-green-200', iconBg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', darkBorder: 'dark:border-green-700/50', darkIconBg: 'dark:bg-green-800/50', iconColor: 'text-green-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'warehouse_officer', name: 'WAREHOUSE_OFFICER', description: 'จัดการคลังสินค้า', perms: 4, icon: Package, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconBg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', darkBorder: 'dark:border-amber-700/50', darkIconBg: 'dark:bg-amber-800/50', iconColor: 'text-amber-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'production_planner', name: 'PRODUCTION_PLANNER', description: 'วางแผนและควบคุมการผลิต', perms: 4, icon: Factory, bgColor: 'bg-violet-50', borderColor: 'border-violet-200', iconBg: 'bg-violet-100', darkBg: 'dark:bg-violet-900/30', darkBorder: 'dark:border-violet-700/50', darkIconBg: 'dark:bg-violet-800/50', iconColor: 'text-violet-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'sales_officer', name: 'SALES_OFFICER', description: 'จัดการฝ่ายขาย', perms: 4, icon: ShoppingCart, bgColor: 'bg-rose-50', borderColor: 'border-rose-200', iconBg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/30', darkBorder: 'dark:border-rose-700/50', darkIconBg: 'dark:bg-rose-800/50', iconColor: 'text-rose-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'tax_compliance', name: 'TAX_COMPLIANCE', description: 'จัดการภาษีและการปฎิบัติตาม', perms: 5, icon: Scale, bgColor: 'bg-lime-50', borderColor: 'border-lime-200', iconBg: 'bg-lime-100', darkBg: 'dark:bg-lime-900/30', darkBorder: 'dark:border-lime-700/50', darkIconBg: 'dark:bg-lime-800/50', iconColor: 'text-lime-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'POST', 'EXPORT'] },
    { id: 'internal_auditor', name: 'INTERNAL_AUDITOR', description: 'Read-only + export ตามสิทธิ์', perms: 2, icon: Search, bgColor: 'bg-gray-50', borderColor: 'border-gray-200', iconBg: 'bg-gray-100', darkBg: 'dark:bg-slate-800/50', darkBorder: 'dark:border-slate-600/50', darkIconBg: 'dark:bg-slate-700/50', iconColor: 'text-gray-600', permissions: ['VIEW', 'EXPORT'] },
];

/**
 * Permission Matrix - ตาราง Role vs Permission
 * ใช้แสดงในรูปแบบ Check/X matrix
 */
const permissionMatrix = [
    { role: 'SYS_ADMIN', icon: Zap, view: true, create: true, edit: true, approve: true, post: false, void: true, export: true, admin: true },
    { role: 'CFO', icon: Building2, view: true, create: true, edit: false, approve: true, post: false, void: false, export: true, admin: false },
    { role: 'FIN_MANAGER', icon: Calculator, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'AP_OFFICER', icon: CreditCard, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'AR_OFFICER', icon: Coins, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'GL_ACCOUNTANT', icon: BookOpen, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'CASHIER', icon: Landmark, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'PROCUREMENT_OFFICER', icon: Package, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'WAREHOUSE_OFFICER', icon: Package, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'PRODUCTION_PLANNER', icon: Factory, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'SALES_OFFICER', icon: ShoppingCart, view: true, create: true, edit: true, approve: false, post: false, void: false, export: true, admin: false },
    { role: 'TAX_COMPLIANCE', icon: Scale, view: true, create: true, edit: true, approve: false, post: true, void: false, export: true, admin: false },
    { role: 'INTERNAL_AUDITOR', icon: Search, view: true, create: false, edit: false, approve: false, post: false, void: false, export: true, admin: false },
];

// ====================================================================================
// MAIN COMPONENT - RolesDashboard
// ====================================================================================

export default function RolesDashboard() {
    return (
        <div className={styles.pageContainer}>

            {/* ==================== HEADER BANNER ==================== */}
            <PageBanner
                icon={<Shield size={32} />}
                title="Roles & Permissions Management"
                subtitle="จัดการบทบาทและสิทธิ์การเข้าถึงระบบ ERP"
            />

            {/* ==================== STATS CARDS ==================== */}
            {/* 3 การ์ดสรุป: Total Roles, Permission Actions, Approval Workflow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Total Roles */}
                <div className={`${styles.cardGlass} p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                            <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-800 dark:text-white">13</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Roles</div>
                    </div>
                </div>

                {/* Card 2: Permission Actions */}
                <div className={`${styles.cardGlass} p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                            <Settings size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">Configured</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-800 dark:text-white">8</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Permission Actions</div>
                    </div>
                </div>

                {/* Card 3: Approval Workflow */}
                <div className={`${styles.cardGlass} p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">Enabled</span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">Maker-Checker</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Approval Workflow</div>
                    </div>
                </div>
            </div>

            {/* ==================== PERMISSION ACTIONS ==================== */}
            {/* Grid แสดง Actions มาตรฐานทั้งหมด */}
            <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                    <Settings size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Permission Actions (มาตรฐาน)</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {permissionActions.map((action) => (
                        <div key={action.id} className={`${action.color} dark:bg-opacity-20 rounded-lg p-4 flex items-center space-x-3`}>
                            <action.icon size={20} />
                            <div>
                                <div className="font-bold text-sm">{action.label}</div>
                                <div className="text-xs opacity-80">{action.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ==================== ROLES GRID ==================== */}
            {/* Grid แสดง Roles ทั้งหมดในระบบ */}
            <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                    <Users size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Roles (บทบาทผู้ใช้งาน)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesData.map((role) => (
                        <div key={role.id} className={`${role.bgColor} ${role.darkBg} ${role.borderColor} ${role.darkBorder} border rounded-xl p-4 transition-all hover:scale-[1.02]`}>
                            <div className="flex items-start justify-between mb-3">
                                {/* Role Icon */}
                                <div className={`w-10 h-10 ${role.iconBg} ${role.darkIconBg} rounded-lg flex items-center justify-center`}>
                                    <role.icon size={20} className={`${role.iconColor} dark:opacity-90`} />
                                </div>
                                {/* Permission Count */}
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">{role.perms} perms</span>
                            </div>
                            {/* Role Details */}
                            <h3 className="font-bold text-gray-800 dark:text-white mb-1">{role.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{role.description}</p>
                            {/* Permission Badges */}
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.map((perm) => (
                                    <span key={perm} className="text-xs font-medium bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-200 px-2 py-0.5 rounded">
                                        {perm}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ==================== PERMISSION MATRIX ==================== */}
            {/* ตาราง Role vs Permission แบบ Check/X */}
            <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
                <div className="flex items-center space-x-2 mb-6">
                    <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Permission Matrix</h2>
                </div>
                <table className="w-full min-w-[800px]">
                    {/* Table Header */}
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">VIEW</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">CREATE</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">EDIT</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">APPROVE</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">POST</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">VOID</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">EXPORT</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">ADMIN</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody>
                        {permissionMatrix.map((row, index) => (
                            <tr key={row.role} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'}>
                                {/* Role Name with Icon */}
                                <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                        <row.icon size={16} className="text-gray-500 dark:text-gray-400" />
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{row.role}</span>
                                    </div>
                                </td>
                                {/* Permission Cells - Check = สีเขียว, X = สีเทา */}
                                <td className="text-center py-3 px-4">{row.view ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.create ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.edit ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.approve ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.post ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.void ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.export ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                                <td className="text-center py-3 px-4">{row.admin ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 dark:text-gray-600 mx-auto" />}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ==================== SECURITY FEATURES & BEST PRACTICES ==================== */}
            {/* 2 Cards แสดงคุณสมบัติด้านความปลอดภัย */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card 1: Security Features */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-2 mb-4">
                        <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Security Features</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Role-Based Access Control (RBAC)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Maker-Checker Approval Workflow</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Audit Trail & Activity Logging</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Segregation of Duties (SoD)</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Best Practices */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2 mb-4">
                        <Settings size={20} className="text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Best Practices</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Principle of Least Privilege</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Regular Permission Reviews</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>Document All Permission Changes</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <Check size={16} className="text-green-600 dark:text-green-400" />
                            <span>IPO & SOX Compliance Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
