/**
 * @file RegisterPage.tsx
 * @description หน้าลงทะเบียนสมาชิกใหม่ (Registration Page)
 * @purpose ให้ผู้ใช้งานใหม่สร้างบัญชีเข้าใช้งานระบบ
 * @refactored ใช้ AuthLayout เพื่อลด duplicate code
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, LayoutDashboard } from 'lucide-react';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '../../layouts/AuthLayout';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock Register Handler
    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsLoading(false);
            navigate('/');
        }, 1500);
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join YMD Future Group Co., Ltd"
            logoIcon={LayoutDashboard}
            logoSize="sm"
            footer={
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        Sign in
                    </Link>
                </p>
            }
        >
            <form onSubmit={handleRegister} className="space-y-5">

                {/* Full Name Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Full Name</AuthLabel>
                    <AuthInput
                        icon={User}
                        type="text"
                        placeholder="John Doe"
                        required
                    />
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Email Address</AuthLabel>
                    <AuthInput
                        icon={Mail}
                        type="email"
                        placeholder="name@company.com"
                        required
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Password</AuthLabel>
                    <AuthInput
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
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

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Confirm Password</AuthLabel>
                    <AuthInput
                        icon={Lock}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        required
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                    />
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start pl-1">
                    <input
                        id="terms"
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        required
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-600 dark:text-gray-400">
                        I agree to the <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
                    </label>
                </div>

                {/* Submit Button */}
                <AuthButton
                    isLoading={isLoading}
                    loadingText="Creating account..."
                    icon={<ArrowRight size={18} className="ml-2" />}
                >
                    Sign up
                </AuthButton>

            </form>
        </AuthLayout>
    );
};

export default RegisterPage;
