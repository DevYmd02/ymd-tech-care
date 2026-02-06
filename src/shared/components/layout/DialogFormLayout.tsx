import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DialogFormLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    titleIcon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string; // Optional custom width (default to max-w-4xl)
    isLoading?: boolean;
    subtitle?: string;
}

export const DialogFormLayout: React.FC<DialogFormLayoutProps> = ({
    isOpen,
    onClose,
    title,
    titleIcon,
    children,
    footer,
    width = 'max-w-4xl',
    isLoading = false,
    subtitle
}) => {
    // Local animation state (mimicking WindowFormLayout but for Dialog style)
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    // Use Portal to render modal at document.body level
    // This ensures proper stacking context and backdrop coverage
    const modalContent = (
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'} bg-black/50 backdrop-blur-sm`}
            onClick={(e) => { 
                // Close on backdrop click
                if (e.target === e.currentTarget) onClose(); 
            }}
        >
            <div 
                className={`
                    bg-white dark:bg-gray-800 w-full ${width} max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden
                    transition-all duration-300 ease-out transform
                    ${isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        {titleIcon && React.isValidElement(titleIcon) && (
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                 {/* Ensure icon inherits color or set it explicitly if needed */}
                                 {React.cloneElement(titleIcon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 text-blue-600 dark:text-blue-400" })}
                            </div>
                         )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        children
                    )}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 z-10">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    // Render modal using Portal to document.body for proper stacking
    return createPortal(modalContent, document.body);
};
