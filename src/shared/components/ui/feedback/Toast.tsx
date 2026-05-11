
import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast as hotToast } from 'react-hot-toast';

// ====================================================================================
// TYPES & CONTEXT
// ====================================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  toast: (message: string | React.ReactNode, type?: ToastType, title?: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ====================================================================================
// PROVIDER COMPONENT
// ====================================================================================

/**
 * ToastProvider — Unified Toast System
 * 
 * Delegates all toast calls to `react-hot-toast` which is already rendered
 * by <Toaster /> in App.tsx. This eliminates the previous dual-toast problem
 * where both a custom toast UI and react-hot-toast rendered simultaneously.
 * 
 * All existing `useToast()` consumers continue working without any changes.
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const toast = useCallback((msg: string | React.ReactNode, t: ToastType = 'error') => {
    const message = typeof msg === 'string' ? msg : 'การดำเนินการเสร็จสิ้น';

    switch (t) {
      case 'success':
        hotToast.success(message);
        break;
      case 'error':
        hotToast.error(message);
        break;
      case 'warning':
        // react-hot-toast doesn't have a native "warning" — use a styled custom toast
        hotToast(message, { icon: '⚠️' });
        break;
      case 'info':
        hotToast(message, { icon: 'ℹ️' });
        break;
      default:
        hotToast(message);
    }
  }, []);

  const contextValue = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

// ====================================================================================
// HOOK
// ====================================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};