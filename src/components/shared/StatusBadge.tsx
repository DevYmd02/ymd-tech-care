/**
 * @file StatusBadge.tsx
 * @description Generic Status Badge Component
 * @usage ใช้แสดงสถานะเอกสารต่างๆ (PR, RFQ, PO, etc.)
 */

import React from 'react';
import {
  PR_STATUS_COLORS,
  PR_STATUS_LABELS,
  RFQ_STATUS_COLORS,
  RFQ_STATUS_LABELS,
} from '../../constants/statusConstants';

// ====================================================================================
// COMPONENT
// ====================================================================================

export interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap = PR_STATUS_COLORS,
  labelMap = PR_STATUS_LABELS,
  className = '',
}) => {
  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700';
  const label = labelMap[status] || status;

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};

// ====================================================================================
// PRE-CONFIGURED VARIANTS
// ====================================================================================

export const PRStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <StatusBadge
    status={status}
    colorMap={PR_STATUS_COLORS}
    labelMap={PR_STATUS_LABELS}
  />
);

export const RFQStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <StatusBadge
    status={status}
    colorMap={RFQ_STATUS_COLORS}
    labelMap={RFQ_STATUS_LABELS}
  />
);

export default StatusBadge;
