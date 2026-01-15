/**
 * @file Header.tsx
 * @description Header Component - แถบด้านบนของหน้าเว็บ
 * @purpose แสดงข้อมูลหน้าปัจจุบันและปุ่ม Actions
 * @usage ใช้ใน MainLayout.tsx เป็นส่วนหัวของทุกหน้า
 * 
 * @features
 * - แสดง Page Title ตาม route ปัจจุบัน
 * - แสดง Breadcrumb (Current Path)
 * - ปุ่ม Notifications
 * - ปุ่ม Settings พร้อม Dark Mode Toggle
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, Moon, Sun, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// ====================================================================================
// COMPONENT - Header
// ====================================================================================

export default function Header() {
    // ==================== HOOKS ====================
    const location = useLocation();
    const { theme, setTheme } = useTheme();

    // Settings dropdown state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ==================== HELPER FUNCTIONS ====================

    const getBreadcrumb = () => {
        const path = location.pathname;
        if (path === '/') return '/procurement/dashboard';
        if (path === '/pr-form') return '/procurement/pr-form';
        return path;
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Business Intelligence Solutions';
        if (path === '/pr-form') return 'ใบขอซื้อ';
        return 'Business Intelligence Solutions';
    };

    // Theme options
    const themeOptions = [
        { value: 'light' as const, label: 'Light', icon: Sun },
        { value: 'dark' as const, label: 'Dark', icon: Moon },
    ];

    // ==================== RENDER ====================
    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 transition-colors duration-200">

            {/* ========== LEFT SECTION: Page Title & Breadcrumb ========== */}
            <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white truncate">{getPageTitle()}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    <span className="hidden sm:inline">Current Path: </span>
                    <span className="font-mono">{getBreadcrumb()}</span>
                </p>
            </div>

            {/* ========== RIGHT SECTION: Action Buttons ========== */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">

                {/* Notifications Button */}
                <button className="px-2 sm:px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-1 transition-colors">
                    <Bell size={16} />
                    <span className="hidden sm:inline">Notifications</span>
                </button>

                {/* Settings Button with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="px-2 sm:px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
                    >
                        <Settings size={16} />
                        <span className="hidden sm:inline">Settings</span>
                        <ChevronDown size={14} className={`hidden sm:block transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isSettingsOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                            {/* Header */}
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Appearance
                                </p>
                            </div>

                            {/* Theme Options */}
                            <div className="p-2">
                                <p className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 mb-1">Theme</p>
                                <div className="space-y-1">
                                    {themeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setTheme(option.value);
                                                setIsSettingsOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${theme === option.value
                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <option.icon size={18} />
                                            <span>{option.label}</span>
                                            {theme === option.value && (
                                                <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

                            {/* Other Settings */}
                            <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
                                More settings coming soon...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}