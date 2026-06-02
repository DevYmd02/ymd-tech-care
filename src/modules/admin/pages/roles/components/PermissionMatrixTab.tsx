import React, { useState, useEffect } from 'react';
import { Check, X, Shield, Save, RefreshCw, Search, Info, LayoutGrid, Database, Key } from 'lucide-react';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { usePermission } from '@/core/auth/contexts/PermissionContext';
import type { RolePermissionRow, ModuleAccessRow, MasterDataAccessRow } from '@/core/auth/contexts/PermissionContext';
import {
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
    Scale
} from 'lucide-react';

const roleIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    SYS_ADMIN: Zap,
    CFO: Building2,
    FIN_MANAGER: Calculator,
    AP_OFFICER: CreditCard,
    AR_OFFICER: Coins,
    GL_ACCOUNTANT: BookOpen,
    CASHIER: Landmark,
    PROCUREMENT_OFFICER: Package,
    WAREHOUSE_OFFICER: Package,
    PRODUCTION_PLANNER: Factory,
    SALES_OFFICER: ShoppingCart,
    TAX_COMPLIANCE: Scale,
    INTERNAL_AUDITOR: Search,
};

export const PermissionMatrixTab: React.FC = () => {
    const { toast } = useToast();
    const { 
        permissionMatrix, 
        moduleAccessMatrix, 
        masterDataAccessMatrix, 
        savePermissions, 
        saveModulePermissions, 
        saveMasterDataPermissions, 
        resetPermissions 
    } = usePermission();
    
    // Segmented tab state
    const [subTab, setSubTab] = useState<'actions' | 'modules' | 'masterData'>('actions');

    // Local state for each matrix
    const [actionsMatrix, setActionsMatrix] = useState<RolePermissionRow[]>(permissionMatrix);
    const [modulesMatrix, setModulesMatrix] = useState<ModuleAccessRow[]>(moduleAccessMatrix);
    const [masterDataMatrix, setMasterDataMatrix] = useState<MasterDataAccessRow[]>(masterDataAccessMatrix);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Sync local states when context updates (e.g., on mount or global reset)
    useEffect(() => {
        setActionsMatrix(permissionMatrix);
        setModulesMatrix(moduleAccessMatrix);
        setMasterDataMatrix(masterDataAccessMatrix);
        setHasUnsavedChanges(false);
    }, [permissionMatrix, moduleAccessMatrix, masterDataAccessMatrix]);

    // ====================================================================================
    // SEARCH FILTERING
    // ====================================================================================
    
    const filteredActions = actionsMatrix.filter((row) =>
        row.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredModules = modulesMatrix.filter((row) =>
        row.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMasterData = masterDataMatrix.filter((row) =>
        row.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ====================================================================================
    // INTERACTIVE CHECKBOX TOGGLERS
    // ====================================================================================

    const handleActionToggle = (roleName: string, field: keyof Omit<RolePermissionRow, 'role'>) => {
        setActionsMatrix((prev) =>
            prev.map((row) => (row.role === roleName ? { ...row, [field]: !row[field] } : row))
        );
        setHasUnsavedChanges(true);
    };

    const handleModuleToggle = (roleName: string, field: keyof Omit<ModuleAccessRow, 'role'>) => {
        setModulesMatrix((prev) =>
            prev.map((row) => (row.role === roleName ? { ...row, [field]: !row[field] } : row))
        );
        setHasUnsavedChanges(true);
    };

    const handleMasterDataToggle = (roleName: string, field: keyof Omit<MasterDataAccessRow, 'role'>) => {
        setMasterDataMatrix((prev) =>
            prev.map((row) => (row.role === roleName ? { ...row, [field]: !row[field] } : row))
        );
        setHasUnsavedChanges(true);
    };

    // ====================================================================================
    // SAVE & RESET TRIGGERED OPERATIONS
    // ====================================================================================

    const handleSaveChanges = () => {
        setIsSaving(true);
        setTimeout(() => {
            if (subTab === 'actions') {
                savePermissions(actionsMatrix);
                toast('บันทึกสิทธิ์การทำรายการสำเร็จ (Action-Level Matrix Synced)', 'success');
            } else if (subTab === 'modules') {
                saveModulePermissions(modulesMatrix);
                toast('บันทึกสิทธิ์การเข้าถึงโมดูลสำเร็จ (Module-Level Matrix Synced)', 'success');
            } else if (subTab === 'masterData') {
                saveMasterDataPermissions(masterDataMatrix);
                toast('บันทึกสิทธิ์ข้อมูลหลักย่อยสำเร็จ (Master Data Matrix Synced)', 'success');
            }
            setIsSaving(false);
            setHasUnsavedChanges(false);
        }, 1200);
    };

    const handleReset = () => {
        resetPermissions();
        setHasUnsavedChanges(false);
        toast('รีเซ็ตข้อมูลสิทธิ์ระบบทั้งหมดเป็นค่าเริ่มต้นสำเร็จ', 'info');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            
            {/* Syncing Overlay when saving state to Mock backend */}
            {isSaving && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 rounded-2xl flex flex-col items-center justify-center text-white space-y-4">
                    <RefreshCw className="animate-spin text-indigo-400" size={48} />
                    <p className="font-semibold text-lg animate-pulse">กำลังอัปเดตสิทธิ์ระบบและซิงค์ฐานข้อมูล...</p>
                </div>
            )}

            {/* Matrix Header Banner */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
                        กำหนดสิทธิ์แบบ Matrix (Interactive Grid)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        เลือกสลับสวิตช์เพื่อปรับแต่งสิทธิ์แบบละเอียดตามนโยบายควบคุมความปลอดภัยระบบไอที (Segregation of Duties)
                    </p>
                </div>
                
                {/* Custom search filter */}
                <div className="relative w-full xl:w-72 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาตามชื่อบทบาท (Role)..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-655 rounded-xl bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-800 dark:text-white"
                    />
                </div>
            </div>

            {/* ==================== SUB-TAB SEGMENTED SELECTOR ==================== */}
            <div className="flex p-1 bg-gray-150/40 dark:bg-gray-800/20 border border-gray-200/60 dark:border-gray-750/80 rounded-2xl max-w-2xl shadow-inner gap-1">
                <button
                    onClick={() => { setSubTab('actions'); setSearchQuery(''); }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        subTab === 'actions'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md border border-gray-100 dark:border-gray-600'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Key size={14} />
                    1. สิทธิ์การทำรายการ (Action-Level)
                </button>
                <button
                    onClick={() => { setSubTab('modules'); setSearchQuery(''); }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        subTab === 'modules'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md border border-gray-100 dark:border-gray-600'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <LayoutGrid size={14} />
                    2. สิทธิ์เข้าโมดูล (Module-Level)
                </button>
                <button
                    onClick={() => { setSubTab('masterData'); setSearchQuery(''); }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        subTab === 'masterData'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md border border-gray-100 dark:border-gray-600'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Database size={14} />
                    3. สิทธิ์มาสเตอร์ (Master Data)
                </button>
            </div>

            {/* ==================== 1. ACTIONS MATRIX ==================== */}
            {subTab === 'actions' && (
                <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto animate-in slide-in-from-left duration-200">
                    <table className="w-full min-w-[950px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                                <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300 w-64">Role</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">VIEW</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">CREATE</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">EDIT</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">APPROVE</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">POST</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">VOID</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">EXPORT</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-24">ADMIN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredActions.map((row, index) => {
                                const IconComponent = roleIconMap[row.role] || Shield;
                                return (
                                    <tr 
                                        key={row.role} 
                                        className={`transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-700/20 ${
                                            index % 2 === 0 ? 'bg-gray-50/10 dark:bg-transparent' : 'bg-white dark:bg-transparent'
                                        }`}
                                    >
                                        <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-200">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                    <IconComponent size={16} />
                                                </div>
                                                <span className="text-sm font-bold">{row.role}</span>
                                            </div>
                                        </td>
                                        {(['view', 'create', 'edit', 'approve', 'post', 'void', 'export', 'admin'] as Array<keyof Omit<RolePermissionRow, 'role'>>).map((field) => {
                                            const isChecked = !!row[field];
                                            return (
                                                <td key={field} className="text-center py-4 px-2">
                                                    <button
                                                        onClick={() => handleActionToggle(row.role, field)}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all ${
                                                            isChecked 
                                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 shadow-sm shadow-emerald-500/5' 
                                                                : 'bg-gray-100 hover:bg-gray-200/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 border border-transparent text-gray-400 dark:text-gray-600'
                                                        }`}
                                                    >
                                                        {isChecked ? <Check size={18} className="stroke-[3]" /> : <X size={14} className="stroke-[2.5]" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ==================== 2. MODULES MATRIX ==================== */}
            {subTab === 'modules' && (
                <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto animate-in slide-in-from-left duration-200">
                    <table className="w-full min-w-[950px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                                <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300 w-64">Role</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">ฝ่ายขาย (Sales)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">จัดซื้อ (Procurement)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">คลังสินค้า (Inventory)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">ไอทีแอดมิน (Governance)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">ข้อมูลหลัก (Master Data)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredModules.map((row, index) => {
                                const IconComponent = roleIconMap[row.role] || Shield;
                                return (
                                    <tr 
                                        key={row.role} 
                                        className={`transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-700/20 ${
                                            index % 2 === 0 ? 'bg-gray-50/10 dark:bg-transparent' : 'bg-white dark:bg-transparent'
                                        }`}
                                    >
                                        <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-200">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                    <IconComponent size={16} />
                                                </div>
                                                <span className="text-sm font-bold">{row.role}</span>
                                            </div>
                                        </td>
                                        {(['sales', 'procurement', 'inventory', 'itGovernance', 'masterData'] as Array<keyof Omit<ModuleAccessRow, 'role'>>).map((field) => {
                                            const isChecked = !!row[field];
                                            return (
                                                <td key={field} className="text-center py-4 px-2">
                                                    <button
                                                        onClick={() => handleModuleToggle(row.role, field)}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all ${
                                                            isChecked 
                                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 shadow-sm' 
                                                                : 'bg-gray-100 hover:bg-gray-200/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 border border-transparent text-gray-400 dark:text-gray-600'
                                                        }`}
                                                    >
                                                        {isChecked ? <Check size={18} className="stroke-[3]" /> : <X size={14} className="stroke-[2.5]" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ==================== 3. MASTER DATA MATRIX ==================== */}
            {subTab === 'masterData' && (
                <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto animate-in slide-in-from-left duration-200">
                    <table className="w-full min-w-[950px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                                <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300 w-64">Role</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">บริษัท/พนักงาน (Company/Staff)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">คู่ค้า/ผู้ขาย (Vendor Master)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">ลูกค้า (Customer Master)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">สินค้า/คลัง (Inventory Master)</th>
                                <th className="text-center py-4 px-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider w-36">บัญชี/ภาษี/เงินตรา (Finance Master)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredMasterData.map((row, index) => {
                                const IconComponent = roleIconMap[row.role] || Shield;
                                return (
                                    <tr 
                                        key={row.role} 
                                        className={`transition-colors hover:bg-slate-50/40 dark:hover:bg-slate-700/20 ${
                                            index % 2 === 0 ? 'bg-gray-50/10 dark:bg-transparent' : 'bg-white dark:bg-transparent'
                                        }`}
                                    >
                                        <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-200">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                    <IconComponent size={16} />
                                                </div>
                                                <span className="text-sm font-bold">{row.role}</span>
                                            </div>
                                        </td>
                                        {(['companyEmployee', 'vendor', 'customer', 'inventoryMaster', 'financeMaster'] as Array<keyof Omit<MasterDataAccessRow, 'role'>>).map((field) => {
                                            const isChecked = !!row[field];
                                            return (
                                                <td key={field} className="text-center py-4 px-2">
                                                    <button
                                                        onClick={() => handleMasterDataToggle(row.role, field)}
                                                        className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all ${
                                                            isChecked 
                                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 shadow-sm' 
                                                                : 'bg-gray-100 hover:bg-gray-200/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 border border-transparent text-gray-400 dark:text-gray-600'
                                                        }`}
                                                    >
                                                        {isChecked ? <Check size={18} className="stroke-[3]" /> : <X size={14} className="stroke-[2.5]" />}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info and Tips */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                <Info className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <strong>คำแนะนำความมั่นคงปลอดภัย:</strong> การปิดสิทธิ์การเข้าถึงโมดูล (Module-Level) หรือเมนูย่อยของข้อมูลหลัก (Master Data Sub-menus) จะส่งผลให้ระบบซ่อนเมนูดังกล่าวในแถบ Sidebar ด้านซ้ายและปิดกั้นการพิมพ์ URL ตรงทันทีสำหรับผู้ใช้ที่ปฏิบัติงานด้วยบทบาทนั้น เพื่อให้เป็นไปตามแนวทางความปลอดภัยสูงสุดและ Maker-Checker Flow
                </p>
            </div>

            {/* Unsaved changes float bar */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700/50 animate-in slide-in-from-bottom duration-300 z-40">
                    <div className="text-sm font-medium text-slate-300">
                        คุณมีการเปลี่ยนแปลงการตั้งค่าที่ยังไม่ได้บันทึก
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            <Save size={14} />
                            บันทึกการกำหนดสิทธิ์
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
