/**
 * @file logger.ts
 * @description Centralized logging utility with environment checks and consistent formatting.
 * @usage Use this instead of console.log/error to allow better control over logging.
 */

// Check if we are in development mode
const isDev = import.meta.env.DEV;

// Reusable timestamp formatter
const getTimestamp = () => new Date().toISOString();

export const logger = {
  /**
   * Log info message (only in dev).
   * Compatible with existing `logger.log` calls.
   */
  log: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`ℹ️ [INFO] [${getTimestamp()}] ${message}`, ...args);
    }
  },

  /**
   * Log debug message (only in dev).
   */
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug(`🔍 [DEBUG] [${getTimestamp()}] ${message}`, ...args);
    }
  },

  /**
   * Log info message (only in dev).
   * Alias for log, but explicit semantics.
   */
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.info(`ℹ️ [INFO] [${getTimestamp()}] ${message}`, ...args);
    }
  },

  /**
   * Log warning message (only in dev).
   */
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`⚠️ [WARN] [${getTimestamp()}] ${message}`, ...args);
    }
  },

  /**
   * Log error message (always logs).
   * In production, this could be connected to monitoring services (Sentry, etc.).
   */
  error: (message: string, error?: unknown) => {
    // Always log errors, but format them nicely
    console.error(`❌ [ERROR] [${getTimestamp()}] ${message}`, error);
  },
};
