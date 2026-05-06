import React from 'react';

interface SavingOverlayProps {
    isVisible: boolean;
    title?: string;
    subtitle?: string;
}

export const SavingOverlay: React.FC<SavingOverlayProps> = ({ 
    isVisible, 
    title = 'กำลังบันทึกข้อมูล...', 
    subtitle = 'กรุณารอสักครู่ ระบบกำลังประมวลผล' 
}) => {
    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center transition-all animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex flex-col items-center text-center">
                    <span className="text-base font-bold text-slate-800 dark:text-white">{title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
                </div>
            </div>
        </div>
    );
};
