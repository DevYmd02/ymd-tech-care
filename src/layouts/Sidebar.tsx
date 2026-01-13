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
import { ChevronRight, ChevronDown } from 'lucide-react';
import { sidebarMenuItems } from '../config/routes';
import type { MenuItem, SubMenuItem } from '../config/routes';

// ====================================================================================
// COMPONENT - Sidebar
// ====================================================================================

export default function Sidebar() {
    // ใช้ useLocation เพื่อตรวจสอบ active menu
    const location = useLocation();

    // State เก็บรายการเมนูที่กำลังเปิดอยู่ (expanded)
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    // ====================================================================================
    // HANDLER FUNCTIONS
    // ====================================================================================

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

    // ====================================================================================
    // UTILITY FUNCTIONS
    // ====================================================================================

    /**
     * ตรวจสอบว่ามีเมนูย่อยใดกำลัง active หรือไม่
     * @param subItems - รายการเมนูย่อย
     * @returns true ถ้ามี subItem ที่ตรงกับ current path
     */
    const isActiveSubItem = (subItems?: SubMenuItem[]) => {
        if (!subItems) return false;
        return subItems.some(sub => location.pathname === sub.path);
    };

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        // Sidebar Container - ขยายจาก 200px เป็น 300px เมื่อ hover
        <div className="w-[200px] hover:w-[300px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col transition-all duration-300 ease-in-out group overflow-hidden">

            {/* ==================== HEADER (Logo & Brand) ==================== */}
            <div className="bg-blue-600 text-white p-4 flex items-center space-x-3 flex-shrink-0">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                    YMD
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">YMD Tech Care</div>
                    <div className="text-xs text-blue-100 whitespace-nowrap truncate">ERP System v1.0</div>
                </div>
            </div>

            {/* ==================== MENU ITEMS ==================== */}
            <div className="flex-1 overflow-y-auto py-2">
                {sidebarMenuItems.map((item: MenuItem) => {
                    // ตรวจสอบสถานะต่างๆ ของเมนู
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isExpanded = expandedMenus.includes(item.id);
                    const isActive = hasSubItems
                        ? isActiveSubItem(item.subItems)              // เช็คจาก subItems
                        : location.pathname === item.path;  // เช็คจาก path ตรง

                    return (
                        <div key={item.id} className="mb-0.5">
                            {/* ---------- MENU HEADER ---------- */}
                            {hasSubItems ? (
                                // เมนูที่มี submenu -> ใช้ button เพื่อเปิด/ปิด
                                <button
                                    onClick={() => toggleMenu(item.id)}
                                    className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }
                  `}
                                >
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                            <item.icon size={16} />
                                        </div>
                                        {/* Label */}
                                        <span className="text-xs font-semibold truncate">{item.label}</span>
                                    </div>
                                    {/* Chevron Icon - หมุนเมื่อเปิด/ปิด */}
                                    <ChevronDown
                                        size={14}
                                        className={`flex-shrink-0 text-gray-400 dark:text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                    />
                                </button>
                            ) : (
                                // เมนูที่ไม่มี submenu -> ใช้ Link ไปหน้าอื่น
                                <Link
                                    to={item.path || '#'}
                                    className={`
                    flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors
                    ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-3 border-blue-600'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }
                  `}
                                >
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                        <div className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-300'}`}>
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-xs font-semibold truncate">{item.label}</span>
                                    </div>
                                    <ChevronRight size={14} className="flex-shrink-0 text-gray-400 dark:text-gray-300" />
                                </Link>
                            )}

                            {/* ---------- SUBMENU ITEMS ---------- */}
                            {hasSubItems && (
                                // Collapsible container with animation
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    {/* Submenu container with left border */}
                                    <div className="ml-6 border-l-2 border-blue-300 dark:border-blue-500">
                                        {item.subItems?.map((subItem) => {
                                            const isSubActive = location.pathname === subItem.path;
                                            return (
                                                <Link
                                                    key={subItem.id}
                                                    to={subItem.path}
                                                    className={`
                              flex items-center pl-6 pr-4 py-2 text-xs cursor-pointer transition-colors
                              ${isSubActive
                                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium'
                                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }
                            `}
                                                >
                                                    {/* Bullet point - จุดหน้าเมนูย่อย */}
                                                    <span className="w-1 h-1 bg-current rounded-full mr-2 flex-shrink-0"></span>
                                                    <span className="truncate">{subItem.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
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
