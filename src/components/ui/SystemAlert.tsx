import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface SystemAlertProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({ message, onClose, duration = 3000 }) => {
    
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <div className="fixed top-16 right-4 z-[60] bg-white dark:bg-gray-800 shadow-lg rounded-r-lg border-l-4 border-red-500 p-4 min-w-[320px] flex items-start gap-3 animate-in fade-in slide-in-from-top-5 duration-300">
            <div className="text-red-500 mt-0.5 bg-red-100 dark:bg-red-900/30 p-1 rounded-full">
                <AlertCircle size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-0.5">แจ้งเตือนระบบ</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
            </div>
            <button 
                onClick={onClose} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
                <X size={18} />
            </button>
        </div>
    );
};
