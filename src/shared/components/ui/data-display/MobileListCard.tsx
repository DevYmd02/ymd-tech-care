/**
 * @file MobileListCard.tsx
 * @description Shared mobile card component for list pages across the Procurement module.
 *   Replaces duplicated inline mobile card JSX with a single, reusable component.
 *   Full dark mode support via Tailwind dark: variants.
 */

import type { ReactNode } from 'react';

// ====================================================================================
// TYPES
// ====================================================================================

export interface MobileListCardDetail {
  label: string;
  value: ReactNode;
}

export interface MobileListCardProps {
  /** Primary document number shown in header (e.g. "PO-2024-001") */
  title: ReactNode;
  /** Status badge component passed as ReactNode */
  statusBadge: ReactNode;
  /** Subtitle below title (e.g. formatted date) */
  subtitle?: string;
  /** Key-value rows rendered in the card body */
  details: MobileListCardDetail[];
  /** Label for the footer amount row (e.g. "ยอดรวม") */
  amountLabel?: string;
  /** Amount value as a ReactNode (so callers can apply custom color/format) */
  amountValue?: ReactNode;
  /** Action buttons rendered in the footer */
  actions?: ReactNode;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

/**
 * MobileListCard
 * A standardized responsive card for mobile list views.
 * Usage: rendered inside `.md:hidden` containers as an alternative to SmartTable.
 */
export function MobileListCard({
  title,
  statusBadge,
  subtitle,
  details,
  amountLabel = 'ยอดรวม',
  amountValue,
  actions,
}: MobileListCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      {/* ── Header: Document No + Status ───────────────────────────────────────── */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400 truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        <div className="shrink-0">{statusBadge}</div>
      </div>

      {/* ── Body: Key-Value Detail Rows ─────────────────────────────────────────── */}
      {details.length > 0 && (
        <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1.5 border-t border-b border-slate-100 dark:border-slate-700 py-2">
          {details.map((row, i) => (
            <div key={i} className="flex justify-between items-start gap-2">
              <span className="text-gray-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                {row.label}
              </span>
              <span className="font-medium dark:text-slate-200 text-right min-w-0 truncate">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer: Amount + Actions ────────────────────────────────────────────── */}
      {(amountValue !== undefined || actions) && (
        <div className="space-y-3">
          {amountValue !== undefined && (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {amountLabel}
              </span>
              {amountValue}
            </div>
          )}
          {actions && (
            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================================================================================
// MOBILE CARD CONTAINER (Pagination wrapper)
// ====================================================================================

export interface MobileListContainerProps {
  isLoading: boolean;
  isEmpty: boolean;
  children: ReactNode;
  /** Mobile pagination controls */
  pagination?: {
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
}

/**
 * MobileListContainer
 * Wraps the card list with loading/empty states and mobile pagination.
 */
export function MobileListContainer({
  isLoading,
  isEmpty,
  children,
  pagination,
}: MobileListContainerProps) {
  return (
    <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-3 pb-20">
      {isLoading ? (
        <div className="text-center py-4 text-gray-500 dark:text-slate-400">
          กำลังโหลด...
        </div>
      ) : isEmpty ? (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
          ไม่พบข้อมูล
        </div>
      ) : (
        children
      )}

      {/* Mobile Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex justify-between items-center pt-2 text-sm text-gray-600 dark:text-slate-400">
          <div>ทั้งหมด {pagination.total} รายการ</div>
          <div className="flex gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="px-3 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 dark:text-slate-200"
            >
              &lt;
            </button>
            <span>
              {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="px-3 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 dark:text-slate-200"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
