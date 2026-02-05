/**
 * @file LoginPage.tsx
 * @description Page for user authentication
 * @refactored Integrated real API via AuthContext
 * @module auth
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, LayoutDashboard, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '@/shared/layouts/AuthLayout';
import { useAuth } from '@/core/auth/contexts/AuthContext';

interface ApiErrorResponse {
    message: string;
}

const LoginPage = () => {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login({ username, password });
            // Navigation is handled in AuthProvider upon success
        } catch (err: unknown) {
            console.error(err); // Keep console for browser devtools
            
            let msg = 'Login failed. Please check your credentials.';
            
             // Check if it's an Axios Error with response data
            if (err instanceof AxiosError && err.response?.data) {
                // Try to extract message from common patterns
                const data = err.response.data as ApiErrorResponse | unknown;
                if (typeof data === 'object' && data !== null && 'message' in data) {
                     msg = (data as ApiErrorResponse).message;
                }
            } else if (err instanceof Error) {
                msg = err.message;
            }

            setError(msg);
        } finally {
            setIsLoading(false);
        }
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
                
                {/* Error Banner */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Username Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Username</AuthLabel>
                    <AuthInput
                        icon={User}
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between pl-1">
                        <AuthLabel>Password</AuthLabel>
                        {/* <Link to="/forgot-password" ... /> Removed for now/keep if needed */}
                    </div>
                    <AuthInput
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
