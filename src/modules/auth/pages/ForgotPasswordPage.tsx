/**
 * @file ForgotPasswordPage.tsx
 * @description High-fidelity Forgot Password Page with Dimensional UI
 * @purpose Modern, secure reset flow with TH/EN support
 * @module auth
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '@/shared/layouts/AuthLayout';
import { BrandLogo } from '@/shared/components/system/BrandLogo';
import { ROUTES } from '@/core/config/routes';

interface TranslationSet {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    resetButton: string;
    sending: string;
    backToLogin: string;
    successTitle: string;
    successSubtitle: string;
    didNotReceive: string;
    clickToResend: string;
    footer: string;
}

// ====================================================================================
// SUB-COMPONENTS (Defined outside to prevent re-creation during render)
// ====================================================================================

/** Shared Language Switcher */
const LanguageToggle = ({ 
    language, 
    setLanguage 
}: { 
    language: 'TH' | 'EN'; 
    setLanguage: (lang: 'TH' | 'EN') => void 
}) => (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-full border border-gray-200 dark:border-white/5 transition-all w-fit mx-auto mt-6">
        <button 
            type="button" 
            onClick={() => setLanguage('TH')}
            className={`text-[10px] font-bold transition-all ${language === 'TH' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
            ภาษาไทย
        </button>
        <span className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
        <button 
            type="button" 
            onClick={() => setLanguage('EN')}
            className={`text-[10px] font-bold transition-all ${language === 'EN' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
            ENGLISH 
        </button>
    </div>
);

/** Premium Glowing Header */
const CustomHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex flex-col items-center space-y-6 relative z-10 w-full">
        {/* Brand Logo Integration */}
        <BrandLogo size="md" className="drop-shadow-blue-500/10" />
        
        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] leading-relaxed mx-auto font-medium">
                {subtitle}
            </p>
        </div>
    </div>
);

// ====================================================================================
// MAIN COMPONENT - ForgotPasswordPage
// ====================================================================================

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState<'TH' | 'EN'>('TH');

    const translations: Record<'TH' | 'EN', TranslationSet> = {
        TH: {
            title: 'ลืมรหัสผ่าน?',
            subtitle: 'ไม่ต้องกังวล! เราจะส่งขั้นตอนการรีเซ็ตให้คุณ',
            emailLabel: 'อีเมล / EMAIL ADDRESS',
            emailPlaceholder: 'ระบุอีเมลของคุณ',
            resetButton: 'เปลี่ยนรหัสผ่าน',
            sending: 'กำลังส่งข้อมูล...',
            backToLogin: 'กลับไปหน้าเข้าสู่ระบบ',
            successTitle: 'ตรวจสอบอีเมลของคุณ',
            successSubtitle: `เราได้ส่งขั้นตอนการรีเซ็ตรหัสผ่านไปยัง ${email} เรียบร้อยแล้ว`,
            didNotReceive: 'ไม่ได้รับอีเมลใช่หรือไม่?',
            clickToResend: 'คลิกเพื่อส่งใหม่',
            footer: '© 2024 YMD Tech Care. สงวนลิขสิทธิ์.'
        },
        EN: {
            title: 'Forgot Password?',
            subtitle: "No worries, we'll send you reset instructions.",
            emailLabel: 'EMAIL ADDRESS',
            emailPlaceholder: 'Enter your email',
            resetButton: 'Reset Password',
            sending: 'Sending instructions...',
            backToLogin: 'Back to Sign in',
            successTitle: 'Check your email',
            successSubtitle: `We've sent password reset instructions to ${email}`,
            didNotReceive: "Didn't receive the email?",
            clickToResend: 'Click to resend',
            footer: '© 2024 YMD Tech Care. All rights reserved.'
        }
    };

    const t = translations[language];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    const pageFooter = (
        <div className="space-y-6 relative z-10">
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800/50 flex justify-center">
                <button
                    onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    {t.backToLogin}
                </button>
            </div>
            <LanguageToggle language={language} setLanguage={setLanguage} />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium text-center opacity-60">
                {t.footer}
            </p>
        </div>
    );

    if (isSubmitted) {
        return (
            <AuthLayout customHeader={<CustomHeader title={t.title} subtitle={t.subtitle} />}>
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center relative">
                        <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                        <div className="relative w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-500 drop-shadow-glow" />
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t.successTitle}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                           {t.successSubtitle}
                        </p>
                    </div>

                    <AuthButton
                        onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/20"
                    >
                        {t.backToLogin}
                    </AuthButton>

                    <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                        {t.didNotReceive}{' '}
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold transition-colors underline underline-offset-4"
                        >
                            {t.clickToResend}
                        </button>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            customHeader={<CustomHeader title={t.title} subtitle={t.subtitle} />}
            footer={pageFooter}
        >
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10 animate-in fade-in duration-700">
                {/* Email Field */}
                <div className="space-y-3">
                    <AuthLabel>{t.emailLabel}</AuthLabel>
                    <AuthInput
                        icon={Mail}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        required
                        className="h-12 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm border-gray-200 dark:border-white/10"
                    />
                </div>

                {/* Submit Button */}
                <AuthButton
                    isLoading={isLoading}
                    loadingText={t.sending}
                    className="h-14 rounded-full bg-gradient-to-r from-[#2D5BFF] to-[#6D4AFF] hover:translate-y-[-2px] hover:shadow-[0_10px_25px_-5px_rgba(45,91,255,0.5)] transition-all duration-300 shadow-xl shadow-blue-500/20 font-bold group border-0 text-[15px] tracking-normal"
                    icon={<ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                >
                    {t.resetButton}
                </AuthButton>
            </form>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
