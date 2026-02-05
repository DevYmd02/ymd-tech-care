import React from 'react';
import { Save, AlertTriangle } from 'lucide-react';

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
    hideCancel?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
    hideCancel = false
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ zIndex: 9999 }}>
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${config.iconBg.replace('bg-', 'bg-').replace('600', '100')} dark:${config.iconBg.replace('bg-', 'bg-').replace('600', '900')}/30 ${config.iconBg.replace('bg-', 'text-')} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon size={24} />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {description}
                    </p>

                    <div className="flex items-center gap-3 justify-center">
                        {!hideCancel && cancelText && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-colors flex items-center gap-2 ${config.confirmBtn}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
