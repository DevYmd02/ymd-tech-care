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
    
    console.error(`❌ [ERROR] [${getTimestamp()}] ${message}`, error);
  },
};
