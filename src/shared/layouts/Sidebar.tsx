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

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    ChevronDown,
} from 'lucide-react';
import { sidebarMenuItems } from '@/core/config/navigation.config';
import type { MenuItem, SubMenuItem } from '@/core/config/navigation.config';

// ====================================================================================
// COMPONENT - Sidebar
// ====================================================================================

interface SidebarProps {
    isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
    // ใช้ useLocation เพื่อตรวจสอบ active menu
    const location = useLocation();

    // State เก็บรายการเมนูที่กำลังเปิดอยู่ (expanded)
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    /**
     * Toggle การเปิด/ปิดเมนูย่อย
     * @param menuId - รหัสเมนูที่ต้องการ toggle
     */
    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)  // ถ้าเปิดอยู่ -> ปิด
                : [...prev, menuId]                  // ถ้าปิดอยู่ -> เปิด
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
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                            {/* Icon (Only for Top Level) */}
                            {item.icon && (
                                <div className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
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
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-3 border-blue-600'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                           {item.icon && (
                                <div className={`flex-shrink-0 ${isCurrentPage ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
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
                bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col 
                transition-all duration-300 ease-in-out group overflow-hidden
                ${isOpen ? (isMasterDataInventoryExpanded ? 'w-[300px]' : 'w-[280px]') : 'w-0'}
            `}
        >

            {/* ==================== HEADER (Logo & Brand) ==================== */}
            <div className="bg-blue-600 text-white p-4 flex items-center space-x-3 flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-sm text-blue-600 flex-shrink-0">
                    YMD
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">YMD Tech Care</div>
                    <div className="text-xs text-blue-50 whitespace-nowrap truncate">ERP System v1.0</div>
                </div>
            </div>

            {/* ==================== MENU ITEMS ==================== */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {sidebarMenuItems.map((item) => renderMenuItem(item, 0))}
            </div>

            {/* ==================== USER PROFILE SECTION ==================== */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center space-x-2 flex-shrink-0">
                {/* Avatar */}
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    A
                </div>
                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-800 dark:text-white truncate">Admin User</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@company.com</div>
                </div>
            </div>
        </div>
    );
}
