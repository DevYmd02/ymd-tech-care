/**
 * @file LoginPage.tsx
 * @description Page for user authentication
 * @refactored Integrated real API via AuthContext
 * @module auth
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '@/shared/layouts/AuthLayout';
import { BrandLogo } from '@/shared/components/system/BrandLogo';
import { ROUTES } from '@/core/config/routes';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { USE_MOCK, extractErrorMessage, getErrorCode } from '@/core/api/api';
import axios from 'axios';

interface TranslationSet {
    title: string;
    subtitle: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    signIn: string;
    signingIn: string;
    footer: string;
    autoLogin: string;
    apiErrors: Record<string, string>;
}

const LoginPage = () => {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'TH' | 'EN'>('TH');
    const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // 💡 Configuration
    const MAX_ATTEMPTS = 3;

    // Translation Mapping
    const translations: Record<'TH' | 'EN', TranslationSet> = {
        TH: {
            title: 'YMD Tech Care',
            subtitle: 'โซลูชั่นอัจฉริยะทางธุรกิจ (Business Intelligence Solutions)',
            usernameLabel: 'ชื่อผู้ใช้งาน',
            usernamePlaceholder: 'กรอกชื่อผู้ใช้งานของคุณ',
            passwordLabel: 'รหัสผ่าน',
            passwordPlaceholder: 'กรอกรหัสผ่านของคุณ',
            forgotPassword: 'ลืมรหัสผ่าน?',
            signIn: 'เข้าสู่ระบบ',
            signingIn: 'กำลังเข้าสู่ระบบ...',
            footer: '© 2024 YMD Tech Care. สงวนลิขสิทธิ์.',
            autoLogin: 'เลือกเข้าสู่ระบบอัตโนมัติ (Dev Mode)',
            apiErrors: {
                'AUTH_USER_NOT_FOUND': 'ไม่พบชื่อผู้ใช้งานในระบบ',
                'AUTH_INVALID_PASSWORD': 'รหัสผ่านไม่ถูกต้อง',
                'AUTH_ACCOUNT_LOCKED': 'บัญชีถูกระงับชั่วคราว ลองใหม่ได้ใน {time}',
                'AUTH_ATTEMPTS_WARNING': 'ระบุรหัสผ่านผิด เหลือโอกาสอีก {count} ครั้ง',
                'TOO_MANY_ATTEMPTS': 'คุณระบุรหัสผ่านผิดเกินกำหนด กรุณาลองใหม่ในภายหลัง',
                'Username not found': 'ไม่พบชื่อผู้ใช้งานในระบบ',
                'Invalid password': 'รหัสผ่านไม่ถูกต้อง',
                'Too many attempts': 'คุณระบุรหัสผ่านผิดเกินกำหนด กรุณาลองใหม่ในภายหลัง',
                'Network Error': 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
                'Locked': 'บัญชีถูกระงับชั่วคราว ลองใหม่ได้ใน {time}',
                'LastAttempt': 'ระวัง! หากผิดอีกครั้งบัญชีจะถูกระงับชั่วคราว',
                'default': 'เข้าสู่ระบบล้มเหลว กรุณาตรวจสอบข้อมูลของคุณ'
            }
        },
        EN: {
            title: 'YMD Tech Care',
            subtitle: 'Business Intelligence Solutions',
            usernameLabel: 'Username',
            usernamePlaceholder: 'Enter your username',
            passwordLabel: 'Password',
            passwordPlaceholder: 'Enter your password',
            forgotPassword: 'Forgot Password?',
            signIn: 'Sign In',
            signingIn: 'Signing in...',
            footer: '© 2024 YMD Tech Care. All rights reserved.',
            autoLogin: 'Auto Login (Dev Mode)',
            apiErrors: {
                'AUTH_USER_NOT_FOUND': 'Username not found',
                'AUTH_INVALID_PASSWORD': 'Invalid password',
                'AUTH_ACCOUNT_LOCKED': 'Account locked. Retry available in {time}',
                'AUTH_ATTEMPTS_WARNING': 'Invalid password. {count} attempts remaining',
                'TOO_MANY_ATTEMPTS': 'Too many attempts. Please try again later.',
                'Username not found': 'Username not found',
                'Invalid password': 'Invalid password',
                'Too many attempts': 'Too many attempts. Please try again later.',
                'Network Error': 'Network Error',
                'Locked': 'Account locked. Retry available in {time}',
                'LastAttempt': 'Warning! One more failed attempt will lock your account.',
                'default': 'Login failed. Please check your credentials.'
            }
        }
    };

    const t = translations[language];

    // 💡 Restore Lockout on Username Change (F5 Persistence)
    React.useEffect(() => {
        const cleanUser = username.trim().toLowerCase();
        if (cleanUser) {
            const lockoutUntil = sessionStorage.getItem(`lockout_until_${cleanUser}`);
            if (lockoutUntil) {
                const remainingMs = parseInt(lockoutUntil, 10) - Date.now();
                if (remainingMs > 0) {
                    setIsLocked(true);
                    setLockoutSeconds(Math.ceil(remainingMs / 1000));
                    setError(t.apiErrors['TOO_MANY_ATTEMPTS']);
                } else {
                    sessionStorage.removeItem(`lockout_until_${cleanUser}`);
                }
            }
        }
    }, [username, t.apiErrors]);

    // 💡 Lockout Countdown Timer Effect
    React.useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        if (lockoutSeconds !== null && lockoutSeconds > 0) {
            timer = setInterval(() => {
                setLockoutSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (lockoutSeconds === 0) {
            setIsLocked(false);
            setLockoutSeconds(null);
            setError(null);
            // Reset attempts and lockout after period ends
            const cleanUser = username.trim().toLowerCase();
            if (cleanUser) {
                sessionStorage.removeItem(`login_attempts_${cleanUser}`);
                sessionStorage.removeItem(`lockout_until_${cleanUser}`);
            }
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [lockoutSeconds, username]);

    const formatTime = (seconds: number) => {
        const mm = Math.floor(seconds / 60);
        const ss = seconds % 60;
        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 💡 Sanitize input
            const cleanUsername = username.trim();
            const cleanPassword = password.trim();
            const ATTEMPT_KEY = `login_attempts_${cleanUsername.toLowerCase()}`;
            
            await login({ username: cleanUsername, password: cleanPassword });
            
            // Clear attempts on success
            sessionStorage.removeItem(ATTEMPT_KEY);
        } catch (err) {
            const cleanUsername = username.trim();
            const ATTEMPT_KEY = `login_attempts_${cleanUsername.toLowerCase()}`;
            const errorCode = getErrorCode(err);
            const rawErrorMsg = extractErrorMessage(err);
            let finalErrorKey = errorCode || rawErrorMsg;
            let currentRemaining: number | null = null;
            
            if (axios.isAxiosError(err)) {
                // 1. Check for Lockout (423 or 401 with specific message)
                const data = err.response?.data as { attemptsRemaining?: number; message?: string; retryAfter?: number };
                const message = data?.message || '';

                if (err.response?.status === 423 || message.toLowerCase().includes('too many attempts')) {
                    finalErrorKey = 'TOO_MANY_ATTEMPTS';
                    const retryAfter = data?.retryAfter || 60;
                    const secondsMatch = message.match(/(\d+)\s*seconds/i);
                    
                    setIsLocked(true);
                    setLockoutSeconds(secondsMatch ? parseInt(secondsMatch[1], 10) : retryAfter);
                } 
                // 2. Handle Attempt Counting (401)
                else if (err.response?.status === 401) {
                    let remaining: number | null = null;

                    // Use Backend data if available
                    if (data && typeof data === 'object' && 'attemptsRemaining' in data) {
                        remaining = data.attemptsRemaining ?? null;
                    } 
                    // Fallback: Frontend Session Tracking
                    else {
                        const currentFailures = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10) + 1;
                        sessionStorage.setItem(ATTEMPT_KEY, currentFailures.toString());
                        remaining = Math.max(0, MAX_ATTEMPTS - currentFailures);
                    }

                    setAttemptsRemaining(remaining);
                    currentRemaining = remaining;

                    if (remaining === 0) {
                        finalErrorKey = 'TOO_MANY_ATTEMPTS';
                        setIsLocked(true);
                        const duration = 60;
                        setLockoutSeconds(duration);
                        // Save lockout expiration to sessionStorage for F5 persistence
                        sessionStorage.setItem(`lockout_until_${cleanUsername.toLowerCase()}`, (Date.now() + duration * 1000).toString());
                    } else {
                        // Always show count if > 0
                        finalErrorKey = 'AUTH_ATTEMPTS_WARNING';
                        // If it's the very last one, we can still use the special warning message if you prefer
                        if (remaining === 1) {
                             // Option: Use a stronger warning for the last attempt
                             // finalErrorKey = 'LastAttempt'; 
                        }
                    }
                }
            }

            // 🎯 Final Translation Logic
            let translatedMsg = t.apiErrors[finalErrorKey] || t.apiErrors.default;
            
            // Handle placeholders
            if (finalErrorKey === 'AUTH_ATTEMPTS_WARNING' && currentRemaining !== null) {
                translatedMsg = translatedMsg.replace('{count}', String(currentRemaining));
            }

            setError(translatedMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            customHeader={<BrandLogo size="md" className="drop-shadow-blue-500/10" />}
            footer={
                <div className="flex flex-col items-center gap-6 relative z-10">
                    {/* Language Switcher */}
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-full border border-gray-200 dark:border-white/5 transition-all w-fit mx-auto">
                        <button 
                            type="button" 
                            onClick={() => setLanguage('TH')}
                            className={`text-xs font-bold transition-all ${language === 'TH' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            ภาษาไทย
                        </button>
                        <span className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
                        <button 
                            type="button" 
                            onClick={() => setLanguage('EN')}
                            className={`text-xs font-bold transition-all ${language === 'EN' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            English 
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                        {t.footer}
                    </p>
                </div>
            }
        >
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                
                <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                        error ? 'max-h-40 opacity-100 pb-2' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className={`p-3.5 border rounded-xl flex items-center gap-3 text-sm animate-shake ${
                        isLocked || attemptsRemaining === 1
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="font-medium leading-tight">
                            {isLocked && lockoutSeconds !== null
                                ? t.apiErrors['Locked'].replace('{time}', formatTime(lockoutSeconds))
                                : error}
                        </span>
                    </div>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                    <AuthLabel>{t.usernameLabel}</AuthLabel>
                    <AuthInput
                        icon={User}
                        type="text"
                        placeholder={t.usernamePlaceholder}
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        required
                        disabled={isLocked}
                        className="transition-all hover:border-gray-300 dark:hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between pl-1">
                        <AuthLabel>{t.passwordLabel}</AuthLabel>
                        <Link 
                            to={ROUTES.AUTH.FORGOT_PASSWORD} 
                            className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors"
                        >
                            {t.forgotPassword}
                        </Link>
                    </div>
                    <AuthInput
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t.passwordPlaceholder}
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        disabled={isLocked}
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLocked}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 disabled:opacity-30"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                        className="transition-all hover:border-gray-300 dark:hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Submit Button */}
                <AuthButton
                    isLoading={isLoading}
                    loadingText={t.signingIn}
                    disabled={isLocked || !username.trim() || !password.trim()}
                    icon={<ArrowRight size={18} className="ml-2" />}
                >
                    {t.signIn}
                </AuthButton>

                {USE_MOCK && (
                    <button 
                        type="button" 
                        onClick={() => login({ username: 'admin', password: '123456' })}
                        className="w-full border border-dashed border-yellow-500/30 text-yellow-600 dark:text-yellow-500/80 hover:bg-yellow-500/5 font-bold py-2.5 rounded-xl transition-all text-[11px] flex items-center justify-center gap-2 group"
                    >
                        <span className="group-hover:animate-bounce">⚡</span> {t.autoLogin}
                    </button>
                )}

            </form>
        </AuthLayout>
    );
};

export default LoginPage;