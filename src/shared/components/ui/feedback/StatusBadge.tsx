/**
 * @file StatusBadge.tsx
 * @description Unified Status Badge Component สำหรับแสดงสถานะเอกสารต่างๆ
 * @usage ใช้แสดง status เช่น PR, RFQ, QT, QC และสถานะทั่วไป
 * 
 * @example
 * <StatusBadge type="PR" status="APPROVED" />
 * <StatusBadge type="RFQ" status="SENT" />
 * <StatusBadge type="QT" status="SUBMITTED" />
 * <StatusBadge type="QC" status="WAITING_FOR_PO" />
 * <PRStatusBadge status="APPROVED" />
 * <RFQStatusBadge status="SENT" />
 * <QTStatusBadge status="SUBMITTED" />
 * <QCStatusBadge status="WAITING_FOR_PO" />
 * <ActiveStatusBadge isActive={true} />
 */

import React from 'react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export type ModuleType = 'PR' | 'RFQ' | 'QT' | 'QC' | 'PO';
export type StatusVariant = 'pending' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface ModuleStatusBadgeProps {
  type: ModuleType;
  status: string;
  className?: string;
}

export interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
  variant?: StatusVariant;  // Manual override
  size?: 'sm' | 'md';
  className?: string;
}

// ====================================================================================
// MODULE-BASED STATUS CONFIGURATION
// ====================================================================================

export interface StatusConfig {
  label: string;
  colorClass: string;
}

type ModuleStatusConfig = Record<string, StatusConfig>;

const statusConfig: Record<ModuleType, ModuleStatusConfig> = {
  PR: {
    DRAFT: {
      label: 'แบบร่าง',
      colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    },
    PENDING: {
      label: 'รออนุมัติ',
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    APPROVED: {
      label: 'อนุมัติแล้ว',
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    REJECTED: {
      label: 'ไม่อนุมัติ',
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
    },
    CANCELLED: {
      label: 'ยกเลิก',
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
    },
    COMPLETED: {
      label: 'เสร็จสมบูรณ์',
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
  },
  RFQ: {
    DRAFT: {
      label: 'แบบร่าง',
      colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    },
    SENT: {
      label: 'ส่งแล้ว',
      colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    IN_PROGRESS: {
      label: 'กำลังดำเนินการ',
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    CLOSED: {
      label: 'ปิดแล้ว',
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    CANCELLED: {
      label: 'ยกเลิก',
      colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
    },
    WAITING_FOR_PO: {
      label: 'รอเปิดใบสั่งซื้อ',
      colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    },
    PO_CREATED: {
      label: 'เปิดใบสั่งซื้อแล้ว',
      colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
  },
  QT: {
    DRAFT: {
      label: 'ร่าง',
      colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    SUBMITTED: {
      label: 'ได้รับแล้ว',
      colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    SELECTED: {
      label: 'เทียบราคาแล้ว',
      colorClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    REJECTED: {
      label: 'ไม่เลือก',
      colorClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    },
  },
  QC: {
    WAITING_FOR_PO: {
      label: 'รอเปิดใบสั่งซื้อ',
      colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    },
    PO_CREATED: {
      label: 'เปิดใบสั่งซื้อแล้ว',
      colorClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
  },
  PO: {
    DRAFT: {
      label: 'แบบร่าง',
      colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
    APPROVED: {
      label: 'อนุมัติแล้ว',
      colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    ISSUED: {
      label: 'ออกแล้ว',
      colorClass: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    CANCELLED: {
      label: 'ยกเลิก',
      colorClass: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
    },
  },
};

// ====================================================================================
// MAIN COMPONENT - Module-Based StatusBadge
// ====================================================================================

/**
 * Module-based StatusBadge - ใช้ type เพื่อกำหนด module และแสดง status ที่เหมาะสม
 */
export const ModuleStatusBadge: React.FC<ModuleStatusBadgeProps> = ({
  type,
  status,
  className = '',
}) => {
  const config = statusConfig[type]?.[status];
  
  // Fallback if status not found in config
  if (!config) {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 ${className}`}>
        {status}
      </span>
    );
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.colorClass} ${className}`}>
      {config.label}
    </span>
  );
};

// ====================================================================================
// LEGACY COMPONENT - StatusBadge (for backward compatibility)
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
  <ModuleStatusBadge type="PR" status={status} className={className} />
);

/** StatusBadge สำหรับ Request for Quotation */
export const RFQStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <ModuleStatusBadge type="RFQ" status={status} className={className} />
);

/** StatusBadge สำหรับ Quotation */
export const QTStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <ModuleStatusBadge type="QT" status={status} className={className} />
);

/** StatusBadge สำหรับ Quotation Comparison */
export const QCStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <ModuleStatusBadge type="QC" status={status} className={className} />
);

/** StatusBadge สำหรับ Purchase Order */
export const POStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <ModuleStatusBadge type="PO" status={status} className={className} />
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

import type { VendorStatus } from '@/modules/master-data/vendor/types/vendor-types';

const vendorStatusConfig: Record<VendorStatus, { label: string; colorClass: string; dotColor: string }> = {
  ACTIVE: {
    label: 'ใช้งาน (Active)',
    colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  INACTIVE: {
    label: 'ไม่ใช้งาน (Inactive)',
    colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-500',
  },
  SUSPENDED: {
    label: 'ระงับชั่วคราว (Suspended)',
    colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  BLACKLISTED: {
    label: 'บัญชีดำ (Blacklisted)',
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
