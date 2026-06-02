import React, { useState } from 'react';
import { usePermission } from '@/core/auth/contexts/PermissionContext';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { 
    Zap, 
    Lock, 
    Unlock, 
    FileText, 
    CheckSquare, 
    Database, 
    Trash2, 
    ShieldCheck,
    ShieldAlert,
    LayoutGrid,
    Eye,
    PlusCircle,
    UserCheck,
    ShoppingCart,
    Package,
    Factory,
    Scale,
    Building2,
    Calculator,
    Users,
    Activity,
    ChevronRight
} from 'lucide-react';

export const PermissionSandboxTab: React.FC = () => {
    const { toast } = useToast();
    const { 
        activeRole, 
        setActiveRole, 
        hasPermission, 
        hasModuleAccess, 
        hasMasterDataAccess, 
        permissionMatrix 
    } = usePermission();
    
    // States for simulation workspace
    const [selectedMenu, setSelectedMenu] = useState<string>('welcome');
    const [isMasterDataExpanded, setIsMasterDataExpanded] = useState<boolean>(true);

    const handleSimulatedAction = (actionName: string, actionKey: 'view' | 'create' | 'edit' | 'approve' | 'post' | 'void' | 'export' | 'admin') => {
        const allowed = hasPermission(actionKey);
        if (allowed) {
            toast(`สิทธิ์สมบูรณ์: ทำการ [${actionName}] สำเร็จด้วยบทบาท ${activeRole}`, 'success');
        } else {
            toast(`ปฏิเสธการเข้าถึง: บทบาท ${activeRole} ไม่มีสิทธิ์ในการ [${actionName}]`, 'error');
        }
    };

    const currentRolePermissions = permissionMatrix.find(r => r.role === activeRole) || {
        role: activeRole,
        view: false,
        create: false,
        edit: false,
        approve: false,
        post: false,
        void: false,
        export: false,
        admin: false
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 p-6 rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Zap className="text-amber-500 animate-pulse" size={24} />
                        ห้องทดลองระบบสิทธิ์ (Interactive Sandbox)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ทดลองสลับบทบาทจำลองเพื่อสังเกตการเปิด-ปิดการเข้าถึงของเมนูนำทาง (Sidebar) ปุ่มปฏิบัติการ และสิทธิ์ข้อมูลหลักแบบสดๆ ได้ทันที
                    </p>
                </div>

                {/* Role Switcher Dropdown */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800/80 px-4 py-2.5 rounded-xl border border-gray-250 dark:border-gray-700 shadow-sm w-full xl:w-auto">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">บทบาทจำลอง (Simulated Role):</span>
                    <select
                        value={activeRole}
                        onChange={(e) => {
                            setActiveRole(e.target.value);
                            setSelectedMenu('welcome'); // Reset screen on switch
                            toast(`จำลองบทบาทเป็น ${e.target.value} สำเร็จ`, 'info');
                        }}
                        className="bg-transparent text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer pr-0.5 w-full xl:w-48 dark:bg-gray-800"
                    >
                        {permissionMatrix.map((r) => (
                            <option key={r.role} value={r.role} className="text-gray-800 dark:text-white dark:bg-gray-800 font-medium">
                                {r.role}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Matrix & Button Testing Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Panel 1: Permission Summary Badges */}
                <div className="bg-white dark:bg-gray-800/40 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                            <ShieldCheck className="text-emerald-500" size={18} />
                            สิทธิ์การทำรายการปัจจุบัน
                        </h3>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            {activeRole}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {(['view', 'create', 'edit', 'approve', 'post', 'void', 'export', 'admin'] as const).map((key) => {
                            const allowed = !!currentRolePermissions[key];
                            return (
                                <div 
                                    key={key}
                                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                                        allowed 
                                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                            : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-wider uppercase">{key}</span>
                                        {allowed ? <Unlock size={14} className="stroke-[2.5]" /> : <Lock size={14} className="stroke-[2.5]" />}
                                    </div>
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
                                        {allowed ? 'อนุมัติสิทธิ์' : 'ล็อกไว้'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Panel 2: Simulated Button-Level Actions */}
                <div className="bg-white dark:bg-gray-800/40 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 lg:col-span-2">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm border-b border-gray-100 dark:border-gray-700/60 pb-3">
                        <CheckSquare className="text-indigo-500" size={18} />
                        ทดสอบสิทธิ์ของปุ่มทำรายการ (Button-Level Integration)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                        {/* VIEW */}
                        <button
                            onClick={() => handleSimulatedAction('ดูเอกสาร', 'view')}
                            className="p-4 rounded-xl border border-gray-250 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 flex flex-col items-center justify-center gap-2 text-center transition-all group"
                        >
                            <Eye size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-gray-850 dark:text-gray-200">ดูข้อมูลเอกสาร</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">Requires VIEW</span>
                        </button>

                        {/* CREATE */}
                        <button
                            onClick={() => handleSimulatedAction('สร้างเอกสาร', 'create')}
                            className="p-4 rounded-xl border border-gray-250 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 flex flex-col items-center justify-center gap-2 text-center transition-all group"
                        >
                            <PlusCircle size={20} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-gray-850 dark:text-gray-200">สร้างเอกสารใหม่</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">Requires CREATE</span>
                        </button>

                        {/* EDIT */}
                        <button
                            onClick={() => handleSimulatedAction('แก้ไขเอกสาร', 'edit')}
                            disabled={!currentRolePermissions.edit}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all relative ${
                                currentRolePermissions.edit
                                    ? 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-gray-800 dark:text-gray-200 cursor-pointer shadow-sm'
                                    : 'border-gray-200 dark:border-gray-750 bg-gray-100/30 dark:bg-gray-800/20 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {!currentRolePermissions.edit && <Lock size={12} className="absolute top-2 right-2 text-gray-400 dark:text-gray-450" />}
                            <FileText size={20} className={currentRolePermissions.edit ? 'text-orange-500' : 'text-gray-400 dark:text-gray-400'} />
                            <span className="text-sm font-bold">แก้ไขข้อมูลเอกสาร</span>
                            <span className={`text-[10px] uppercase tracking-wide font-semibold ${currentRolePermissions.edit ? 'text-gray-400 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>Requires EDIT</span>
                        </button>

                        {/* APPROVE */}
                        <button
                            onClick={() => handleSimulatedAction('อนุมัติเอกสาร', 'approve')}
                            disabled={!currentRolePermissions.approve}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all relative ${
                                currentRolePermissions.approve
                                    ? 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-gray-800 dark:text-gray-200 cursor-pointer shadow-sm'
                                    : 'border-gray-200 dark:border-gray-750 bg-gray-100/30 dark:bg-gray-800/20 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {!currentRolePermissions.approve && <Lock size={12} className="absolute top-2 right-2 text-gray-400 dark:text-gray-455" />}
                            <UserCheck size={20} className={currentRolePermissions.approve ? 'text-purple-500' : 'text-gray-400 dark:text-gray-400'} />
                            <span className="text-sm font-bold">อนุมัติเอกสาร</span>
                            <span className={`text-[10px] uppercase tracking-wide font-semibold ${currentRolePermissions.approve ? 'text-gray-400 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>Requires APPROVE</span>
                        </button>

                        {/* POST */}
                        <button
                            onClick={() => handleSimulatedAction('โพสต์ผ่านบัญชี', 'post')}
                            disabled={!currentRolePermissions.post}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all relative ${
                                currentRolePermissions.post
                                    ? 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-gray-800 dark:text-gray-200 cursor-pointer shadow-sm'
                                    : 'border-gray-200 dark:border-gray-750 bg-gray-100/30 dark:bg-gray-800/20 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {!currentRolePermissions.post && <Lock size={12} className="absolute top-2 right-2 text-gray-400 dark:text-gray-455" />}
                            <Database size={20} className={currentRolePermissions.post ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-400'} />
                            <span className="text-sm font-bold">โพสต์ผ่านบัญชี (Post GL)</span>
                            <span className={`text-[10px] uppercase tracking-wide font-semibold ${currentRolePermissions.post ? 'text-gray-400 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>Requires POST</span>
                        </button>

                        {/* VOID */}
                        <button
                            onClick={() => handleSimulatedAction('ยกเลิกรายการ', 'void')}
                            disabled={!currentRolePermissions.void}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all relative ${
                                currentRolePermissions.void
                                    ? 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-gray-800 dark:text-gray-200 cursor-pointer shadow-sm'
                                    : 'border-gray-200 dark:border-gray-750 bg-gray-100/30 dark:bg-gray-800/20 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {!currentRolePermissions.void && <Lock size={12} className="absolute top-2 right-2 text-gray-400 dark:text-gray-455" />}
                            <Trash2 size={20} className={currentRolePermissions.void ? 'text-rose-500' : 'text-gray-400 dark:text-gray-400'} />
                            <span className="text-sm font-bold">ยกเลิกรายการ (Void)</span>
                            <span className={`text-[10px] uppercase tracking-wide font-semibold ${currentRolePermissions.void ? 'text-gray-400 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>Requires VOID</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ====================================================================================
                SIMULATED ERP INTEGRATED WORKSPACE (WOW FACTOR split sidebar & panel)
                ==================================================================================== */}
            <div className="bg-white dark:bg-gray-800/40 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col lg:flex-row min-h-[480px]">
                
                {/* 1. LEFT SIDEBAR: Navigations controlled by RBAC matrix (25%) */}
                <div className="w-full lg:w-72 bg-slate-50/60 dark:bg-gray-900/40 border-r border-gray-250 dark:border-gray-700/80 p-4 flex flex-col justify-between shrink-0">
                    <div className="space-y-4">
                        {/* Header logo/title */}
                        <div className="flex items-center space-x-2.5 px-2 py-1">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white">
                                <Building2 size={16} />
                            </div>
                            <div>
                                <span className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">YMD TECH CARE</span>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase">Simulated ERP Portal</p>
                            </div>
                        </div>

                        {/* Navigation Groups */}
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider px-2 block mb-1.5">หน้าหลัก & โมดูลงาน</span>
                            
                            {/* Dashboard (Always visible) */}
                            <button
                                onClick={() => setSelectedMenu('welcome')}
                                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    selectedMenu === 'welcome'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                }`}
                            >
                                <LayoutGrid size={15} />
                                <span>ยินดีต้อนรับ (Sandbox Hub)</span>
                            </button>

                            {/* SALES MODULE */}
                            {hasModuleAccess('sales') && (
                                <button
                                    onClick={() => setSelectedMenu('sales')}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        selectedMenu === 'sales'
                                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    <ShoppingCart size={15} className="text-rose-500" />
                                    <span>โมดูลการขาย (Sales)</span>
                                </button>
                            )}

                            {/* PROCUREMENT MODULE */}
                            {hasModuleAccess('procurement') && (
                                <button
                                    onClick={() => setSelectedMenu('procurement')}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        selectedMenu === 'procurement'
                                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Package size={15} className="text-green-500" />
                                    <span>โมดูลการจัดซื้อ (Procurement)</span>
                                </button>
                            )}

                            {/* INVENTORY MODULE */}
                            {hasModuleAccess('inventory') && (
                                <button
                                    onClick={() => setSelectedMenu('inventory')}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        selectedMenu === 'inventory'
                                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Factory size={15} className="text-amber-500" />
                                    <span>โมดูลคลังสินค้า (Inventory)</span>
                                </button>
                            )}

                            {/* IT GOVERNANCE MODULE */}
                            {hasModuleAccess('itGovernance') && (
                                <button
                                    onClick={() => setSelectedMenu('itGovernance')}
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        selectedMenu === 'itGovernance'
                                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-gray-700'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Scale size={15} className="text-purple-500" />
                                    <span>ธรรมาภิบาลไอที (IT Governance)</span>
                                </button>
                            )}
                        </div>

                        {/* MASTER DATA SEGMENT & SUB-MENUS */}
                        {hasModuleAccess('masterData') && (
                            <div className="space-y-1 pt-2 border-t border-gray-200/40 dark:border-gray-800">
                                <button 
                                    onClick={() => setIsMasterDataExpanded(!isMasterDataExpanded)}
                                    className="w-full flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider px-2 py-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                    <span>ข้อมูลหลัก (Master Data)</span>
                                    <ChevronRight size={10} className={`transition-transform duration-250 ${isMasterDataExpanded ? 'rotate-90' : ''}`} />
                                </button>

                                {isMasterDataExpanded && (
                                    <div className="space-y-1.5 pl-3 mt-1.5 border-l border-gray-200 dark:border-gray-800">
                                        
                                        {/* Company & Employee Master */}
                                        {hasMasterDataAccess('companyEmployee') && (
                                            <button
                                                onClick={() => setSelectedMenu('companyEmployee')}
                                                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                                                    selectedMenu === 'companyEmployee'
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                                        : 'text-gray-600 dark:text-gray-450 hover:bg-slate-100 dark:hover:bg-slate-850/40'
                                                }`}
                                            >
                                                <Users size={12} />
                                                <span>บริษัทและบุคลากร</span>
                                            </button>
                                        )}

                                        {/* Vendor Master */}
                                        {hasMasterDataAccess('vendor') && (
                                            <button
                                                onClick={() => setSelectedMenu('vendor')}
                                                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                                                    selectedMenu === 'vendor'
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                                        : 'text-gray-600 dark:text-gray-450 hover:bg-slate-100 dark:hover:bg-slate-850/40'
                                                }`}
                                            >
                                                <Building2 size={12} />
                                                <span>ผู้จำหน่าย (Vendor)</span>
                                            </button>
                                        )}

                                        {/* Customer Master */}
                                        {hasMasterDataAccess('customer') && (
                                            <button
                                                onClick={() => setSelectedMenu('customer')}
                                                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                                                    selectedMenu === 'customer'
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                                        : 'text-gray-600 dark:text-gray-450 hover:bg-slate-100 dark:hover:bg-slate-850/40'
                                                }`}
                                            >
                                                <Users size={12} />
                                                <span>ลูกค้า (Customer)</span>
                                            </button>
                                        )}

                                        {/* Inventory Item Master */}
                                        {hasMasterDataAccess('inventoryMaster') && (
                                            <button
                                                onClick={() => setSelectedMenu('inventoryMaster')}
                                                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                                                    selectedMenu === 'inventoryMaster'
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                                        : 'text-gray-600 dark:text-gray-450 hover:bg-slate-100 dark:hover:bg-slate-850/40'
                                                }`}
                                            >
                                                <Package size={12} />
                                                <span>สินค้าและคลังข้อมูล</span>
                                            </button>
                                        )}

                                        {/* Finance & Tax Master */}
                                        {hasMasterDataAccess('financeMaster') && (
                                            <button
                                                onClick={() => setSelectedMenu('financeMaster')}
                                                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-left transition-all ${
                                                    selectedMenu === 'financeMaster'
                                                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold'
                                                        : 'text-gray-600 dark:text-gray-450 hover:bg-slate-100 dark:hover:bg-slate-850/40'
                                                }`}
                                            >
                                                <Calculator size={12} />
                                                <span>บัญชี เงินตรา และภาษี</span>
                                            </button>
                                        )}

                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom active role details */}
                    <div className="mt-4 pt-3 border-t border-gray-200/40 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-500 space-y-1">
                        <div className="flex justify-between">
                            <span>Role Active:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeRole}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Secure Mode:</span>
                            <span className="text-emerald-500 font-bold">Enabled</span>
                        </div>
                    </div>
                </div>

                {/* 2. RIGHT WORKSPACE PANEL: Interactive simulator content (75%) */}
                <div className="flex-1 bg-white dark:bg-transparent p-6 flex flex-col justify-between space-y-6">
                    
                    {/* Welcome Sandbox Content */}
                    {selectedMenu === 'welcome' && (
                        <div className="my-auto text-center max-w-md mx-auto space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
                                <ShieldCheck size={28} />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="text-base font-bold text-gray-800 dark:text-white">พื้นที่จำลองพอร์ทัลหลัก YMD ERP</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    ยินดีต้อนรับเข้าสู่พอร์ทัลระบบจำลองสิทธิ์! ให้สังเกตที่ **แถบเมนูนำทางด้านซ้าย (Sidebar)** เมนูโมดูลและเมนูข้อมูลมาสเตอร์ต่างๆ จะซ่อนหรือแสดงโดยอัตโนมัติเมื่อเปลี่ยนบทบาท 
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-gray-800/30 border border-gray-250/30 dark:border-gray-700/40 rounded-xl text-left">
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                                    💡 <strong>ลองทดสอบ:</strong> ลองไปที่แท็บ **"สิทธิ์แบบ Matrix"** แล้วเลือกแถบย่อย **"2. สิทธิ์เข้าโมดูล"** จากนั้นปิดโมดูลของบทบาท `{activeRole}` แล้วกลับมาที่ Sandbox นี้ จะพบว่า Sidebar ด้านซ้ายอัปเดตซ่อนโมดูลดังกล่าวออกไปทันทีแบบ Real-time!
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Sales Workspace */}
                    {selectedMenu === 'sales' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <ShoppingCart className="text-rose-500" size={18} />
                                    โมดูลการขาย (Sales Order Portal)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded">Sales Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                หน้านี้ใช้สำหรับสร้างเอกสารเสนอราคา (Quotation), สั่งขาย (Sales Order) และจำลองการขายทั่วไปผ่านระบบจัดจำหน่ายสินค้า
                            </p>
                            <div className="border border-dashed border-gray-200 dark:border-gray-750 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
                                <FileText className="text-gray-300 dark:text-gray-600" size={32} />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-350">ตารางเอกสารจำลองยอดขาย</span>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs leading-normal">
                                    สิทธิ์การสร้าง บันทึก หรือยกเลิกเอกสารในหน้านี้จะผูกติดกับปุ่มทำรายการด้านบน
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Procurement Workspace */}
                    {selectedMenu === 'procurement' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Package className="text-green-500" size={18} />
                                    โมดูลการจัดซื้อ (Purchasing Portal)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded">Procurement Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                หน้านี้ใช้สำหรับจำลองการทำใบขอจัดซื้อ (PR), ใบสั่งซื้อ (PO), และอนุมัติการสั่งซื้อพัสดุและจัดหาจาก Vendor นอกระบบ
                            </p>
                            <div className="border border-dashed border-gray-200 dark:border-gray-750 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
                                <Calculator className="text-gray-300 dark:text-gray-600" size={32} />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-350">แผงจำลองประวัติใบขอซื้อพัสดุ (PR History Grid)</span>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs leading-normal">
                                    คุณจะสังเกตได้ว่าบทบาทจัดซื้อจะเปิดใช้งานหน้าจอนี้ได้ ส่วนบทบาทอื่นๆ อาจไม่ผ่านสิทธิ์การมองเห็นตั้งแต่หน้าจอนี้ในเมนูซ้าย
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Inventory Workspace */}
                    {selectedMenu === 'inventory' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Factory className="text-amber-500" size={18} />
                                    โมดูลคลังสินค้าและการวางแผน (Inventory Portal)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded">Inventory Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                สำหรับเช็คสต็อกสินค้า การย้ายคลังสินค้า จัดการ Lot No การแพ็คบรรจุ และควบคุมการแปลง UOM/หน่วยตรวจนับสต็อก
                            </p>
                            <div className="border border-dashed border-gray-200 dark:border-gray-750 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
                                <Activity className="text-gray-300 dark:text-gray-600" size={32} />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-350">ตารางจำลองตรวจนับสต็อกสินค้า (Inventory Stock Card)</span>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs leading-normal">
                                    การเข้าถึงหน้านี้จะเปิดให้เฉพาะแอดมินระบบ เจ้าหน้าที่คลัง หรือผู้มีหน้าที่คุมการผลิตเท่านั้น
                                </p>
                            </div>
                        </div>
                    )}

                    {/* IT Governance Workspace */}
                    {selectedMenu === 'itGovernance' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Scale className="text-purple-500" size={18} />
                                    ศูนย์แอดมินความมั่นคงและควบคุมระบบ (IT Governance)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded">IT Admin Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                แผงสำหรับแอดมินไอทีในการจัดการข้อมูลความมั่นคงระบบ, ตรวจเช็ค Log การเข้าใช้งาน (Audit Trail) และอนุมัติ Workflow 
                            </p>
                            <div className="border border-dashed border-gray-200 dark:border-gray-750 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 min-h-[180px]">
                                <ShieldCheck className="text-gray-300 dark:text-gray-600" size={32} />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-350">ศูนย์ควบคุมความมั่นคงไอทีจำลอง</span>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 max-w-xs leading-normal">
                                    หน้านี้จะแสดงผลเฉพาะบทบาทที่มีสิทธิ์โมดูลเป็นแอดมินหรือ `SYS_ADMIN` เท่านั้น บทบาทระดับล่างจะซ่อนไอคอนจากเมนูโดยเด็ดขาดเพื่อป้องกันช่องโหว่ทางกฎหมาย
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ----------------- MASTER DATA WORKSPACES ----------------- */}

                    {/* Company & Employee Master */}
                    {selectedMenu === 'companyEmployee' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Users className="text-indigo-500" size={18} />
                                    มาสเตอร์ข้อมูลบริษัทและพนักงาน (Company & Staff Master)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded">Master Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                หน้าจอจัดการโครงสร้างองค์กร เมนูข้อมูลสาขา ตำแหน่งงาน ฝ่ายผลิต และรายชื่อพนักงาน
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-gray-800/20 border border-gray-250/30 dark:border-gray-700/30 rounded-xl">
                                <p className="text-[11px] text-gray-550 dark:text-gray-450 leading-relaxed">
                                    แสดงข้อมูลสาขาหลัก (Branch), รายชื่อแผนกย่อยฝ่ายผลิต และบันทึกพนักงานบริษัท ข้อมูลเหล่านี้จะดึงจากมาสเตอร์หลักของ HR เพื่อแจกแจงสิทธิ์
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Vendor Master */}
                    {selectedMenu === 'vendor' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Building2 className="text-green-500" size={18} />
                                    มาสเตอร์ข้อมูลผู้จัดจำหน่าย/คู่ค้า (Vendor Master Data)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded">Master Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                ใช้สำหรับเพิ่ม ลบ แก้ไข ทะเบียนเจ้าหนี้ กลุ่มเจ้าหนี้ การให้คะแนน และการประเมินประวัติผู้ให้บริการ (Vendor Evaluation)
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-gray-800/20 border border-gray-250/30 dark:border-gray-700/30 rounded-xl">
                                <p className="text-[11px] text-gray-550 dark:text-gray-455 leading-relaxed">
                                    หน้าจอนี้จะผูกเข้ากับงานประเมินใบสั่งจัดซื้อและประเมินคุณภาพวัตถุดิบนำส่ง การเปิด-ปิดสิทธิ์ของเมนูข้อมูลผู้จัดจำหน่ายจะสัมพันธ์กับเจ้าหน้าที่จัดซื้อโดยเฉพาะ
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Customer Master */}
                    {selectedMenu === 'customer' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Users className="text-rose-500" size={18} />
                                    มาสเตอร์ข้อมูลลูกค้าและกลุ่มธุรกิจ (Customer Master Data)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded">Master Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                เมนูทะเบียนรายชื่อคู่ค้าลูกหนี้ กลุ่มประเภทธุรกิจ วงเงินอนุมัติเครดิต และแท็บเงื่อนไขเอกสารเรียกวางบิล
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-gray-800/20 border border-gray-250/30 dark:border-gray-700/30 rounded-xl">
                                <p className="text-[11px] text-gray-550 dark:text-gray-455 leading-relaxed">
                                    หน้าจอนี้จำเป็นสำหรับการจำลองสร้างเอกสารเปิดประวัติการเงินร่วมกับใบสั่งขาย ข้อมูลเครดิตเทอมของมาสเตอร์ลูกค้าจะช่วยกรองสิทธิ์การอนุมัติวงเงินของฝ่ายบริหาร
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Inventory Item Master */}
                    {selectedMenu === 'inventoryMaster' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Package className="text-amber-500" size={18} />
                                    ข้อมูลสินค้าและคลังหลัก (Product & Warehouse Master)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded">Master Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                หน้าจอตั้งค่าระดับหน่วยตรวจนับสต็อก (UOM Conversion), ลวดลายสินค้า, การแยกกลุ่ม Lot No และข้อมูลคลังจัดเก็บ
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-gray-800/20 border border-gray-250/30 dark:border-gray-700/30 rounded-xl">
                                <p className="text-[11px] text-gray-550 dark:text-gray-455 leading-relaxed">
                                    กำหนดความสัมพันธ์ของ UOM สำหรับแปลงสัดส่วนในการสั่งแพ็ควัตถุดิบและเบิกจ่าย เพื่อให้ตรงกับมาตรฐานสากลและระบบมาสเตอร์บัญชี
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Finance & Tax Master */}
                    {selectedMenu === 'financeMaster' && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-250">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Calculator className="text-indigo-500" size={18} />
                                    ข้อมูลอัตราแลกเปลี่ยนและภาษี (Finance & Currency Master)
                                </h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded">Master Access OK</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                จัดการเกี่ยวกับอัตราแลกเปลี่ยนเงินตราต่างประเทศ สกุลเงินที่เปิดใช้งาน กลุ่มรหัสภาษี VAT/WHT และการตั้งค่าอัตราส่วนทางการเงิน
                            </p>
                            <div className="p-4 bg-slate-50 dark:bg-gray-800/20 border border-gray-250/30 dark:border-gray-700/30 rounded-xl">
                                <p className="text-[11px] text-gray-550 dark:text-gray-455 leading-relaxed">
                                    การแก้ไขมาสเตอร์ภาษีและอัตราแลกเปลี่ยนจะเปิดสิทธิ์เฉพาะเจ้าหน้าที่บัญชี GL แอดมินระบบ หรือฝ่ายการเงินเท่านั้น เพื่อป้องกันข้อผิดพลาดในการคำนวณกำไรขาดทุนสะสม
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Common simulated alert at the bottom of panel */}
                    <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-750/70 text-left">
                        <ShieldAlert className="text-indigo-600 dark:text-indigo-400 shrink-0" size={16} />
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium">
                            <strong>ความมั่นคงปลอดภัยสูงสุด (IT Governance Framework):</strong> ระบบกำลังทดสอบสวมบทบาท (Simulated Impersonation) และซิงค์ผลเข้ากับ Storage บนเว็บบราวเซอร์ของคุณ การตั้งค่าเหล่านี้จะไม่มีผลกระทบต่อสิทธิ์ของบทบาทจริงในระบบ Database จริง
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
};
