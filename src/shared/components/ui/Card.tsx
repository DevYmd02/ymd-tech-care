/**
 * @file Card.tsx
 * @description Reusable Card container component สำหรับ Dashboard pages
 * @purpose ลด duplicate CSS classes ที่ใช้ซ้ำหลายที่
 * 
 * @example
 * <Card>Content here</Card>
 * <Card variant="gradient" gradientFrom="blue" gradientTo="indigo">Header content</Card>
 */

import React from 'react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface CardProps {
    children: React.ReactNode;
    className?: string;

    // Card variants
    variant?: 'default' | 'gradient';
    gradientFrom?: 'blue' | 'emerald' | 'purple' | 'yellow' | 'green';
    gradientTo?: 'blue' | 'indigo' | 'emerald' | 'purple' | 'yellow' | 'green';

    // Optional padding override
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

// ====================================================================================
// COMPONENT - Card
// ====================================================================================

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    variant = 'default',
    gradientFrom = 'blue',
    gradientTo = 'blue',
    padding = 'md',
}) => {
    // Padding classes
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    }[padding];

    // Gradient color classes
    const gradientColorClasses = {
        blue: 'from-blue-600',
        emerald: 'from-emerald-600',
        purple: 'from-purple-600',
        yellow: 'from-yellow-600',
        green: 'from-green-600',
        indigo: 'to-indigo-600',
    };

    if (variant === 'gradient') {
        return (
            <div className={`bg-gradient-to-r ${gradientColorClasses[gradientFrom]} to-${gradientTo}-400 rounded-xl text-white ${paddingClasses} ${className}`}>
                {children}
            </div>
        );
    }

    // Default card style
    return (
        <div className={`bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${paddingClasses} ${className}`}>
            {children}
        </div>
    );
};

// ====================================================================================
// SECTION CARD - Card with header
// ====================================================================================

interface SectionCardProps {
    children: React.ReactNode;
    title: string;
    titleIcon?: React.ReactNode;
    headerAction?: React.ReactNode;
    className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    children,
    title,
    titleIcon,
    headerAction,
    className = '',
}) => {
    return (
        <Card className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    {titleIcon && (
                        <span className="text-blue-600 dark:text-blue-400">{titleIcon}</span>
                    )}
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
                </div>
                {headerAction}
            </div>
            {children}
        </Card>
    );
};
