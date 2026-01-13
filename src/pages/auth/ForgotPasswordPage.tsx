/**
 * @file ForgotPasswordPage.tsx
 * @description หน้าลืมรหัสผ่าน (Forgot Password Page)
 * @purpose ให้ผู้ใช้งานรีเซ็ตรหัสผ่านผ่านอีเมล
 * @refactored ใช้ AuthLayout เพื่อลด duplicate code
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, LayoutDashboard } from 'lucide-react';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '../../layouts/AuthLayout';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');

    // Mock Submit Handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    // Success State Content
    if (isSubmitted) {
        return (
            <AuthLayout
                title="Check your email"
                subtitle={`We've sent password reset instructions to ${email}`}
                logoIcon={LayoutDashboard}
                logoSize="sm"
            >
                <div className="space-y-6">
                    {/* Success Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    {/* Back to Login Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all duration-200"
                    >
                        Back to Sign in
                    </button>

                    {/* Resend Link */}
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Didn't receive the email?{' '}
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Click to resend
                        </button>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    // Form State Content
    return (
        <AuthLayout
            title="Forgot Password?"
            subtitle="No worries, we'll send you reset instructions."
            logoIcon={LayoutDashboard}
            logoSize="sm"
            showBackLink
            backLinkHref="/login"
            backLinkText="Back to Sign in"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Email Address</AuthLabel>
                    <AuthInput
                        icon={Mail}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                {/* Submit Button */}
                <AuthButton
                    isLoading={isLoading}
                    loadingText="Sending..."
                    icon={<ArrowRight size={18} className="ml-2" />}
                >
                    Reset Password
                </AuthButton>

            </form>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
