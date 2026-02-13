import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface WindowFormLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon: React.ReactNode;
    headerColor?: string; // e.g., 'bg-blue-600'
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const WindowFormLayout: React.FC<WindowFormLayoutProps> = ({
    isOpen,
    onClose,
    title,
    titleIcon,
    headerColor = 'bg-blue-600',
    children,
    footer
}) => {
    // Local animation state to replace useWindowControls
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setTimeout(() => {
                setIsAnimating(true);
            }, 10);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Match duration-300
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'} bg-black/50 dark:bg-black/70 backdrop-blur-sm`} 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`
                flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-4 ${headerColor.replace('bg-', 'border-')} dark:border-blue-500 transition-all duration-300 ease-out pointer-events-auto
                w-full h-full rounded-none border-0 scale-100
                ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
                {/* Title Bar - Preserved styling */}
                <div 
                  className={`${headerColor} text-white px-3 py-2 font-bold text-sm flex justify-between items-center select-none flex-shrink-0 cursor-default`}
                >
                  <div className="flex items-center space-x-2">
                    {titleIcon}
                    <span>{title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* Removed Minimize/Maximize Buttons */}
                    <button type="button" onClick={onClose} title="ปิด" className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded-sm flex items-center justify-center transition-colors"><X size={14} strokeWidth={3} /></button>
                  </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-0">
                    <div className="h-full p-1.5 space-y-1">
                         {children}
                    </div>
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
