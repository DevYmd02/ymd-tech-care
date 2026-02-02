import React from 'react';
import { Minus, Maximize2, X } from 'lucide-react';
import { useWindowControls } from '../../hooks/useWindowControls';

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
    const { 
        isMaximized, 
        isMinimized, 
        isAnimating, 
        isClosing, 
        toggleMinimize, 
        toggleMaximize, 
        restore, 
        handleClose 
    } = useWindowControls(isOpen, onClose);

    if (!isOpen && !isClosing) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'} ${isMinimized ? 'bg-transparent pointer-events-none' : 'bg-black/50 dark:bg-black/70 backdrop-blur-sm'}`} 
            onClick={(e) => { if (e.target === e.currentTarget && !isMinimized) handleClose(); }}
        >
            <div className={`
                flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-4 ${headerColor.replace('bg-', 'border-')} dark:border-blue-500 transition-all duration-300 ease-out pointer-events-auto
                ${isMinimized 
                  ? 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[400px] h-auto rounded-xl ring-2 ring-white/20' 
                  : isMaximized 
                    ? 'w-full h-full rounded-none border-0 scale-100' 
                    : 'w-[120vw] h-[120vh] scale-[0.8] rounded-2xl'
                }
                ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
                {/* Title Bar */}
                <div 
                  className={`${headerColor} text-white px-3 py-2 font-bold text-sm flex justify-between items-center select-none flex-shrink-0 cursor-pointer`}
                  onClick={restore}
                >
                  <div className="flex items-center space-x-2">
                    {titleIcon}
                    <span>{title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button type="button" onClick={toggleMinimize} title={isMinimized ? "คืนค่าหน้าต่าง" : "พับหน้าต่าง"} className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-sm flex items-center justify-center transition-colors"><Minus size={12} strokeWidth={3} /></button>
                    <button type="button" onClick={toggleMaximize} title={isMaximized ? "ย่อขนาด" : "ขยายเต็มจอ"} disabled={isMinimized} className={`w-6 h-6 bg-white/20 hover:bg-white/30 rounded-sm flex items-center justify-center transition-colors ${isMinimized ? 'opacity-50' : ''}`}><Maximize2 size={12} strokeWidth={3} /></button>
                    <button type="button" onClick={handleClose} title="ปิด" className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded-sm flex items-center justify-center transition-colors"><X size={14} strokeWidth={3} /></button>
                  </div>
                </div>

                {!isMinimized && (
                <>
                    {/* Form Content */}
                    <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-1.5 space-y-1">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            {footer}
                        </div>
                    )}
                </>
                )}
            </div>
        </div>
    );
};
