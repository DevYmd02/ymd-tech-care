import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StockValidationMessageProps {
    show: boolean;
    type?: 'error' | 'warning';
    message?: string;
}

export const StockValidationMessage: React.FC<StockValidationMessageProps> = ({ show, type = 'error', message }) => {
    if (!show || !message) return null;

    const isError = type === 'error';
    const bgClass = isError ? 'bg-red-50' : 'bg-amber-50';
    const textClass = isError ? 'text-red-600' : 'text-amber-600';
    const borderClass = isError ? 'border-red-200' : 'border-amber-200';

    return (
        <div className={`mt-1 w-full text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-in fade-in duration-200 border ${bgClass} ${textClass} ${borderClass}`}>
            <AlertCircle size={10} className="shrink-0" />
            <span className="truncate">{message}</span>
        </div>
    );
};
