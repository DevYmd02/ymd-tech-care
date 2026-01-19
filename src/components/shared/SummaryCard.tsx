/**
 * @file SummaryCard.tsx
 * @description Shared Summary Card Component สำหรับแสดงสรุปสถิติ
 * @usage ใช้ใน List Pages ต่างๆ เช่น PRListPage, RFQListPage
 */

import React from 'react';

export interface SummaryCardProps {
  title: string;
  count: number;
  subtitle: string;
  bgColor: string;
  icon: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  subtitle,
  bgColor,
  icon,
}) => (
  <div className={`${bgColor} rounded-xl p-4 flex items-start justify-between`}>
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
    <div className="text-gray-600">{icon}</div>
  </div>
);

export default SummaryCard;
