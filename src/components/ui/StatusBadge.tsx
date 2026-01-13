/**
 * @file StatusBadge.tsx
 * @description Reusable Status Badge component สำหรับแสดงสถานะต่างๆ
 * @usage ใช้แสดง status เช่น รออนุมัติ, อนุมัติแล้ว, Approved, Pending
 * 
 * @example
 * <StatusBadge status="รออนุมัติ" />
 * <StatusBadge status="Approved" variant="success" />
 */

import React from 'react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export type StatusVariant = 'pending' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface StatusBadgeProps {
    status: string;
    variant?: StatusVariant;  // Manual override
    size?: 'sm' | 'md';
    withBorder?: boolean;
}

// ====================================================================================
// STATUS MAPPING - Map status text to variant
// ====================================================================================

const statusVariantMap: Record<string, StatusVariant> = {
    // Thai
    'รออนุมัติ': 'warning',
    'อนุมัติแล้ว': 'success',
    'ยกเลิก': 'error',
    'กำลังดำเนินการ': 'info',
    // English
    'pending': 'warning',
    'approved': 'success',
    'confirmed': 'success',
    'deployed': 'info',
    'in review': 'warning',
    'cancelled': 'error',
    'rejected': 'error',
    'success': 'success',
    'failed': 'error',
    'active': 'success',
    'inactive': 'neutral',
    'normal': 'success',
    'warning': 'warning',
    'critical': 'error',
};

// ====================================================================================
// COLOR CLASSES
// ====================================================================================

const variantClasses: Record<StatusVariant, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50',
    success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50',
    error: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50',
    warning: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50',
    info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-600/50',
};

// ====================================================================================
// COMPONENT - StatusBadge
// ====================================================================================

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    variant,
    size = 'sm',
    withBorder = true,
}) => {
    // Determine variant from status text or use provided variant
    const resolvedVariant = variant || statusVariantMap[status.toLowerCase()] || 'neutral';

    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
    const borderClass = withBorder ? 'border' : '';

    return (
        <span className={`
            inline-flex items-center rounded-full font-semibold
            ${sizeClasses}
            ${borderClass}
            ${variantClasses[resolvedVariant]}
        `}>
            {status}
        </span>
    );
};
