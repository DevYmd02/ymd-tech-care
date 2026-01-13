/**
 * @file LoginPage.tsx
 * @description หน้าจัดการการเข้าสู่ระบบ (Login)
 * @purpose ให้ผู้ใช้งานยืนยันตัวตนก่อนเข้าสู่ระบบ
 * @refactored ใช้ AuthLayout เพื่อลด duplicate code
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { LayoutDashboard } from 'lucide-react';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '../../layouts/AuthLayout';

const LoginPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock Login Handler
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsLoading(false);
            navigate('/'); // Redirect to dashboard
        }, 1500);
    };

    return (
        <AuthLayout
            title="YMD FUTURE GROUP CO., Ltd"
            subtitle="Business Intelligence Solutions"
            logoIcon={LayoutDashboard}
            footer={
                <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            Sign up
                        </Link>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © 2024 YMD Tech Care. All rights reserved.
                    </p>
                </>
            }
        >
            <form onSubmit={handleLogin} className="space-y-5">

                {/* Email Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Email Address</AuthLabel>
                    <AuthInput
                        icon={Mail}
                        type="email"
                        defaultValue="admin@company.com"
                        placeholder="name@company.com"
                        required
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between pl-1">
                        <AuthLabel>Password</AuthLabel>
                        <Link to="/forgot-password" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                    <AuthInput
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        defaultValue="password"
                        placeholder="Enter your password"
                        required
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                    />
                </div>

                {/* Remember Me */}
                <div className="flex items-center pl-1">
                    <input
                        id="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                        Remember me
                    </label>
                </div>

                {/* Submit Button */}
                <AuthButton
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    icon={<ArrowRight size={18} className="ml-2" />}
                >
                    Sign in
                </AuthButton>

            </form>
        </AuthLayout>
    );
};

export default LoginPage;
