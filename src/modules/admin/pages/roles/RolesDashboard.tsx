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

import { useState } from 'react';
import {
    Shield,
    Eye,
    Plus,
    Edit,
    CheckCircle,
    Send,
    XCircle,
    Download,
    UserCog,
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
    Search,
    ListFilter
} from 'lucide-react';
import { PageBanner } from '@layout/PageBanner';
import { styles } from '@/shared/constants/styles';

// Import newly created Tab sub-components
import { OverviewTab } from './components/OverviewTab';
import { PermissionMatrixTab } from './components/PermissionMatrixTab';
import { UserAssignmentTab } from './components/UserAssignmentTab';
import { PermissionSandboxTab } from './components/PermissionSandboxTab';

// ====================================================================================
// MOCK DATA - ข้อมูลจำลองสำหรับ Dashboard
// ====================================================================================

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

const rolesData = [
    { id: 'sys_admin', name: 'SYS_ADMIN', description: 'จัดการผู้ใช้/สิทธิ์/ตั้งค่าระบบ', perms: 8, icon: Zap, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', iconBg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30', darkBorder: 'dark:border-yellow-700/50', darkIconBg: 'dark:bg-yellow-800/50', iconColor: 'text-yellow-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'cfo', name: 'CFO', description: 'อนุมัติสูงสุด/ป้องกัน/บทบาทเงิน', perms: 4, icon: Building2, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', iconBg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', darkBorder: 'dark:border-blue-700/50', darkIconBg: 'dark:bg-blue-800/50', iconColor: 'text-blue-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'fin_manager', name: 'FIN_MANAGER', description: 'คุมทีมบัญชี/อนุมัติระดับกลาง', perms: 5, icon: Calculator, bgColor: 'bg-purple-50', borderColor: 'border-purple-200', iconBg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', darkBorder: 'dark:border-purple-700/50', darkIconBg: 'dark:bg-purple-800/50', iconColor: 'text-purple-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'ap_officer', name: 'AP_OFFICER', description: 'จัดการบัญชีเจ้าหนี้', perms: 4, icon: CreditCard, bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', iconBg: 'bg-cyan-100', darkBg: 'dark:bg-cyan-900/30', darkBorder: 'dark:border-cyan-700/50', darkIconBg: 'dark:bg-cyan-800/50', iconColor: 'text-cyan-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'ar_officer', name: 'AR_OFFICER', description: 'จัดการบัญชีลูกหนี้', perms: 4, icon: Coins, bgColor: 'bg-orange-50', borderColor: 'border-orange-200', iconBg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', darkBorder: 'dark:border-orange-700/50', darkIconBg: 'dark:bg-orange-800/50', iconColor: 'text-orange-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'gl_accountant', name: 'GL_ACCOUNTANT', description: 'บันทึกบัญชีแยกประเภท', perms: 5, icon: BookOpen, bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', iconBg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', darkBorder: 'dark:border-indigo-700/50', darkIconBg: 'dark:bg-indigo-800/50', iconColor: 'text-indigo-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'POST', 'EXPORT'] },
    { id: 'cashier', name: 'CASHIER', description: 'จัดการเงินสดและธนาคาร', perms: 4, icon: Landmark, bgColor: 'bg-pink-50', borderColor: 'border-pink-200', iconBg: 'bg-pink-100', darkBg: 'dark:bg-pink-950/30', darkBorder: 'dark:border-pink-700/50', darkIconBg: 'dark:bg-pink-800/50', iconColor: 'text-pink-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'procurement_officer', name: 'PROCUREMENT_OFFICER', description: 'จัดการการจัดซื้อ', perms: 4, icon: Package, bgColor: 'bg-green-50', borderColor: 'border-green-200', iconBg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', darkBorder: 'dark:border-green-700/50', darkIconBg: 'dark:bg-green-800/50', iconColor: 'text-green-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'warehouse_officer', name: 'WAREHOUSE_OFFICER', description: 'จัดการคลังสินค้า', perms: 4, icon: Package, bgColor: 'bg-amber-50', borderColor: 'border-amber-200', iconBg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', darkBorder: 'dark:border-amber-700/50', darkIconBg: 'dark:bg-amber-800/50', iconColor: 'text-amber-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'production_planner', name: 'PRODUCTION_PLANNER', description: 'วางแผนและควบคุมการผลิต', perms: 4, icon: Factory, bgColor: 'bg-violet-50', borderColor: 'border-violet-200', iconBg: 'bg-violet-100', darkBg: 'dark:bg-violet-900/30', darkBorder: 'dark:border-violet-700/50', darkIconBg: 'dark:bg-violet-800/50', iconColor: 'text-violet-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'sales_officer', name: 'SALES_OFFICER', description: 'จัดการฝ่ายขาย', perms: 4, icon: ShoppingCart, bgColor: 'bg-rose-50', borderColor: 'border-rose-200', iconBg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/30', darkBorder: 'dark:border-rose-700/50', darkIconBg: 'dark:bg-rose-800/50', iconColor: 'text-rose-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'EXPORT'] },
    { id: 'tax_compliance', name: 'TAX_COMPLIANCE', description: 'จัดการภาษีและการปฎิบัติตาม', perms: 5, icon: Scale, bgColor: 'bg-lime-50', borderColor: 'border-lime-200', iconBg: 'bg-lime-100', darkBg: 'dark:bg-lime-900/30', darkBorder: 'dark:border-lime-700/50', darkIconBg: 'dark:bg-lime-800/50', iconColor: 'text-lime-600', permissions: ['VIEW', 'CREATE', 'EDIT', 'POST', 'EXPORT'] },
    { id: 'internal_auditor', name: 'INTERNAL_AUDITOR', description: 'Read-only + export ตามสิทธิ์', perms: 2, icon: Search, bgColor: 'bg-gray-50', borderColor: 'border-gray-200', iconBg: 'bg-gray-100', darkBg: 'dark:bg-slate-800/50', darkBorder: 'dark:border-slate-600/50', darkIconBg: 'dark:bg-slate-700/50', iconColor: 'text-gray-600', permissions: ['VIEW', 'EXPORT'] },
];



