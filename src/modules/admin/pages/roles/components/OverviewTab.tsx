import React from 'react';
import {
    Users,
    Settings,
    CheckCircle,
    Shield
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';

interface OverviewTabProps {
    rolesData: Array<{
        id: string;
        name: string;
        description: string;
        perms: number;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        bgColor: string;
        borderColor: string;
        iconBg: string;
        darkBg: string;
        darkBorder: string;
        darkIconBg: string;
        iconColor: string;
        permissions: string[];
    }>;
    permissionActions: Array<{
        id: string;
        label: string;
        description: string;
        icon: React.ComponentType<{ size?: number; className?: string }>;
        color: string;
    }>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ rolesData, permissionActions }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* ==================== STATS CARDS ==================== */}
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
                        <div className="text-3xl font-bold text-gray-800 dark:text-white">{rolesData.length}</div>
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
                        <div className="text-3xl font-bold text-gray-800 dark:text-white">{permissionActions.length}</div>
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
            <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                    <Settings size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Permission Actions (มาตรฐาน)</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {permissionActions.map((action) => {
                        const IconComponent = action.icon;
                        return (
                            <div key={action.id} className={`${action.color} dark:bg-opacity-20 rounded-lg p-4 flex items-center space-x-3`}>
                                <IconComponent size={20} />
                                <div>
                                    <div className="font-bold text-sm">{action.label}</div>
                                    <div className="text-xs opacity-80">{action.description}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ==================== ROLES GRID ==================== */}
            <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                    <Users size={20} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Roles (บทบาทผู้ใช้งาน)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rolesData.map((role) => {
                        const IconComponent = role.icon;
                        return (
                            <div key={role.id} className={`${role.bgColor} ${role.darkBg} ${role.borderColor} ${role.darkBorder} border rounded-xl p-4 transition-all hover:scale-[1.02]`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 ${role.iconBg} ${role.darkIconBg} rounded-lg flex items-center justify-center`}>
                                        <IconComponent size={20} className={`${role.iconColor} dark:opacity-90`} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">{role.perms} perms</span>
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-1">{role.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{role.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.map((perm) => (
                                        <span key={perm} className="text-xs font-medium bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-200 px-2 py-0.5 rounded">
                                            {perm}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ==================== SECURITY FEATURES & BEST PRACTICES ==================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Features */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-2 mb-4">
                        <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Security Features</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                            <span>Role-Based Access Control (RBAC)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                            <span>Maker-Checker Approval Workflow</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                            <span>Audit Trail & Activity Logging</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                            <span>Segregation of Duties (SoD)</span>
                        </div>
                    </div>
                </div>

                {/* Best Practices */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2 mb-4">
                        <Settings size={20} className="text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Best Practices</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                            <span>Principle of Least Privilege</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                            <span>Regular Permission Reviews</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                            <span>Document All Permission Changes</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                            <span>IPO & SOX Compliance Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
