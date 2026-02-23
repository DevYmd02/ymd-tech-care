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
    title?: string;
    subtitle?: string;
    logoIcon?: LucideIcon;
    logoSize?: 'sm' | 'md';  // sm = 14x14, md = 16x16

    // Optional back link (for forgot password)
    showBackLink?: boolean;
    backLinkHref?: string;
    backLinkText?: string;

    // Custom Header (Overrides logo + title)
    customHeader?: React.ReactNode;

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
    customHeader,
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
                className="absolute top-6 right-6 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-white/10 transition-all z-50"
                aria-label="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* ==================== BACKGROUND DECORATION ==================== */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 dark:bg-blue-600/15 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 dark:bg-indigo-600/15 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 dark:bg-purple-600/5 rounded-full blur-[100px] animate-pulse delay-500" />
            </div>

            {/* ==================== MAIN CARD ==================== */}
            <div className="relative z-10 w-full max-w-md p-4">
                <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] rounded-3xl p-8 transition-all duration-500 overflow-hidden relative">
                    {/* Corner Accent Glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />

                    {/* ========== LOGO / HEADER ========== */}
                    {customHeader ? (
                        <div className="mb-10 flex justify-center w-full transform hover:scale-[1.02] transition-transform duration-500">
                            {customHeader}
                        </div>
                    ) : (
                        <div className="text-center mb-8 relative z-10">
                            {LogoIcon && (
                                <div className={`inline-flex items-center justify-center ${logoSizeClass} bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20 mb-6 transform hover:scale-105 transition-transform duration-300`}>
                                    <LogoIcon className={`text-white ${iconSizeClass} drop-shadow-md`} />
                                </div>
                            )}
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                            )}
                        </div>
                    )}

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
                className={`w-full pl-10 ${rightElement ? 'pr-10' : 'pr-4'} py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] ${className}`}
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
    className = '',
    ...props
}) => {
    return (
        <button
            type="submit"
            disabled={isLoading || disabled}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 ${className}`}
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