const rolesList = rolesData.map(r => r.name);

// ====================================================================================
// MAIN COMPONENT - RolesDashboard
// ====================================================================================

export default function RolesDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'assignment' | 'sandbox'>('overview');

    return (
        <div className={styles.pageContainer}>

            {/* ==================== HEADER BANNER ==================== */}
            <PageBanner
                icon={<Shield size={32} />}
                title="Roles & Permissions Management"
                subtitle="จัดการบทบาทและสิทธิ์การเข้าถึงระบบ ERP"
            />

            {/* ==================== STATEFUL TABS LIST ==================== */}
            <div className="flex border-b border-gray-200 dark:border-gray-700/80 mb-8 p-1 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl max-w-4xl shadow-inner overflow-x-auto md:overflow-x-visible">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === 'overview'
                            ? 'bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <ListFilter size={16} />
                    ภาพรวม (Overview)
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === 'matrix'
                            ? 'bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Shield size={16} />
                    สิทธิ์แบบ Matrix
                </button>
                <button
                    onClick={() => setActiveTab('assignment')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === 'assignment'
                            ? 'bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <UserCog size={16} />
                    มอบหมายบทบาท
                </button>
                <button
                    onClick={() => setActiveTab('sandbox')}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === 'sandbox'
                            ? 'bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Zap size={16} />
                    ห้องทดลองระบบสิทธิ์
                </button>
            </div>

            {/* ==================== DYNAMIC TAB RENDERING ==================== */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <OverviewTab rolesData={rolesData} permissionActions={permissionActions} />
                )}
                
                {activeTab === 'matrix' && (
                    <PermissionMatrixTab />
                )}
                
                {activeTab === 'assignment' && (
                    <UserAssignmentTab rolesList={rolesList} />
                )}

                {activeTab === 'sandbox' && (
                    <PermissionSandboxTab />
                )}
            </div>

        </div >
    );
}
