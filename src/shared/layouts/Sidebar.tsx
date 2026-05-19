/**
 * @file Sidebar.tsx
 * @description Sidebar หลักของระบบ ERP แสดงเมนูนำทางทั้งหมด
 * @features
 * - Collapsible submenus (เมนูย่อยเปิด/ปิดได้)
 * - Hover expand (ขยายความกว้างเมื่อ hover)
 * - Active state highlighting
 * - User profile section
 * @refactored ใช้ menu configuration จาก routes.ts
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
    // ใช้ useLocation เพื่อตรวจสอบ active menu
    const location = useLocation();
    const { user, logout } = useAuth();
    const { confirm } = useConfirmation();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();

    // State เก็บรายการเมนูที่กำลังเปิดอยู่ (expanded)
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close profile dropdown when clicking outside
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

    /**
     * Handle "Coming Soon" features
     */
    const handleComingSoon = (featureName: string) => {
        toast(
            `ฟีเจอร์ "${featureName}" กำลังอยู่ระหว่างการพัฒนา จะเปิดให้ใช้งานเร็วๆ นี้`,
            'info',
            'Coming Soon'
        );
        setIsProfileOpen(false);
    };

    /**
     * Toggle การเปิด/ปิดเมนูย่อย
     * @param menuId - รหัสเมนูที่ต้องการ toggle
     */
    const toggleMenu = (menuId: string) => {
        setExpandedMenus((prev: string[]) =>
            prev.includes(menuId)
                ? prev.filter((id: string) => id !== menuId)  // ถ้าเปิดอยู่ -> ปิด
                : [...prev, menuId]                          // ถ้าปิดอยู่ -> เปิด
        );
    };

    /**
     * Check if any child is active (Recursive)
     */
    const isChildActive = (item: MenuItem | SubMenuItem): boolean => {
        if (item.path === location.pathname) return true;
        if (item.subItems && item.subItems.length > 0) {
            return item.subItems.some(sub => isChildActive(sub));
        }
        return false;
    };

    /**
     * Render Menu Item (Recursive)
     */
    /**
     * Render Menu Item (Recursive)
     */
    const renderMenuItem = (item: MenuItem | SubMenuItem, depth: number = 0) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isExpanded = expandedMenus.includes(item.id);
        const isActive = isChildActive(item);
        const isCurrentPage = item.path === location.pathname;
        
        // Parse Label for Badges
        const isComingSoon = item.label.includes('(Coming Soon)');
        const displayLabel = item.label.replace('(Coming Soon)', '').trim();

        return (
            <div key={item.id} className="mb-0.5">
                {/* ---------- MENU HEADER ---------- */}
                {hasSubItems ? (
                    // Menu with Subitems
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(item.id);
                        }}
                        title={item.label}
                        className={`
                            w-full flex items-center justify-between ${depth > 0 ? 'py-1.5 px-3 text-xs font-normal' : 'py-2.5 px-4 text-xs font-medium'} cursor-pointer transition-colors select-none
                            ${isActive
                                ? 'text-[#0055A4] dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            {/* Icon (Only for Top Level) */}
                            {item.icon && (
                                <div className={`flex-shrink-0 ${isActive ? 'text-[#0055A4] dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                    <item.icon size={18} />
                                </div>
                            )}
                            
                            <span className="truncate flex-1 leading-snug">{displayLabel}</span>
                            {isComingSoon && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                                    SOON
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            size={14}
                            className={`flex-shrink-0 text-gray-400 dark:text-gray-300 transition-transform duration-200 ml-1 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                        />
                    </div>
                ) : (
                    // Leaf Node (Link)
                    <Link
                        to={item.path || '#'}
                        title={item.label}
                        className={`
                            flex items-center justify-between ${depth > 0 ? 'py-1.5 px-3 text-xs font-normal' : 'py-2.5 px-4 text-xs font-medium'} cursor-pointer transition-colors
                            ${isCurrentPage
                                ? 'bg-blue-50 dark:bg-blue-950/20 text-[#0055A4] dark:text-blue-400 border-r-3 border-[#0055A4] dark:border-blue-500'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                           {item.icon && (
                                <div className={`flex-shrink-0 ${isCurrentPage ? 'text-[#0055A4] dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                    <item.icon size={18} />
                                </div>
                            )}
                            <span className="truncate flex-1 leading-snug">{displayLabel}</span>
                            {isComingSoon && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
                                    SOON
                                </span>
                            )}
                        </div>
                    </Link>
                )}

                {/* ---------- SUBMENU ITEMS (Recursive) ---------- */}
                {hasSubItems && (
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                         {/* Tree View Line: Left Border + Margin */}
                        <div className="ml-6 border-l border-gray-300 dark:border-gray-600 my-1 pl-1"> 
                            {item.subItems?.map((subItem) => renderMenuItem(subItem, depth + 1))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Check for specific expanded menu to adjust width
    // Ensure parent 'master-data' is also expanded to avoid wide sidebar when submenu is hidden
    const isMasterDataInventoryExpanded = expandedMenus.includes('master-data-inventory') && expandedMenus.includes('master-data');

    return (
        // Sidebar Container - Controlled by isOpen prop
        <div 
            className={`
                bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col 
                transition-all duration-300 ease-in-out group overflow-hidden
                ${isOpen ? (isMasterDataInventoryExpanded ? 'w-[300px]' : 'w-[280px]') : 'w-0'}
            `}
        >

            {/* ==================== HEADER (Logo & Brand) ==================== */}
            <div className="relative group/header overflow-hidden flex-shrink-0">
                {/* Premium Corporate Blue Gradient Mesh Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0055A4] to-blue-700 dark:from-[#0b0f19] dark:to-[#111827]" />
                <div className="absolute inset-0 bg-white/5 dark:bg-transparent backdrop-blur-[1px]" />
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.12)_0%,_transparent_50%)] animate-[spin_15s_linear_infinite] opacity-60 dark:opacity-40" />

                <div className={`relative p-5 border-b backdrop-blur-sm transition-colors duration-500 ${theme === 'dark' ? 'border-gray-800/50' : 'border-blue-100/20 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}>
                    <Logo size="md" />
                </div>
                
                {/* glowing underline */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0055A4] to-transparent opacity-50 group-hover/header:via-blue-400 group-hover/header:scale-x-110 transition-all duration-500" />
            </div>

            {/* ==================== MENU ITEMS ==================== */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {sidebarMenuItems.map((item) => renderMenuItem(item, 0))}
            </div>

            {/* ==================== USER PROFILE SECTION ==================== */}
            <div className="p-4 relative mt-auto border-t border-gray-200 dark:border-gray-800" ref={profileRef}>
                {/* Profile Floating Dropdown Menu */}
                <div className={`
                    absolute bottom-[calc(100%_+_12px)] left-4 right-4 mb-1 bg-white/95 dark:bg-[#1f2937]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 origin-bottom
                    ${isProfileOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2 pointer-events-none'}
                `}>
                    <div className="p-2 space-y-1">
                        <button 
                            onClick={() => handleComingSoon('โปรไฟล์ของฉัน')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-blue-100/70 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 rounded-lg group-hover/btn:scale-105 transition-transform">
                                <User size={14} />
                            </div>
                            <span>โปรไฟล์ของฉัน</span>
                        </button>
                        
                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />
                        
                        <button 
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg group-hover/btn:rotate-12 transition-transform">
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                            </div>
                            <span>โหมด{theme === 'dark' ? 'สว่าง' : 'มืด'}</span>
                            <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">{theme}</span>
                        </button>

                        <button 
                            onClick={() => handleComingSoon('ตั้งค่าการใช้งาน')}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 group/btn"
                        >
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
                                <Settings size={14} />
                            </div>
                            <span>ตั้งค่าการใช้งาน</span>
                        </button>

                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2" />

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
                            ? 'bg-white dark:bg-[#1f2937] border-blue-200 dark:border-blue-900/50 shadow-lg shadow-blue-500/5' 
                            : 'bg-white/80 dark:bg-[#111827]/55 border-gray-200 dark:border-gray-800/80 hover:bg-white dark:hover:bg-[#1f2937] hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
                        }
                    `}
                >
                    {/* Avatar with Online indicator */}
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 bg-gradient-to-tr from-[#0055A4] to-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10 ring-2 ring-white dark:ring-gray-800 overflow-hidden">
                            <User size={18} strokeWidth={2.5} />
                        </div>
                        {/* Green pulse dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm flex items-center justify-center">
                            <span className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
                        </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-[11px] font-bold text-gray-800 dark:text-gray-100 truncate flex items-center gap-1">
                            {user?.employee?.employee_fullname || 'Admin User'}
                        </div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 truncate font-semibold">
                            {user?.username || 'admin'}
                        </div>
                    </div>
                    <div className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-500' : ''}`}>
                        <ChevronDown size={14} />
                    </div>
                </button>
        </div>
    );
}
