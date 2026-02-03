/**
 * @file RegisterPage.tsx
 * @description Page for new user registration
 * @refactored Integrated real API with proper data type conversion
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, LayoutDashboard, Briefcase, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { AuthLayout, AuthInput, AuthLabel, AuthButton } from '../../layouts/AuthLayout';
import { AuthService } from '@/services/core/auth.service';
import { logger } from '../../utils/logger';

interface ApiErrorResponse {
    message: string;
}

const RegisterPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [employeeId, setEmployeeId] = useState(''); // Keep as string for input, convert on submit

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            // CRITICAL: Convert employeeId to number as required by API
            const payload = {
                username,
                password,
                employee_id: parseInt(employeeId, 10)
            };

            if (isNaN(payload.employee_id)) {
                throw new Error('Employee ID must be a valid number');
            }

            await AuthService.register(payload);
            
            alert('Registration Successful! Please sign in.');
            navigate('/login');
            
        } catch (err: unknown) {
            logger.error('Registration error:', err);

            let msg = 'Registration failed.';

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
                        placeholder="Create a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                {/* Employee ID Field - KEY REQUIREMENT */}
                <div className="space-y-1.5">
                    <AuthLabel>Employee ID (Numbers Only)</AuthLabel>
                    <AuthInput
                        icon={Briefcase}
                        type="number"
                        placeholder="e.g. 1005"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Password</AuthLabel>
                    <AuthInput
                        icon={Lock}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
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

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                    <AuthLabel>Confirm Password</AuthLabel>
                    <AuthInput
                        icon={Lock}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
