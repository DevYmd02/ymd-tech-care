/**
 * @file AuthLayout.tsx
 * @description Layout wrapper สำหรับหน้า Authentication (Login, Register, ForgotPassword)
 * @purpose ลด duplicate code ของ background decoration, theme toggle, และ card styling
 * 
 * @example
 * <AuthLayout
 *   title="Sign in"
 *   subtitle="Welcome back"
 *   logoIcon={LayoutDashboard}
 *   showBackLink
 *   backLinkHref="/login"
 *   footer={<FooterContent />}
 * >
 *   <form>...</form>
 * </AuthLayout>
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '@/core/contexts/ThemeContext';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface AuthLayoutProps {
    children: React.ReactNode;

    // Header configuration
    title: string;
    subtitle?: string;
    logoIcon: LucideIcon;
    logoSize?: 'sm' | 'md';  // sm = 14x14, md = 16x16

    // Optional back link (for forgot password)
    showBackLink?: boolean;
    backLinkHref?: string;
    backLinkText?: string;

    // Footer content (login/register links, copyright)
    footer?: React.ReactNode;
}

// ====================================================================================
// COMPONENT - AuthLayout
// ====================================================================================

export const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    title,
    subtitle,
    logoIcon: LogoIcon,
    logoSize = 'md',
    showBackLink = false,
    backLinkHref = '/login',
    backLinkText = 'Back to Sign in',
    footer,
}) => {
    const { theme, toggleTheme } = useTheme();

    const logoSizeClass = logoSize === 'sm' ? 'w-14 h-14' : 'w-16 h-16';
    const iconSizeClass = logoSize === 'sm' ? 'w-7 h-7' : 'w-8 h-8';

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative">

            {/* ==================== THEME TOGGLE ==================== */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all z-50"
                aria-label="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* ==================== BACKGROUND DECORATION ==================== */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-400/30 dark:bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* ==================== MAIN CARD ==================== */}
            <div className="relative z-10 w-full max-w-md p-4">
                <div className="bg-white dark:bg-gray-800/60 dark:backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl p-8 transition-all duration-300">

                    {/* ========== LOGO / HEADER ========== */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center ${logoSizeClass} bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg mb-4`}>
                            <LogoIcon className={`text-white ${iconSizeClass}`} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                        )}
                    </div>

                    {/* ========== CONTENT (Form, Success State, etc.) ========== */}
                    {children}

                    {/* ========== BACK LINK (Optional) ========== */}
                    {showBackLink && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                            <Link
                                to={backLinkHref}
                                className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                {backLinkText}
                            </Link>
                        </div>
                    )}

                    {/* ========== FOOTER (Optional) ========== */}
                    {footer && (
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                            {footer}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// ====================================================================================
// SUB-COMPONENTS - Reusable Auth Form Elements
// ====================================================================================

/** Props for AuthInput component */
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: LucideIcon;
    rightElement?: React.ReactNode;
}

/**
 * AuthInput - Input field with icon for auth forms
 */
export const AuthInput: React.FC<AuthInputProps> = ({
    icon: Icon,
    rightElement,
    className = '',
    ...props
}) => {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icon size={18} />
            </div>
            <input
                className={`w-full pl-10 ${rightElement ? 'pr-10' : 'pr-4'} py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
                {...props}
            />
            {rightElement && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {rightElement}
                </div>
            )}
        </div>
    );
};

/**
 * AuthLabel - Label for auth form fields
 */
export const AuthLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider pl-1">
        {children}
    </label>
);

/**
 * AuthButton - Primary submit button for auth forms
 */
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
    children,
    isLoading = false,
    loadingText = 'Loading...',
    icon,
    disabled,
    ...props
}) => {
    return (
        <button
            type="submit"
            disabled={isLoading || disabled}
            className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {loadingText}
                </>
            ) : (
                <>
                    {children}
                    {icon}
                </>
            )}
        </button>
    );
};
