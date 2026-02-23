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
import { USE_MOCK, extractErrorMessage } from '@/core/api/api';
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
                'Username not found': 'ไม่พบชื่อผู้ใช้งานในระบบ',
                'Invalid password': 'รหัสผ่านไม่ถูกต้อง',
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
                'Username not found': 'Username not found',
                'Invalid password': 'Invalid password',
                'Network Error': 'Network Error',
                'Locked': 'Account locked. Retry available in {time}',
                'LastAttempt': 'Warning! One more failed attempt will lock your account.',
                'default': 'Login failed. Please check your credentials.'
            }
        }
    };

    const t = translations[language];

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
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [lockoutSeconds]);

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
            // 💡 Sanitize input (Perfection Point #1)
            const cleanUsername = username.trim();
            const cleanPassword = password.trim();
            
            await login({ username: cleanUsername, password: cleanPassword });
        } catch (err) {
            let errorMsg = extractErrorMessage(err);
            
            if (axios.isAxiosError(err)) {
                // 💡 423 Locked Handling
                if (err.response?.status === 423) {
                    const data = err.response.data as { retryAfter?: number };
                    const retryAfter = data && typeof data === 'object' && 'retryAfter' in data 
                        ? data.retryAfter : 60;
                    
                    setIsLocked(true);
                    setLockoutSeconds(retryAfter || 60);
                    errorMsg = 'Locked'; 
                } 
                // 💡 401 Unauthorized with attemptsRemaining
                else if (err.response?.status === 401) {
                    const data = err.response.data as { attemptsRemaining?: number };
                    if (data && typeof data === 'object' && 'attemptsRemaining' in data) {
                        const remaining = data.attemptsRemaining;
                        setAttemptsRemaining(remaining ?? null);
                        if (remaining === 1) {
                            errorMsg = 'LastAttempt';
                        }
                    }
                }
            }

            const translatedMsg = t.apiErrors[errorMsg] || t.apiErrors.default || errorMsg;
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