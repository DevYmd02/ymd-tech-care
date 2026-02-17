
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, X, CheckCircle, Info } from 'lucide-react';

// ====================================================================================
// TYPES & CONTEXT
// ====================================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ====================================================================================
// UI COMPONENT (Internal)
// ====================================================================================

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: ToastType;
  isVisible?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'error', isVisible = true }) => {
  const borderColors = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500'
  };
  
  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const Icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info
  };

  const Icon = Icons[type];

  const titles = {
    success: 'สำเร็จ',
    error: 'ข้อผิดพลาด',
    warning: 'คำเตือน',
    info: 'ข้อมูล'
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-[9999] bg-white dark:bg-gray-800 border ${borderColors[type]} dark:border-gray-700 shadow-xl shadow-black/20 dark:shadow-black/50 rounded-md p-4 flex items-start space-x-3 animate-bounce-in transition-all min-w-[300px]`}>
       <div className={`p-2 rounded-full hidden sm:block ${type === 'success' ? 'bg-green-50 dark:bg-green-900/20' : type === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
         <Icon className={iconColors[type]} size={20} />
       </div>
       <div className="flex-1 pt-1">
          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{titles[type]}</h4>
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{message}</p>
       </div>
       <button 
         onClick={onClose} 
         type="button" 
         className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
       >
         <X size={16} />
       </button>
    </div>
  );
};

// ====================================================================================
// PROVIDER COMPONENT
// ====================================================================================

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('error');
  const [isVisible, setIsVisible] = useState(false);

  const toast = useCallback((msg: string, t: ToastType = 'error') => {
    setMessage(msg);
    setType(t);
    setIsVisible(true);
    
    // Auto close after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }, []);

  const closeToast = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toast 
        message={message} 
        type={type} 
        isVisible={isVisible} 
        onClose={closeToast} 
      />
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
