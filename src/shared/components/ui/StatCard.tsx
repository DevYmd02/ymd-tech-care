/**
 * @file StatCard.tsx
 * @description Reusable stat/metric card component สำหรับ Dashboard pages
 * @purpose ลด duplicate StatCard/MetricCard patterns ใน AdminDashboard และ ProcurementDashboard
 * 
 * @example
 * <StatCard
 *   icon={<Users size={24} className="text-blue-600" />}
 *   label="Active Users"
 *   value="247"
 *   change="+12%"
 *   color="blue"
 * />
 */

import React from 'react';
import { styles } from '@/shared/constants/styles';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    change?: string;                  // Change percentage (e.g., "+12%")
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink' | 'cyan' | 'indigo';
}

// ====================================================================================
// COMPONENT - StatCard
// ====================================================================================

export const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    change,
    color,
}) => {
    // Color mapping for icon background
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        orange: 'bg-orange-600',
        red: 'bg-red-600',
        yellow: 'bg-yellow-600',
        pink: 'bg-pink-600',
        cyan: 'bg-cyan-600',
        indigo: 'bg-indigo-600',
    };

    // Determine if change is positive or negative
    const isPositive = change?.startsWith('+') ?? true;

    return (
        <div className={`${styles.cardGlass} p-6`}>
            <div className="flex items-center justify-between mb-4">
                {/* Icon Container */}
                <div className={`w-12 h-12 ${colorClasses[color]} bg-opacity-10 dark:bg-opacity-20 rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
                {/* Change Indicator */}
                {change && (
                    <span className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change}
                    </span>
                )}
            </div>
            {/* Value & Label */}
            <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        </div>
    );
};

// ====================================================================================
// QUICK ACCESS CARD - For module shortcuts
// ====================================================================================

export interface QuickAccessCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: string;              // Tailwind color class (e.g., "bg-blue-600")
}

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
    icon,
    title,
    description,
    href,
    color,
}) => {
    return (
        <a
            href={href}
            className={`${styles.cardHover} p-6 block`}
        >
            {/* Icon Container with hover animation */}
            <div className={`w-12 h-12 ${color} bg-opacity-10 dark:bg-opacity-20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
            {/* Call to Action */}
            <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                เข้าสู่ระบบ
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </a>
    );
};
