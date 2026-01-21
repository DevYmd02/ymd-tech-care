/**
 * @file StatusBadge.tsx
 * @description Unified Status Badge Component สำหรับแสดงสถานะเอกสารต่างๆ
 * @usage ใช้แสดง status เช่น PR, RFQ, PO และสถานะทั่วไป
 * 
 * @example
 * <StatusBadge status="APPROVED" colorMap={PR_STATUS_COLORS} labelMap={PR_STATUS_LABELS} />
 * <PRStatusBadge status="APPROVED" />
 * <RFQStatusBadge status="SENT" />
 * <ActiveStatusBadge isActive={true} />
 */

import React from 'react';
import {
  PR_STATUS_COLORS,
  PR_STATUS_LABELS,
  RFQ_STATUS_COLORS,
  RFQ_STATUS_LABELS,
  QT_STATUS_COLORS,
  QT_STATUS_LABELS,
} from '../../constants/statusConstants';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export type StatusVariant = 'pending' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
  variant?: StatusVariant;  // Manual override
  size?: 'sm' | 'md';
  className?: string;
}

// ====================================================================================
// STATUS MAPPING - Map status text to variant (for generic usage)
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

const variantClasses: Record<StatusVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50',
  success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50',
  error: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50',
  warning: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50',
  info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-600/50',
};

// ====================================================================================
// MAIN COMPONENT - StatusBadge
// ====================================================================================

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap,
  labelMap,
  variant,
  size = 'sm',
  className = '',
}) => {
  // If colorMap is provided, use it (for PR/RFQ status)
  if (colorMap) {
    const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700';
    const label = labelMap?.[status] || status;

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass} ${className}`}>
        {label}
      </span>
    );
  }

  // Otherwise, use variant mapping (for generic status)
  const resolvedVariant = variant || statusVariantMap[status.toLowerCase()] || 'neutral';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`
      inline-flex items-center rounded-full font-semibold border whitespace-nowrap
      ${sizeClasses}
      ${variantClasses[resolvedVariant]}
      ${className}
    `}>
      {status}
    </span>
  );
};

// ====================================================================================
// PRE-CONFIGURED VARIANTS
// ====================================================================================

/** StatusBadge สำหรับ Purchase Requisition */
export const PRStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge
    status={status}
    colorMap={PR_STATUS_COLORS}
    labelMap={PR_STATUS_LABELS}
    className={className}
  />
);

/** StatusBadge สำหรับ Request for Quotation */
export const RFQStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge
    status={status}
    colorMap={RFQ_STATUS_COLORS}
    labelMap={RFQ_STATUS_LABELS}
    className={className}
  />
);

/** StatusBadge สำหรับ Quotation */
export const QTStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge
    status={status}
    colorMap={QT_STATUS_COLORS}
    labelMap={QT_STATUS_LABELS}
    className={className}
  />
);

// ====================================================================================
// ACTIVE/INACTIVE STATUS BADGE - สำหรับ Master Data Lists
// ====================================================================================

export interface ActiveStatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

/** StatusBadge สำหรับแสดงสถานะ Active/Inactive */
export const ActiveStatusBadge: React.FC<ActiveStatusBadgeProps> = ({
  isActive,
  activeLabel = 'ใช้งาน',
  inactiveLabel = 'ไม่ใช้งาน',
  className = '',
}) => {
  return isActive ? (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      {activeLabel}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      {inactiveLabel}
    </span>
  );
};

// ====================================================================================
// VENDOR STATUS BADGE - สำหรับ Vendor List
// ====================================================================================

import type { VendorStatus } from '../../types/vendor-types';

const vendorStatusConfig: Record<VendorStatus, { label: string; colorClass: string; dotColor: string }> = {
  ACTIVE: {
    label: 'ใช้งาน',
    colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  INACTIVE: {
    label: 'ไม่ใช้งาน',
    colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-500',
  },
  SUSPENDED: {
    label: 'ระงับชั่วคราว',
    colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  BLACKLISTED: {
    label: 'ขึ้นบัญชีดำ',
    colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
};

export interface VendorStatusBadgeProps {
  status: VendorStatus;
  className?: string;
}

/** StatusBadge สำหรับ Vendor Status */
export const VendorStatusBadge: React.FC<VendorStatusBadgeProps> = ({ status, className = '' }) => {
  const config = vendorStatusConfig[status] || vendorStatusConfig.INACTIVE;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${config.colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
