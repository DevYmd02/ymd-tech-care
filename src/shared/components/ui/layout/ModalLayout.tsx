import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { styles } from '@/shared/constants/styles';

interface ModalLayoutProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when the modal starts closing */
    onClose: () => void;
    /** Modal title */
    title: string;
    /** Optional title icon */
    titleIcon?: React.ReactNode;
    /** Optional subtitle for dialog variant */
    subtitle?: string;
    /** Primary content */
    children: React.ReactNode;
    /** Optional footer elements */
    footer?: React.ReactNode;
    /** Modal style variant */
    variant?: 'window' | 'dialog';
    /** Modal width/size */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Loading state */
    isLoading?: boolean;
    /** Accent color for window header (e.g., bg-blue-600) */
    headerColor?: string;
    /** Custom z-index (default 50) */
    zIndex?: number;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'w-full h-full rounded-none',
};

export const ModalLayout: React.FC<ModalLayoutProps> = ({
    isOpen,
    onClose,
    title,
    titleIcon,
    subtitle,
    children,
    footer,
    variant = 'dialog',
    size = 'md',
    isLoading = false,
    headerColor = styles.bg.accent,
    zIndex = 50,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    // 1. Handle Animation & Delayed Mounting/Unmounting
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Small delay to ensure transition triggers after mounting
            const timer = setTimeout(() => setIsAnimating(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
            // Wait for transition to complete before unmounting
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // 2. Handle Escape Key Execution
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // 3. Handle Body Scroll Lock & Layout Shift Prevention
    useEffect(() => {
        if (!isOpen) return;

        // Calculate scrollbar width to prevent "jumping" content
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPadding = document.body.style.paddingRight;

        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.paddingRight = originalPadding;
        };
    }, [isOpen]);

    if (!shouldRender) return null;

    const modalContent = (
        <div 
            className={cn(
                "fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ease-in-out",
                isAnimating ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0",
                "bg-black/40 dark:bg-black/60"
            )}
            style={{ zIndex }}
            onClick={onClose} // Backdrop click
        >
            <div 
                className={cn(
                    `${styles.bg.surface} shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out`,
                    sizeClasses[size],
                    variant === 'window' ? "border-4 rounded-none h-full w-full" : "rounded-2xl w-full max-h-[90vh]",
                    variant === 'window' ? headerColor.replace('bg-', 'border-') : "",
                    isAnimating 
                        ? "opacity-100 translate-y-0 scale-100" 
                        : "opacity-0 translate-y-8 scale-95"
                )}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Header Section */}
                {variant === 'window' ? (
                    /* Classic Window Header */
                    <div className={cn(
                        headerColor,
                        "text-white px-4 py-2.5 font-bold text-sm flex justify-between items-center select-none flex-shrink-0"
                    )}>
                        <div className="flex items-center space-x-3">
                            {titleIcon}
                            <span className="uppercase font-black tracking-tighter">{title}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="bg-red-600 hover:bg-red-500 text-white rounded-md p-1 px-2 transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1 group"
                        >
                            <X size={16} className="group-hover:rotate-90 transition-transform" />
                            <span className="text-[10px] hidden sm:inline font-bold">CLOSE</span>
                        </button>
                    </div>
                ) : (
                    /* Elegant Dialog Header */
                    <div className={`flex items-center justify-between px-6 py-5 border-b ${styles.border.subtle} ${styles.bg.surface}`}>
                        <div className="flex items-center gap-4">
                            {titleIcon && (
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                    {titleIcon}
                                </div>
                            )}
                            <div>
                                <h2 className={`text-xl font-extrabold ${styles.text.primary} leading-tight`}>
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}

                {/* Body Content */}
                <div className={cn(
                    "flex-1 overflow-auto",
                    variant === 'window' ? "bg-gray-50 dark:bg-gray-800 p-2" : `p-6 ${styles.bg.surface}`
                )}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full border-t-4 border-b-4 border-blue-600 animate-spin"></div>
                                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-100 dark:border-blue-900/30 -z-10"></div>
                            </div>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        children
                    )}
                </div>

                {/* Footer Section */}
                {footer && (
                    <div className={cn(
                        `flex-shrink-0 px-6 py-4 border-t ${styles.border.subtle} bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm`,
                        variant === 'window' ? styles.bg.surface : ""
                    )}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
