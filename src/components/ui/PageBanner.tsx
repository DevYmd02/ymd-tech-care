/**
 * @file PageBanner.tsx
 * @description Reusable Page Banner/Header component
 * @usage สำหรับ header banner แบบ gradient ที่ใช้ใน Dashboard pages
 * 
 * @example
 * <PageBanner
 *   icon={<Shield size={32} />}
 *   title="Roles & Permissions"
 *   subtitle="จัดการบทบาทและสิทธิ์"
 * />
 */

import React from 'react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export interface PageBannerProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    gradient?: 'blue' | 'purple' | 'green' | 'orange';
}

// ====================================================================================
// GRADIENT CLASSES
// ====================================================================================

const gradientClasses: Record<string, string> = {
    blue: 'from-blue-600 to-blue-400',
    purple: 'from-purple-600 to-purple-400',
    green: 'from-green-600 to-green-400',
    orange: 'from-orange-600 to-orange-400',
};

// ====================================================================================
// COMPONENT - PageBanner
// ====================================================================================

export const PageBanner: React.FC<PageBannerProps> = ({
    icon,
    title,
    subtitle,
    gradient = 'blue',
}) => {
    return (
        <div className={`bg-gradient-to-r ${gradientClasses[gradient]} rounded-xl p-6 text-white`}>
            <div className="flex items-center space-x-4">
                {/* Icon Container */}
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                {/* Title & Subtitle */}
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    {subtitle && <p className="text-white/80">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};
