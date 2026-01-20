/**
 * @file logger.ts
 * @description Centralized logging utility
 * @usage Use this instead of console.log/error to allow better control over logging
 */

// Check if we are in development mode
const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log info message (only in dev)
   */
  log: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log warning message (only in dev)
   */
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Log error message (always log, but formatted)
   * TODO: connect to Sentry/monitoring service in production
   */
  error: (message: string, error?: unknown) => {
    // Always log errors, but format them nicely
    if (isDev) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production, might want to send to Sentry
      console.error(message); // Keep minimal log for now
    }
  }
};
