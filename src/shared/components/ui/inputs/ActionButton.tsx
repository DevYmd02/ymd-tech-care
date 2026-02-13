import React from 'react';
import { styles } from '@/shared/constants/styles';

export interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'success' | 'danger' | 'default';
    disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, variant = 'default', disabled }) => {
    const baseClass = "flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border-2 shadow-sm text-xs font-bold transition-all uppercase select-none w-full sm:w-auto";
    
    // Use centralized styles from styles.ts
    const variants = {
        primary: styles.btnPrimaryOutline,
        success: styles.btnSuccessOutline,
        danger: styles.btnDangerOutline,
        default: styles.btnSecondaryOutline
    };

    return (
        <button 
            type="button" 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseClass} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {icon} <span>{label}</span>
        </button>
    );
};
