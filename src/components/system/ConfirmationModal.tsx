import React from 'react';
import { Save, AlertTriangle, X } from 'lucide-react';

export type ConfirmationVariant = 'info' | 'danger' | 'warning' | 'success';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info'
}) => {
    if (!isOpen) return null;

    // Variant configurations
    const variantConfig = {
        info: {
            icon: Save,
            iconBg: 'bg-blue-600',
            confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
        danger: {
            icon: AlertTriangle,
            iconBg: 'bg-red-600',
            confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-orange-500',
            confirmBtn: 'bg-orange-500 hover:bg-orange-600 text-white',
        },
        success: {
            icon: Save,
            iconBg: 'bg-green-600',
            confirmBtn: 'bg-green-600 hover:bg-green-700 text-white',
        },
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-slate-700">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon Circle */}
                    <div className={`w-16 h-16 rounded-full ${config.iconBg} bg-opacity-10 flex items-center justify-center mb-4 ring-4 ring-opacity-20 ring-current`}>
                        <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center shadow-lg`}>
                            <Icon size={24} className="text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="flex w-full gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-700"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 ${config.confirmBtn}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
