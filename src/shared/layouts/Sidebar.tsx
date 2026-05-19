/**
 * @file Sidebar.tsx
 * @description Sidebar หลักของระบบ ERP แสดงเมนูนำทางทั้งหมด (สไตล์ Modern Premium Glassmorphism)
 * @features
 * - Glassmorphism & Adaptive Theme (ทั้งในโหมดสว่างและมืด)
 * - Floating Pill-shaped Menu Items (เมนูลอยขอบมนสุดหรูหรา)
 * - Collapsible submenus พร้อมเส้นโยงระดับโครงสร้างแบบบางเฉียบ
 * - Interactive User Profile Card พร้อมสถานะ Online Pulse
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronDown,
    LogOut,
    User,
    Settings,
    Moon,
    Sun,
    Sparkles,
} from 'lucide-react';
import { sidebarMenuItems } from '@/core/config/navigation.config';
import type { MenuItem, SubMenuItem } from '@/core/config/navigation.config';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { useTheme } from '@/core/contexts/ThemeContext';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { Logo } from '@/shared/components/ui/branding/Logo';

// ====================================================================================
// COMPONENT - Sidebar
// ====================================================================================

interface SidebarProps {
    isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { confirm } = useConfirmation();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();

    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // ปิดเมนูโปรไฟล์เมื่อคลิกภายนอก
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsProfileOpen(false);
        const isConfirmed = await confirm({
            title: 'ต้องการออกจากระบบหรือไม่?',
            description: 'เซสชันของคุณจะสิ้นสุดลง และต้องลงชื่อเข้าใช้ใหม่อีกครั้งเพื่อใช้งานต่อ',
            confirmText: 'ออกจากระบบ',
            cancelText: 'ยกเลิก',
            variant: 'danger',
            icon: LogOut
        });

        if (isConfirmed) {
            logout();
        }
    };

    const handleComingSoon = (featureName: string) => {
        toast(
            `ฟีเจอร์ "${featureName}" กำลังอยู่ระหว่างการพัฒนา จะเปิดให้ใช้งานเร็วๆ นี้`,
            'info',
            'Coming Soon'
        );
        setIsProfileOpen(false);
    };

    const toggleMenu = (menuId: string) => {
        setExpandedMenus((prev: string[]) =>
            prev.includes(menuId)
                ? prev.filter((id: string) => id !== menuId)
                : [...prev, menuId]
        );
    };

    const isChildActive = (item: MenuItem | SubMenuItem): boolean => {
        if (item.path === location.pathname) return true;
        if (item.subItems && item.subItems.length > 0) {
            return item.subItems.some(sub => isChildActive(sub));
        }
        return false;
    };

    /**
     * Render Menu Item (Recursive) ด้วยสไตล์ Modern Floating Pill
     */
    const renderMenuItem = (item: MenuItem | SubMenuItem, depth: number = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedMenus.includes(item.id);
        const isActive = isChildActive(item);
        const isCurrentPage = item.path === location.pathname;
        
        const isComingSoon = item.label.includes('(Coming Soon)');
        const displayLabel = item.label.replace('(Coming Soon)', '').trim();

        // 1. เมนูระดับบนที่มีเมนูย่อย (Subitems Parent)
        if (hasSubItems) {
            return (
                <div key={item.id} className="mb-1 mx-3">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(item.id);
                        }}
                        title={item.label}
                        className={`
                            w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium cursor-pointer 
                            transition-all duration-300 select-none group/item
                            ${isActive
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold shadow-[inset_0_0_12px_rgba(99,102,241,0.03)]'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:translate-x-1'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1 overflow-hidden">
                            {item.icon && (
                                <div className={`flex-shrink-0 transition-transform duration-300 group-hover/item:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400'}`}>
                                    <item.icon size={18} />
                                </div>
                            )}
                            <span className="truncate flex-1 leading-snug">{displayLabel}</span>
                        </div>
                        <ChevronDown
                            size={14}
                            className={`flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-300 ml-1 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                        />
                    </div>

                    {/* กล่องแสดงผลเมนูย่อย พร้อมเส้นโยงแนวตั้งบางเฉียบ */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="ml-5 border-l border-slate-200/80 dark:border-slate-800/80 pl-2 space-y-1 py-0.5">
                            {item.subItems?.map((subItem) => renderMenuItem(subItem, depth + 1))}
                        </div>
                    </div>
                </div>
            );
        }

        // 2. เมนูย่อย หรือใบไม้ในโครงสร้าง (Leaf nodes)
        return (
            <div key={item.id} className={`${depth === 0 ? 'mx-3 mb-1' : 'mb-0.5'}`}>
                <Link
                    to={item.path || '#'}
                    title={item.label}
                    className={`
                        flex items-center justify-between rounded-xl transition-all duration-300 group/link
                        ${depth > 0 
                            ? 'py-2 px-3 text-[11px] font-normal' 
                            : 'py-2.5 px-3.5 text-xs font-medium'
                        }
                        ${isCurrentPage
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-[0_4px_14px_rgba(99,102,241,0.22)]'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                        }
                    `}
                >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 overflow-hidden">
                        {item.icon && (
                            <div className={`flex-shrink-0 transition-transform duration-300 group-hover/link:scale-110 ${isCurrentPage ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`}>
                                <item.icon size={18} />
                            </div>
                        )}
                        <span className="truncate flex-1 leading-snug">{displayLabel}</span>
                        {isComingSoon && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[8px] font-medium bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
                                SOON
                            </span>
                        )}
                    </div>
                </Link>
            </div>
        );
    };

    const isMasterDataInventoryExpanded = expandedMenus.includes('master-data-inventory') && expandedMenus.includes('master-data');

    return (
        <div 
            className={`
                bg-slate-50/95 dark:bg-slate-950/95 border-r border-slate-200/80 dark:border-slate-800/80 h-screen flex flex-col 
                transition-all duration-300 ease-in-out group overflow-hidden shadow-sm dark:shadow-2xl z-20 backdrop-blur-xl
                ${isOpen ? (isMasterDataInventoryExpanded ? 'w-[300px]' : 'w-[280px]') : 'w-0'}
            `}
        >
            {/* ==================== HEADER (Logo & Brand) ==================== */}
            <div className="relative group/header overflow-hidden flex-shrink-0">
                {/* Premium Gradient Mesh Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-950 dark:to-slate-900" />
                <div className="absolute inset-0 bg-white/10 dark:bg-transparent backdrop-blur-[1px]" />
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18)_0%,_transparent_50%)] animate-[spin_15s_linear_infinite] opacity-60 dark:opacity-40" />

                <div className={`relative p-5 border-b backdrop-blur-sm transition-colors duration-500 ${theme === 'dark' ? 'border-slate-800/50' : 'border-indigo-100/30 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}>
                    <Logo size="md" />
                </div>
                
                {/* glowing underline */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 group-hover/header:via-indigo-400 group-hover/header:scale-x-110 transition-all duration-500" />
            </div>

            {/* ==================== MENU ITEMS ==================== */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
                {sidebarMenuItems.map((item) => renderMenuItem(item, 0))}
            </div>

            {/* ==================== USER PROFILE SECTION ==================== */}
            <div className="p-4 relative mt-auto border-t border-slate-200/60 dark:border-slate-800/60" ref={profileRef}>
                {/* Profile Floating Dropdown Menu */}
                <div className={`
                    absolute bottom-[calc(100%_+_12px)] left-4 right-4 mb-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-all duration-300 origin-bottom
                    ${isProfileOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2 pointer-events-none'}
                `}>
                    <div className="p-2 space-y-1">
                        <button 
                            onClick={() => handleComingSoon('โปรไฟล์ของฉัน')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-blue-100/70 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 rounded-lg group-hover/btn:scale-105 transition-transform">
                                <User size={14} />
                            </div>
                            <span>โปรไฟล์ของฉัน</span>
                        </button>
                        
                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                        
                        <button 
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-amber-100/70 dark:bg-amber-900/35 text-amber-600 dark:text-amber-400 rounded-lg group-hover/btn:rotate-12 transition-transform">
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                            </div>
                            <span>โหมด{theme === 'dark' ? 'สว่าง' : 'มืด'}</span>
                            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">{theme}</span>
                        </button>

                        <button 
                            onClick={() => handleComingSoon('ตั้งค่าการใช้งาน')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                                <Settings size={14} />
                            </div>
                            <span>ตั้งค่าการใช้งาน</span>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-red-100/70 dark:bg-red-900/35 text-red-600 rounded-lg group-hover/btn:translate-x-1 transition-transform">
                                <LogOut size={14} />
                            </div>
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>
                </div>

                {/* Profile Toggle Card - Floating UI */}
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`
                        w-full flex items-center space-x-3 p-2.5 rounded-2xl transition-all duration-300 border
                        ${isProfileOpen 
                            ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 shadow-lg shadow-indigo-500/5' 
                            : 'bg-white/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300/80 dark:hover:border-slate-700/80 shadow-sm'
                        }
                    `}
                >
                    {/* Avatar with Online indicator */}
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/10 ring-2 ring-white dark:ring-slate-800 overflow-hidden">
                            <User size={18} strokeWidth={2.5} />
                        </div>
                        {/* Green pulse dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                            <span className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
                        </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                            {user?.employee?.employee_fullname || 'Admin User'}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate font-semibold">
                            {user?.username || 'admin'}
                        </div>
                    </div>
                    <div className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-indigo-500' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </button>
            </div>
        </div>
    );
}
