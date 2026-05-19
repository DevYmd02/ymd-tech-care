import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @file common-utils.ts
 * @description Consolidated utility functions for the entire project.
 */

// 1. UI Utility - Tailwind Class Merger
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 2. Number Utility - Format to Currency String
export const formatNumber = (value?: number | string | null): string => {
    if (value === undefined || value === null || value === '') return '-';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';

    return new Intl.NumberFormat('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

// 3. Logger Utility
const isDev = import.meta.env.DEV;
const getTimestamp = () => new Date().toISOString();
const timers = new Map<string, number>();

const DOC_NO_FIELDS = [
  'doc_no', 'pr_no', 'po_no', 'so_no', 'qt_no',
  'issue_req_no', 'issue_stk_no', 'appvissue_req_no',
  'transfer_req_no', 'return_issue_no',
  'rsv_no', 'do_no', 'inv_no',
  'code', 'no', 'number'
];

const DATE_FIELDS = [
  'doc_date', 'docu_date', 'date',
  'created_at', 'order_date', 'issue_date'
];

const STATUS_FIELDS = [
  'status', 'cancel_flag', 'appv_flag', 'is_active'
];

const findField = (
  data: Record<string, unknown>,
  fields: string[]
): unknown =>
  fields.map(f => data[f]).find(
    v => v !== undefined && v !== null && v !== ''
  ) ?? 'N/A';

export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (isDev) console.log(`ℹ️ [INFO] [${getTimestamp()}] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) console.debug(`🔍 [DEBUG] [${getTimestamp()}] ${message}`, ...args);
  },
  info: (message: string, ...args: unknown[]) => {
    if (isDev) console.info(`ℹ️ [INFO] [${getTimestamp()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) console.warn(`⚠️ [WARN] [${getTimestamp()}] ${message}`, ...args);
  },
  error: (message: string, error?: unknown) => {
    // 🎯 SILENT 401: Don't spam the console with red errors if it's just a session expiry
    // These are already handled by the API interceptor
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) return;
    }

    // 🛡️ SILENT CANCELED: Don't spam console with CanceledError as it is normal component cleanup/strictmode behavior
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err.name === 'CanceledError' || err.__CANCEL__ === true || err.message === 'canceled') {
        return;
      }
    }
    
    console.error(`❌ [ERROR] [${getTimestamp()}] ${message}`, error);
    
    // TODO: Enable before production launch
    // if (!isDev) {
    //   import('@sentry/react').then(Sentry => {
    //     Sentry.captureException(error, { extra: { message } })
    //   })
    // }
  },
  payload: (moduleName: string, rawData: Record<string, unknown>) => {
    if (!isDev || !rawData) return;
    try {
      const safeData = {
        id: rawData['id'] || rawData['uuid'] || rawData['docu_item_id'] || undefined,
        doc_no: findField(rawData, DOC_NO_FIELDS),
        doc_date: findField(rawData, DATE_FIELDS),
        status: findField(rawData, STATUS_FIELDS),
        items_count: Array.isArray(rawData['lines'])
          ? rawData['lines'].length
          : Array.isArray(rawData['items'])
          ? rawData['items'].length
          : Array.isArray(rawData['line_items'])
          ? rawData['line_items'].length
          : 0,
        warehouse: rawData['warehouse_id'] || undefined,
        branch: rawData['branch_id'] || undefined,
      };
      console.log(`🛡️ [SAFE PAYLOAD] [${getTimestamp()}] [${moduleName}]`, safeData);
    } catch {
      // ignore
    }
  },
  time: (label: string) => {
    if (isDev) {
      timers.set(label, performance.now());
    }
  },
  timeEnd: (label: string, warnThresholdMs = 100) => {
    if (isDev) {
      const startTime = timers.get(label);
      if (startTime !== undefined) {
        const duration = performance.now() - startTime;

        if (duration > warnThresholdMs) {
          console.warn(
            `🐢 [SLOW] [${getTimestamp()}] ${label}: ${duration.toFixed(2)}ms (threshold: ${warnThresholdMs}ms)`
          );
        } else {
          console.log(
            `⏱️ [TIMER] [${getTimestamp()}] ${label}: ${duration.toFixed(2)}ms`
          );
        }
        timers.delete(label);
      }
    }
  },
};
